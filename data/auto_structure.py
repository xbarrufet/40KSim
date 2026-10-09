#!/usr/bin/env python3
"""
Genera propuestas de estructuración de habilidades usando Claude API.
Lee los BaseData de una facción y produce structuring_proposals.json.

Uso:
  python auto_structure.py <nombre_faccion>
  python auto_structure.py "Space Marines"

Modo API directa (por defecto):
  pip install anthropic
  ANTHROPIC_API_KEY=<tu_clave>

Modo AWS Bedrock:
  pip install "anthropic[bedrock]"
  CLAUDE_CODE_USE_BEDROCK=1
  AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
  ANTHROPIC_MODEL=arn:aws:bedrock:<region>:<account>:inference-profile/<profile>
"""

import json
import os
import re
import sys
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: Instala anthropic: pip install anthropic")
    sys.exit(1)

#MODEL = os.environ.get('ANTHROPIC_MODEL', 'us.anthropic.claude-sonnet-4-20250514-v1:0')
MODEL="eu.anthropic.claude-haiku-4-5-20251001-v1:0" 


def _build_client():
    if os.environ.get('CLAUDE_CODE_USE_BEDROCK', '').strip() == '1':
        try:
            import boto3  # noqa: F401
        except ImportError:
            print('ERROR: Para usar Bedrock instala: pip install "anthropic[bedrock]"')
            sys.exit(1)
        region = os.environ.get('AWS_REGION', 'us-east-1')
        print(f"Using model: {MODEL}")
        return anthropic.AnthropicBedrock(aws_region=region)
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print("ERROR: Define ANTHROPIC_API_KEY o activa CLAUDE_CODE_USE_BEDROCK=1 para usar Bedrock")
        sys.exit(1)
    return anthropic.Anthropic(api_key=api_key)


EFFECT_SCHEMA = """
type AttackType = "SHOOTING" | "FIGHT" | "ANY"
type AppliesTo = "SelfModel" | "SelfUnit" | "Enemy" | "Ally"
type UnitStat = "Movement" | "Toughness" | "Save" | "Invulnerable" | "Wounds" | "ObjectiveControl" | "Leadership"
type WeaponStat = "Strength" | "Damage" | "Range" | "Attacks" | "AP" | "Skill"
type WeaponTarget = "ALL" | "RANGE" | "MELEE"

interface StatModifierEffect {
  category: "statModifier"
  target: "unit" | "weapon"
  weaponTarget?: WeaponTarget        // required when target="weapon"
  stat: UnitStat | WeaponStat
  mode: "add" | "subtract" | "setValue" | "halve"
  value?: number                     // absent when mode="halve"
}

interface DiceModifierEffect {
  category: "diceModifier"
  roll: "toHit" | "toWound" | "savingThrow"
  action: "rerollOnes" | "rerollFailed" | "rerollAll" | "addToRoll" | "subtractFromRoll" | "autoSuccess" | "ignoreModifiers"
  attackType?: "RANGE" | "MELEE" | "ALL"
}

interface WeaponKeywordEffect {
  category: "weaponKeyword"
  weaponTarget: WeaponTarget
  keyword: string   // from: IGNORES COVER, LETHAL HITS, DEVASTATING WOUNDS, SUSTAINED HITS, TORRENT, TWIN-LINKED, HEAVY, HAZARDOUS, PRECISION, BLAST, RAPID FIRE, ANTI-FLY, ANTI-VEHICLE
  value: string | null
}

interface DamageMitigationEffect {
  category: "damageMitigation"
  kind: "fnp" | "damageReduction" | "damageHalved" | "fightOnDeath"
  value?: number
  condition?: "any" | "vsMortalWounds" | "vsPsychic"
}

type Effect = StatModifierEffect | DiceModifierEffect | WeaponKeywordEffect | DamageMitigationEffect

interface StructuredAbility {
  type: "Always" | "AsLeader" | "Alone"
  name: string
  attackType: AttackType
  trigger: string       // "ALWAYS" or a yes/no question for the simulator
  appliedTo: AppliesTo
  effects: Effect[]
}

interface OtherAbility {
  type: "Always" | "AsLeader" | "Alone"
  name: string
  category: "OTHER"
  text: string          // verbatim ability text
}
"""

