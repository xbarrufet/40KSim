#!/usr/bin/env python3
"""
Genera propuestas de estructuración de enhancements de detachments usando Claude API.
Lee faction_data.json y produce enhancement_proposals.json.

Uso:
  python auto_structure_enhancements.py <nombre_faccion>
  python auto_structure_enhancements.py "Space Marines"
  python auto_structure_enhancements.py "Space Marines" --detachment gladius-task-force

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

MODEL = "eu.anthropic.claude-haiku-4-5-20251001-v1:0"


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
type AppliesTo = "SelfModel" | "SelfUnit" | "Enemy" | "Ally"
type UnitStat = "Movement" | "Toughness" | "Save" | "Invulnerable" | "Wounds" | "ObjectiveControl" | "Leadership"
type WeaponStat = "Strength" | "Damage" | "Range" | "Attacks" | "AP" | "Skill"
type WeaponTarget = "ALL" | "RANGE" | "MELEE"
type TargetConditionKeyword = "VEHICLE" | "INFANTRY" | "MONSTER" | "CHARACTER" | "MOUNTED" | "FLY" | "WALKER" | "TITANIC"

interface TargetCondition {
  keywords: TargetConditionKeyword[]
  mode: "includes" | "excludes"
}

interface StatModifierEffect {
  category: "statModifier"
  appliedTo: AppliesTo
  weaponTarget?: WeaponTarget
  stat: UnitStat | WeaponStat
  mode: "add" | "subtract" | "setValue" | "halve"
  value?: number
  targetCondition?: TargetCondition
}

interface DiceModifierEffect {
  category: "diceModifier"
  appliedTo: AppliesTo
  roll: "toHit" | "toWound" | "savingThrow" | "damage" | "hazard" | "charge" | "battleshock"
  action: "rerollOnes" | "rerollFailed" | "rerollAll" | "addToRoll" | "subtractFromRoll" | "autoSuccess" | "ignoreModifiers"
  attackType?: WeaponTarget
  targetCondition?: TargetCondition
}

interface WeaponKeywordEffect {
  category: "weaponKeyword"
  appliedTo: AppliesTo
  weaponTarget: WeaponTarget
  keyword: string
  value: string | null
  targetCondition?: TargetCondition
}

interface DamageMitigationEffect {
  category: "damageMitigation"
  appliedTo: AppliesTo
  kind: "fnp" | "damageReduction" | "damageHalved" | "fightOnDeath"
  value?: number
  condition?: "any" | "vsMortalWounds" | "vsPsychic"
}

interface UnitKeywordEffect {
  category: "unitKeyword"
  appliedTo: AppliesTo
  keyword: string
  value: string | null
}

interface HealEffect {
  category: "heal"
  appliedTo: AppliesTo
  amount?: string
}

interface MortalWoundsEffect {
  category: "mortalWounds"
  appliedTo: AppliesTo
  unitType: "ALL" | TargetConditionKeyword
  hits: { kind: "notation"; value: string } | { kind: "byStat"; stat: string }
  resolution: { kind: "always" } | { kind: "roll"; threshold: number }
  damagePerSuccess: string
}

type Effect = StatModifierEffect | DiceModifierEffect | WeaponKeywordEffect | DamageMitigationEffect | UnitKeywordEffect | HealEffect | MortalWoundsEffect

interface ConditionalEffects {
  condition: string    // e.g. "assault_doctrine", "devastator_doctrine", "tactical_doctrine"
  effects: Effect[]
}

interface StructuredEnhancement {
  slug: string
  name: string
  points: number
  enhancementType: "upgrade" | "miniature"
  limit: number
  eligibility: {
    keywords: string[]
    excludedKeywords: string[]
    isEquipableByEpicHero: boolean
    isEquipableByNonCharacterUnit: boolean
  }
  effects: Effect[]
  conditionalEffects: ConditionalEffects[]
  originalText: string
}
"""

