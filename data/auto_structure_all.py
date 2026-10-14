#!/usr/bin/env python3
"""
Script unificado de estructuración AI para abilities y enhancements.
Reemplaza auto_structure.py y auto_structure_enhancements.py.

Uso:
  python auto_structure_all.py "Space Marines"                    # abilities + enhancements
  python auto_structure_all.py "Space Marines" --mode abilities   # solo abilities
  python auto_structure_all.py "Space Marines" --mode enhancements # solo enhancements
  python auto_structure_all.py "Space Marines" --unit captain     # una unidad
  python auto_structure_all.py "Space Marines" --detachment gladius-task-force
  python auto_structure_all.py "Space Marines" --no-children

API directa:
  pip install anthropic
  ANTHROPIC_API_KEY=<tu_clave>

AWS Bedrock:
  pip install "anthropic[bedrock]"
  CLAUDE_CODE_USE_BEDROCK=1
  AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
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


# ---------------------------------------------------------------------------
# Shared Effect Schema (7 categories, appliedTo per effect, targetCondition)
# ---------------------------------------------------------------------------

EFFECT_SCHEMA = """
type Phase = "ANY" | "MOVEMENT" | "SHOOTING" | "CHARGE" | "FIGHT" | "COMMAND"
type Frequency = "always" | "perPhase" | "perRound" | "perBattle"
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
  condition: string    // e.g. "assault_doctrine", "devastator_doctrine", "tactical_doctrine", "riled_up"
  effects: Effect[]
}
"""


# ---------------------------------------------------------------------------
# ABILITIES mode
# ---------------------------------------------------------------------------

ABILITY_SCHEMA = """
interface StructuredAbility {
  name: string
  phase: Phase
  trigger: string           // "ALWAYS" or a yes/no question in Spanish
  autoApply?: boolean       // true when trigger should be skipped by simulator
  frequency?: Frequency     // absent = "always"
  groupId?: string          // shared ID for mutually exclusive abilities
  groupOperator?: "AND" | "OR"
  effectsOperator?: "AND" | "OR"
  effects: Effect[]         // each effect has its own appliedTo
  originalText?: string     // DO NOT SET - will be added automatically
}

interface OtherAbility {
  name: string
  category: "OTHER"
  text: string
}
"""

ABILITY_EXAMPLES = """
EXAMPLES:

Input: name="Zealous Fortitude", isPain=true, rules="This unit has Feel No Pain 4+ against mortal wounds."
Output:
{
  "name": "Zealous Fortitude", "phase": "ANY",
  "trigger": "ALWAYS", "autoApply": true,
  "effects": [{ "category": "damageMitigation", "appliedTo": "SelfModel", "kind": "fnp", "value": 4, "condition": "vsMortalWounds" }]
}

Input: name="Veteran Marksmen", rules="This unit's ranged attacks can re-roll hit rolls of 1."
Output:
{
  "name": "Veteran Marksmen", "phase": "SHOOTING",
  "trigger": "ALWAYS", "autoApply": true,
  "effects": [{ "category": "diceModifier", "appliedTo": "SelfModel", "roll": "toHit", "action": "rerollOnes", "attackType": "RANGE" }]
}

Input: name="Tactical Precision", rules="This unit's attacks have [Lethal Hits: non-MONSTER/VEHICLE]."
Output:
{
  "name": "Tactical Precision", "phase": "ANY",
  "trigger": "ALWAYS", "autoApply": true,
  "effects": [{ "category": "weaponKeyword", "appliedTo": "SelfUnit", "weaponTarget": "ALL", "keyword": "LETHAL HITS", "value": null, "targetCondition": { "keywords": ["MONSTER", "VEHICLE"], "mode": "excludes" } }]
}

Input: name="Finest Hour", rules="In the Fight phase, when this unit is selected to fight, this model's melee attacks have: +3 A. [Devastating Wounds]."
Output:
{
  "name": "Finest Hour", "phase": "FIGHT",
  "trigger": "ALWAYS", "autoApply": true,
  "effects": [
    { "category": "statModifier", "appliedTo": "SelfModel", "weaponTarget": "MELEE", "stat": "Attacks", "mode": "add", "value": 3 },
    { "category": "weaponKeyword", "appliedTo": "SelfModel", "weaponTarget": "MELEE", "keyword": "DEVASTATING WOUNDS", "value": null }
  ]
}