EXAMPLES = """
EXAMPLES:

Input: name="Zealous Fortitude", isPain=true, rules="This unit has Feel No Pain 4+ against mortal wounds."
Output:
{
  "type": "Always", "name": "Zealous Fortitude", "attackType": "ANY",
  "trigger": "ALWAYS", "appliedTo": "SelfModel",
  "effects": [{ "category": "damageMitigation", "kind": "fnp", "value": 4, "condition": "vsMortalWounds" }]
}

Input: name="Veteran Marksmen", isPain=false, rules="This unit's ranged attacks can re-roll hit rolls of 1."
Output:
{
  "type": "Always", "name": "Veteran Marksmen", "attackType": "SHOOTING",
  "trigger": "ALWAYS", "appliedTo": "SelfModel",
  "effects": [{ "category": "diceModifier", "roll": "toHit", "action": "rerollOnes", "attackType": "RANGE" }]
}

Input: name="Tactical Precision", isPain=false, rules="This unit's attacks have [Lethal Hits: non-MONSTER/VEHICLE]."
Output:
{
  "type": "Always", "name": "Tactical Precision", "attackType": "ANY",
  "trigger": "¿El objetivo no es un MONSTRUO ni VEHÍCULO?", "appliedTo": "SelfModel",
  "effects": [{ "category": "weaponKeyword", "weaponTarget": "ALL", "keyword": "LETHAL HITS", "value": null }]
}

Input: name="Finest Hour", isPain=false, rules="In the Fight phase, when this unit is selected to fight, this model's melee attacks have: +3 A. [Devastating Wounds]."
Output:
{
  "type": "Always", "name": "Finest Hour", "attackType": "FIGHT",
  "trigger": "ALWAYS", "appliedTo": "SelfModel",
  "effects": [
    { "category": "statModifier", "target": "weapon", "weaponTarget": "MELEE", "stat": "Attacks", "mode": "add", "value": 3 },
    { "category": "weaponKeyword", "weaponTarget": "MELEE", "keyword": "DEVASTATING WOUNDS", "value": null }
  ]
}

Input: name="Strategic Acumen", isPain=false, rules="In your Command phase, you can use this ability. Select one combat doctrine to be active for this unit."
Output:
{ "type": "Always", "name": "Strategic Acumen", "category": "OTHER", "text": "In your Command phase, you can use this ability. Select one combat doctrine to be active for this unit." }

Input: name="Leader", isPain=false, rules="Before the battle, in the Muster Armies step..."
Output:
{ "type": "AsLeader", "name": "Leader", "category": "OTHER", "text": "Before the battle, in the Muster Armies step..." }
"""

SYSTEM_PROMPT = f"""You are a Warhammer 40K rules structuring assistant. Given a unit's abilities, output a JSON array of structured abilities.

SCHEMA:
{EFFECT_SCHEMA}

{EXAMPLES}

RULES:
- Output ONLY a JSON array. No markdown, no explanation.
- Each element is either a StructuredAbility or OtherAbility.
- Use OTHER for: movement abilities, command phase abilities, pre-game abilities, abilities with no combat simulation effect.
- Use "AsLeader" type for abilities that only work while leading another unit.
- Use "Alone" type for Lone Operative abilities.
- Use "Always" type for everything else.
- For multi-effect abilities under one trigger, combine all effects in one StructuredAbility.
- Strip all HTML tags from text before using it in trigger or text fields.
- The trigger field must be "ALWAYS" or a concise yes/no question in Spanish (e.g. "¿El objetivo es un MONSTRUO o VEHÍCULO?").
"""


def strip_html(text: str) -> str:
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'&lt;', '<', text)
    text = re.sub(r'&gt;', '>', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'\r\n|\r', '\n', text)
    text = re.sub(r'\n+', ' ', text)
    return text.strip()