EXAMPLES = """
EXAMPLES:

Input enhancement: name="Furious Assault (Upgrade)", points=10, enhancementType="upgrade", limit=3,
  eligibility={keywords:["Infantry"]}, rules="Adeptus Astartes Infantry unit only. This unit's melee attacks have [Sustained Hits 1: non-Monster/Vehicle]."
Output:
{
  "slug": "furious-assault-upgrade",
  "name": "Furious Assault (Upgrade)",
  "points": 10, "enhancementType": "upgrade", "limit": 3,
  "eligibility": {"keywords": ["Infantry"], "excludedKeywords": [], "isEquipableByEpicHero": false, "isEquipableByNonCharacterUnit": true},
  "effects": [{"category": "weaponKeyword", "appliedTo": "SelfUnit", "weaponTarget": "MELEE", "keyword": "SUSTAINED HITS", "value": "1", "targetCondition": {"keywords": ["MONSTER", "VEHICLE"], "mode": "excludes"}}],
  "conditionalEffects": [],
  "originalText": "Adeptus Astartes Infantry unit only. This unit's melee attacks have [Sustained Hits 1: non-Monster/Vehicle]."
}

Input enhancement: name="Indefatigable Fortitude", points=20, enhancementType="miniature", limit=1,
  eligibility={keywords:["Gravis"]}, rules="Gravis model only. Attacks that target this unit with a S greater than this unit's T have -1 to wound rolls."
Output:
{
  "slug": "indefatigable-fortitude",
  "name": "Indefatigable Fortitude",
  "points": 20, "enhancementType": "miniature", "limit": 1,
  "eligibility": {"keywords": ["Gravis"], "excludedKeywords": [], "isEquipableByEpicHero": false, "isEquipableByNonCharacterUnit": false},
  "effects": [{"category": "diceModifier", "appliedTo": "Enemy", "roll": "toWound", "action": "subtractFromRoll", "attackType": "ALL"}],
  "conditionalEffects": [],
  "originalText": "Gravis model only. Attacks that target this unit with a S greater than this unit's T have -1 to wound rolls."
}

Input enhancement: name="Honour of Vigilance", points=20, enhancementType="miniature", limit=1,
  eligibility={keywords:[]}, rules="Adeptus Astartes model only. This unit's ranged attacks have [Lethal Hits]. If the devastator doctrine is active for this unit, this unit can re-roll advance rolls."
Output:
{
  "slug": "honour-of-vigilance",
  "name": "Honour of Vigilance",
  "points": 20, "enhancementType": "miniature", "limit": 1,
  "eligibility": {"keywords": [], "excludedKeywords": [], "isEquipableByEpicHero": false, "isEquipableByNonCharacterUnit": false},
  "effects": [{"category": "weaponKeyword", "appliedTo": "SelfUnit", "weaponTarget": "RANGE", "keyword": "LETHAL HITS", "value": null}],
  "conditionalEffects": [{"condition": "devastator_doctrine", "effects": [{"category": "diceModifier", "appliedTo": "SelfUnit", "roll": "charge", "action": "rerollAll"}]}],
  "originalText": "Adeptus Astartes model only. This unit's ranged attacks have [Lethal Hits]. If the devastator doctrine is active for this unit, this unit can re-roll advance rolls."
}

Input enhancement: name="Artificer Armour", points=15, enhancementType="miniature", limit=1,
  eligibility={keywords:[]}, rules="Adeptus Astartes model only. This model has: 2+ Sv. Feel No Pain 5+."
Output:
{
  "slug": "artificer-armour",
  "name": "Artificer Armour",
  "points": 15, "enhancementType": "miniature", "limit": 1,
  "eligibility": {"keywords": [], "excludedKeywords": [], "isEquipableByEpicHero": false, "isEquipableByNonCharacterUnit": false},
  "effects": [
    {"category": "statModifier", "appliedTo": "SelfModel", "stat": "Save", "mode": "setValue", "value": 2},
    {"category": "damageMitigation", "appliedTo": "SelfModel", "kind": "fnp", "value": 5, "condition": "any"}
  ],
  "conditionalEffects": [],
  "originalText": "Adeptus Astartes model only. This model has: 2+ Sv. Feel No Pain 5+."
}
"""