Input: name="Close-quarters Firestorm", rules="This unit's attacks that target an enemy unit within 9\\" of this unit have +1 S."
Output:
{
  "name": "Close-quarters Firestorm", "phase": "ANY",
  "trigger": "¿El objetivo está a 9\\" o menos de esta unidad?",
  "effects": [{ "category": "statModifier", "appliedTo": "SelfUnit", "weaponTarget": "ALL", "stat": "Strength", "mode": "add", "value": 1 }]
}

Input: name="Terror Troops (Aura)", rules="While an enemy model is within 3\\" of this unit, that enemy model has -1 OC."
Output:
{
  "name": "Terror Troops", "phase": "ANY",
  "trigger": "¿Hay un enemigo a 3\\" o menos de esta unidad?",
  "effects": [{ "category": "statModifier", "appliedTo": "Enemy", "stat": "ObjectiveControl", "mode": "subtract", "value": 1 }]
}

Input: name="Strategic Acumen", rules="In your Command phase, you can use this ability. Select one combat doctrine to be active for this unit."
Output:
{ "name": "Strategic Acumen", "category": "OTHER", "text": "In your Command phase, you can use this ability. Select one combat doctrine to be active for this unit." }

Input: name="Leader", rules="Before the battle, in the Muster Armies step..."
Output:
{ "name": "Leader", "category": "OTHER", "text": "Before the battle, in the Muster Armies step..." }
"""

ABILITY_SYSTEM_PROMPT = f"""You are a Warhammer 40K rules structuring assistant. Given a unit's abilities, output a JSON array of structured abilities.

SCHEMA:
{EFFECT_SCHEMA}
{ABILITY_SCHEMA}

{ABILITY_EXAMPLES}

RULES:
- Output ONLY a JSON array. No markdown, no explanation.
- Each element is either a StructuredAbility or OtherAbility.
- Use OTHER for: movement abilities, command phase abilities, pre-game abilities, abilities with no combat simulation effect, Leader, Support, transport abilities.
- For multi-effect abilities under one trigger, combine all effects in one StructuredAbility.
- Strip all HTML tags from text before using it in trigger or text fields.
- The trigger field must be "ALWAYS" or a concise yes/no question in Spanish (e.g. "¿El objetivo es un MONSTRUO o VEHÍCULO?").
- Set autoApply to true when the trigger is "ALWAYS" or when the condition is always true in the relevant phase.
- Set phase to the specific game phase the ability applies in. Use "ANY" only when it genuinely applies in all phases.
- Each effect MUST have its own appliedTo field. Use "SelfModel" for single-model effects, "SelfUnit" for whole-unit effects, "Enemy" for debuffs, "Ally" for buffs on friendly units.
- For conditional effects based on faction state (assault doctrine, devastator doctrine, riled up), use separate StructuredAbility entries with the appropriate trigger question, OR use effectsOperator "OR" with different effects.
- Do NOT set originalText - it will be added automatically.
- frequency defaults to "always". Use "perBattle" for once-per-battle abilities, "perRound" for once-per-round, "perPhase" for once-per-phase.
"""


# ---------------------------------------------------------------------------
# ENHANCEMENTS mode
# ---------------------------------------------------------------------------

ENHANCEMENT_SCHEMA = """
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

ENHANCEMENT_EXAMPLES = """
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

ENHANCEMENT_SYSTEM_PROMPT = f"""You are a Warhammer 40K rules structuring assistant. Given a detachment's enhancements, output a JSON array of StructuredEnhancement objects.

SCHEMA:
{EFFECT_SCHEMA}
{ENHANCEMENT_SCHEMA}

{ENHANCEMENT_EXAMPLES}