def slug(name: str) -> str:
    return name.lower().replace(' ', '-').replace("'", '').replace(',', '')


def structure_unit(client: anthropic.Anthropic, unit_name: str, abilities: list[dict]) -> list[dict]:
    relevant = []
    for ab in abilities:
        rules = ab.get('rules', '').strip()
        if not rules or rules == '-':
            continue
        relevant.append({
            'name': ab['name'],
            'isPain': ab.get('isPain', False),
            'isAura': ab.get('isAura', False),
            'abilityType': ab.get('abilityType', ''),
            'rules': strip_html(rules),
        })

    if not relevant:
        return []

    abilities_text = '\n'.join(
        f"- name={json.dumps(a['name'])}, isPain={a['isPain']}, isAura={a['isAura']}, "
        f"abilityType={json.dumps(a['abilityType'])}, rules={json.dumps(a['rules'])}"
        for a in relevant
    )
    user_msg = f"Unit: {unit_name}\n\nAbilities:\n{abilities_text}"

    message = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{'role': 'user', 'content': user_msg}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code fences if present
    raw = re.sub(r'^```json\s*', '', raw)
    raw = re.sub(r'^```\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)

    return json.loads(raw)


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Genera propuestas de estructuración de habilidades.')
    parser.add_argument('faction', help='Nombre de la facción, e.g. "Space Marines"')
    parser.add_argument('--unit', help='Slug de una unidad concreta, e.g. assault-intercessors-with-jump-packs')
    args = parser.parse_args()

    faction_name = args.faction
    faction_slug_str = slug(faction_name)
    base_path = Path(__file__).parent / faction_slug_str / 'BaseData'

    if not base_path.exists():
        print(f"ERROR: No se encontró {base_path}")
        print("Ejecuta primero fetch_datasheets.py para esta facción.")
        sys.exit(1)

    client = _build_client()

    if args.unit:
        unit_file = base_path / f"{args.unit}.json"
        if not unit_file.exists():
            print(f"ERROR: No se encontró {unit_file}")
            sys.exit(1)
        unit_files = [unit_file]
        proposals: dict[str, dict] = {}
        output_path = Path(__file__).parent / faction_slug_str / 'ai-abilities' / f"{args.unit}.json"
    else:
        unit_files = sorted(base_path.glob('*.json'))
        main_path = Path(__file__).parent / faction_slug_str / 'structuring_proposals.json'
        proposals = {}
        if main_path.exists():
            with open(main_path, encoding='utf-8') as f:
                proposals = json.load(f)
        output_path = main_path

    print(f"Procesando {len(unit_files)} unidades de {faction_name}…")

    for i, unit_file in enumerate(unit_files, 1):
        unit_slug_str = unit_file.stem
        key = f"{faction_slug_str}/{unit_slug_str}"
        print(f"  [{i}/{len(unit_files)}] {unit_slug_str}…", end=' ', flush=True)

        try:
            with open(unit_file) as f:
                unit_data = json.load(f)

            abilities = structure_unit(client, unit_data.get('name', unit_slug_str), unit_data.get('abilities', []))
            ab_rules = {a['name']: a['rules'] for a in unit_data.get('abilities', []) if a.get('rules')}
            for ab in abilities:
                name = ab.get('name', '')
                if not re.search(r'\s+\(efecto \d+\)$', name) and name in ab_rules:
                    ab['originalText'] = ab_rules[name]
            proposals[key] = {
                'tag': 'AI_PROPOSED',
                'abilities': abilities,
                'rawAbilities': [],
            }
            print(f"OK ({len(abilities)} habilidades)")
        except Exception as e:
            print(f"ERROR: {e}")
            proposals[key] = {
                'tag': 'AI_PROPOSED',
                'abilities': [],
                'rawAbilities': [],
            }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(proposals, f, ensure_ascii=False, indent=2)

    print(f"\nGuardado en {output_path}")
    print(f"Importa este archivo en la app con el botón 'Importar propuestas IA'.")


if __name__ == '__main__':
    main()