SYSTEM_PROMPT = f"""You are a Warhammer 40K rules structuring assistant. Given a detachment's enhancements, output a JSON array of StructuredEnhancement objects.

SCHEMA:
{EFFECT_SCHEMA}

{EXAMPLES}

RULES:
- Output ONLY a JSON array. No markdown, no explanation.
- Each element is a StructuredEnhancement.
- Strip all HTML tags from text before using it in originalText.
- The slug should be a kebab-case version of the enhancement name.
- For enhancementType "upgrade", appliedTo is typically "SelfUnit". For "miniature", appliedTo is typically "SelfModel".
- If an enhancement grants a weapon profile (e.g. "has the following weapon:"), use category OTHER as a single effect cannot represent that. Set effects to empty and originalText to the full text.
- If an enhancement has effects conditional on a specific doctrine being active, put the base effects in "effects" and the doctrine-conditional effects in "conditionalEffects" with condition set to the doctrine name (e.g. "assault_doctrine", "devastator_doctrine", "tactical_doctrine").
- For aura effects ("while a friendly unit within X\" of this model"), use appliedTo "Ally".
- For effects that modify enemy attacks targeting this unit, use appliedTo "Enemy".
- For complex abilities that cannot be mapped to the Effect types (movement, deployment, command phase, embarking), set effects to [] and keep the full originalText.
"""


def strip_html(text: str) -> str:
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'&lt;', '<', text)
    text = re.sub(r'&gt;', '>', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'\r\n|\r', '\n', text)
    text = re.sub(r'\n+', ' ', text)
    return text.strip()