RULES:
- Output ONLY a JSON array. No markdown, no explanation.
- Each element is a StructuredEnhancement.
- Strip all HTML tags from text before using it in originalText.
- The slug should be a kebab-case version of the enhancement name.
- For enhancementType "upgrade", appliedTo is typically "SelfUnit". For "miniature", appliedTo is typically "SelfModel".
- If an enhancement grants a weapon profile (e.g. "has the following weapon:"), set effects to empty and originalText to the full text.
- If an enhancement has effects conditional on a specific doctrine being active, put the base effects in "effects" and the doctrine-conditional effects in "conditionalEffects" with condition set to the doctrine name (e.g. "assault_doctrine", "devastator_doctrine", "tactical_doctrine").
- For Ork enhancements conditional on "riled up", use condition "riled_up" in conditionalEffects.
- For aura effects ("while a friendly unit within X" of this model"), use appliedTo "Ally".
- For effects that modify enemy attacks targeting this unit, use appliedTo "Enemy".
- For complex abilities that cannot be mapped to the Effect types (movement, deployment, command phase, embarking), set effects to [] and keep the full originalText.
"""


# ---------------------------------------------------------------------------
# API call helpers
# ---------------------------------------------------------------------------

def _parse_response(raw: str) -> list[dict]:
    raw = raw.strip()
    raw = re.sub(r'^```json\s*', '', raw)
    raw = re.sub(r'^```\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    return json.loads(raw)


def structure_unit_abilities(client, unit_name: str, abilities: list[dict]) -> list[dict]:
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
        system=ABILITY_SYSTEM_PROMPT,
        messages=[{'role': 'user', 'content': user_msg}],
    )

    return _parse_response(message.content[0].text)


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
        system=ENHANCEMENT_SYSTEM_PROMPT,
        messages=[{'role': 'user', 'content': user_msg}],
    )

    return _parse_response(message.content[0].text)


# ---------------------------------------------------------------------------
# Processing loops
# ---------------------------------------------------------------------------

def process_abilities(client, faction_slug_str: str, unit_filter: str | None = None):
    base_path = Path(__file__).parent / faction_slug_str / 'BaseData'
    if not base_path.exists():
        print(f"  SKIP abilities: no BaseData directory for {faction_slug_str}")
        return

    if unit_filter:
        unit_file = base_path / f"{unit_filter}.json"
        if not unit_file.exists():
            print(f"  ERROR: No se encontró {unit_file}")
            return
        unit_files = [unit_file]
        output_path = Path(__file__).parent / faction_slug_str / 'ai-abilities' / f"{unit_filter}.json"
        proposals: dict[str, dict] = {}
    else:
        unit_files = sorted(base_path.glob('*.json'))
        output_path = Path(__file__).parent / faction_slug_str / 'structuring_proposals.json'
        proposals = {}

    print(f"  Abilities: procesando {len(unit_files)} unidades…")

    for i, unit_file in enumerate(unit_files, 1):
        unit_slug_str = unit_file.stem
        key = f"{faction_slug_str}/{unit_slug_str}"
        print(f"    [{i}/{len(unit_files)}] {unit_slug_str}…", end=' ', flush=True)

        try:
            with open(unit_file) as f:
                unit_data = json.load(f)

            abilities = structure_unit_abilities(client, unit_data.get('name', unit_slug_str), unit_data.get('abilities', []))
            ab_rules = {a['name']: strip_html(a['rules']) for a in unit_data.get('abilities', []) if a.get('rules') and a['rules'] != '-'}
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
    print(f"  Guardado en {output_path}")


def process_enhancements(client, faction_slug_str: str, detachment_filter: str | None = None):
    faction_dir = Path(__file__).parent / faction_slug_str
    faction_data_path = faction_dir / "faction_data.json"

    if not faction_data_path.exists():
        print(f"  SKIP enhancements: no faction_data.json for {faction_slug_str}")
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

    targets = unique_detachments if parent_slug else detachments
    print(f"  Enhancements: procesando {len(targets)} detachments…")

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


def process_faction(client, faction_slug_str: str, mode: str, unit_filter: str | None = None, detachment_filter: str | None = None):
    print(f"\n{'='*60}")
    print(f"  {faction_slug_str}")
    print(f"{'='*60}")

    if mode in ('all', 'abilities'):
        process_abilities(client, faction_slug_str, unit_filter)
    if mode in ('all', 'enhancements'):
        process_enhancements(client, faction_slug_str, detachment_filter)


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Genera propuestas de estructuración unificada (abilities + enhancements).')
    parser.add_argument('faction', help='Nombre de la facción, e.g. "Space Marines"')
    parser.add_argument('--mode', choices=['all', 'abilities', 'enhancements'], default='all', help='Qué procesar (default: all)')
    parser.add_argument('--unit', help='Slug de una unidad concreta (solo modo abilities)')
    parser.add_argument('--detachment', help='Slug de un detachment concreto (solo modo enhancements)')
    parser.add_argument('--no-children', action='store_true', help='No procesar subfacciones hijas')
    args = parser.parse_args()

    faction_name = args.faction
    faction_slug_str = slugify(faction_name)

    client = _build_client()
    process_faction(client, faction_slug_str, args.mode, unit_filter=args.unit, detachment_filter=args.detachment)

    if not args.no_children and not args.unit and not args.detachment:
        children = get_children(faction_slug_str)
        for child_slug in children:
            child_dir = Path(__file__).parent / child_slug
            if child_dir.exists():
                process_faction(client, child_slug, args.mode)

    print("\nHecho.")


if __name__ == '__main__':
    main()