def slugify(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def structure_detachment_enhancements(client, detachment_name: str, enhancements: list[dict]) -> list[dict]:
    if not enhancements:
        return []

    enh_descriptions = []
    for enh in enhancements:
        rules_text = strip_html(enh.get('rules', ''))
        if not rules_text:
            continue
        keywords = []
        for kg in enh.get('keywordGroups', []):
            keywords.extend(kg.get('keywords', []))
        enh_descriptions.append(
            f"- name={json.dumps(enh['name'])}, points={enh.get('points', 0)}, "
            f"enhancementType={json.dumps(enh.get('enhancementType', 'miniature'))}, "
            f"limit={enh.get('limit', 1)}, "
            f"eligibility={{keywords:{json.dumps(keywords)}, "
            f"excludedKeywords:{json.dumps(enh.get('excludedKeywords', []))}, "
            f"isEquipableByEpicHero:{json.dumps(enh.get('isEquipableByEpicHero', False))}, "
            f"isEquipableByNonCharacterUnit:{json.dumps(enh.get('isEquipableByNonCharacterUnit', False))}}}, "
            f"rules={json.dumps(rules_text)}"
        )

    if not enh_descriptions:
        return []

    user_msg = f"Detachment: {detachment_name}\n\nEnhancements:\n" + '\n'.join(enh_descriptions)

    message = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{'role': 'user', 'content': user_msg}],
    )

    raw = message.content[0].text.strip()
    raw = re.sub(r'^```json\s*', '', raw)
    raw = re.sub(r'^```\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)

    return json.loads(raw)


PARENT_FACTION: dict[str, str] = {
    'black-templars': 'space-marines',
    'blood-angels': 'space-marines',
    'dark-angels': 'space-marines',
    'deathwatch': 'space-marines',
    'emperors-children': 'space-marines',
    'imperial-fists': 'space-marines',
    'iron-hands': 'space-marines',
    'raven-guard': 'space-marines',
    'salamanders': 'space-marines',
    'space-wolves': 'space-marines',
    'ultramarines': 'space-marines',
    'white-scars': 'space-marines',
}


def get_children(parent_slug: str) -> list[str]:
    return [child for child, parent in PARENT_FACTION.items() if parent == parent_slug]


def process_faction(client, faction_slug_str: str, detachment_filter: str | None = None):
    """Procesa los detachments de una facción, escribiendo enhancement_proposals.json."""
    faction_dir = Path(__file__).parent / faction_slug_str
    faction_data_path = faction_dir / "faction_data.json"

    if not faction_data_path.exists():
        return

    with open(faction_data_path, encoding='utf-8') as f:
        faction_data = json.load(f)

    detachments = faction_data.get('detachments', [])
    if not detachments:
        return

    parent_slug = PARENT_FACTION.get(faction_slug_str)
    parent_det_slugs: set[str] = set()
    if parent_slug:
        parent_data_path = Path(__file__).parent / parent_slug / "faction_data.json"
        if parent_data_path.exists():
            with open(parent_data_path, encoding='utf-8') as f:
                parent_data = json.load(f)
            parent_det_slugs = {d['slug'] for d in parent_data.get('detachments', []) if d.get('slug')}

    if detachment_filter:
        detachments = [d for d in detachments if d.get('slug') == detachment_filter]
        if not detachments:
            print(f"  No se encontró detachment '{detachment_filter}'")
            return

    unique_detachments = [d for d in detachments if d.get('slug') not in parent_det_slugs]
    if not unique_detachments and parent_slug:
        print(f"  Todos los detachments son heredados de {parent_slug}, nada que procesar")
        return

    output_path = faction_dir / "enhancement_proposals.json"
    proposals: dict[str, list] = {}
    if output_path.exists():
        with open(output_path, encoding='utf-8') as f:
            proposals = json.load(f)

    targets = unique_detachments if parent_slug else detachments
    print(f"  Procesando {len(targets)} detachments…")

    for i, det in enumerate(targets, 1):
        det_slug = det.get('slug', '')
        det_name = det.get('name', det_slug)
        key = f"{faction_slug_str}/{det_slug}"
        enhancements = det.get('enhancements', [])
        print(f"    [{i}/{len(targets)}] {det_name} ({len(enhancements)} enhancements)…", end=' ', flush=True)

        if not enhancements:
            print("SKIP (sin enhancements)")
            proposals[key] = []
            continue

        try:
            structured = structure_detachment_enhancements(client, det_name, enhancements)
            proposals[key] = structured
            print(f"OK ({len(structured)} estructurados)")
        except Exception as e:
            print(f"ERROR: {e}")
            proposals[key] = []

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(proposals, f, ensure_ascii=False, indent=2)

    print(f"  Guardado en {output_path}")


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Genera propuestas de estructuración de enhancements.')
    parser.add_argument('faction', help='Nombre de la facción, e.g. "Space Marines"')
    parser.add_argument('--detachment', help='Slug de un detachment concreto, e.g. gladius-task-force')
    parser.add_argument('--no-children', action='store_true', help='No procesar subfacciones hijas')
    args = parser.parse_args()

    faction_name = args.faction
    faction_slug_str = slugify(faction_name)
    faction_dir = Path(__file__).parent / faction_slug_str
    faction_data_path = faction_dir / "faction_data.json"

    if not faction_data_path.exists():
        print(f"ERROR: No se encontró {faction_data_path}")
        print("Ejecuta primero fetch_faction_data.py para esta facción.")
        sys.exit(1)

    client = _build_client()

    print(f"\n{'='*60}")
    print(f"  {faction_name} ({faction_slug_str})")
    print(f"{'='*60}")
    process_faction(client, faction_slug_str, detachment_filter=args.detachment)

    if not args.no_children and not args.detachment:
        children = get_children(faction_slug_str)
        for child_slug in sorted(children):
            child_dir = Path(__file__).parent / child_slug
            if not (child_dir / "faction_data.json").exists():
                continue
            print(f"\n{'='*60}")
            print(f"  {child_slug} (hijo de {faction_slug_str})")
            print(f"{'='*60}")
            process_faction(client, child_slug)

    print("\nCompletado.")


if __name__ == '__main__':
    main()
