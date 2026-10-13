#!/usr/bin/env python3
"""
Genera propuestas de estructuración de loadout (wargear options) usando Claude API.
Lee los BaseData de una facción y produce loadout_proposals.json.

Uso:
  python auto_loadout.py <nombre_faccion>
  python auto_loadout.py "Space Marines"
  python auto_loadout.py "Space Marines" --unit captain

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


WARGEAR_OPTION_SCHEMA = """
interface WargearRef {
  name: string          // weapon/item name as it appears in wargear catalogue
  wargearItemId: number // wargearItem.id from the catalogue
}

interface WargearScope {
  type: "model" | "allModels" | "anyNumber" | "ratio"
  role?: string         // e.g. "Sergeant", "Intercessor Sergeant" — only for role-specific rules
  ratio?: { per: number; count: number }  // only when type="ratio"
}

interface WargearChoice {
  items: { count: number; name: string; wargearItemId: number }[]
  grants?: WargearRef[]   // items returned/added alongside (e.g. Storm Bolter returned with Cyclone)
  locks?: number[]        // wargearItemIds that cannot be replaced after this choice
}

interface WargearOption {
  scope: WargearScope
  replaces: WargearRef[]      // items being removed (empty when isAdditional=true)
  choices: WargearChoice[]    // available replacement options
  isAdditional: boolean       // true for "can be equipped with" (no replacement)
  originalRuleId: number      // wargearRules[].id
  originalText: string        // verbatim rulesText
}
"""

EXAMPLES = """
EXAMPLES:

Input rule: "■ This model's Master-crafted Bolter and Heavy Bolt Pistol can be replaced with one of the following:\\n▫ 1 Neo-volkite Pistol\\n▫ 1 Plasma Pistol"
Wargear catalogue: Master-crafted Bolter (id:106195), Heavy Bolt Pistol (id:107345), Neo-volkite Pistol (id:107525), Plasma Pistol (id:108745)
Output:
{
  "scope": { "type": "model" },
  "replaces": [
    { "name": "Master-crafted Bolter", "wargearItemId": 106195 },
    { "name": "Heavy Bolt Pistol", "wargearItemId": 107345 }
  ],
  "choices": [
    { "items": [{ "count": 1, "name": "Neo-volkite Pistol", "wargearItemId": 107525 }] },
    { "items": [{ "count": 1, "name": "Plasma Pistol", "wargearItemId": 108745 }] }
  ],
  "isAdditional": false,
  "originalRuleId": 41018,
  "originalText": "■ This model's Master-crafted Bolter and Heavy Bolt Pistol can be replaced with one of the following:\\n▫ 1 Neo-volkite Pistol\\n▫ 1 Plasma Pistol"
}

Input rule: "■ The Intercessor Sergeant can have their Knives and Fists replaced with one of the following:\\n▫ 1 Chainsword\\n▫ 1 Power Fist"
Output: scope.type="model", scope.role="Intercessor Sergeant"

Input rule: "■ For every 5 models in this unit, 1 Terminator model can have their Storm Bolter replaced with one of the following:\\n▫ 1 Assault Cannon\\n▫ 1 Cyclone Missile Launcher and 1 Storm Bolter (that model's Storm Bolter cannot be replaced)."
Output: scope.type="ratio", scope.ratio={ per: 5, count: 1 }. The Cyclone choice has items=[Cyclone, Storm Bolter] and locks=[Storm Bolter id].

Input rule: "■ All models in this unit can each have their Assault Bolters replaced with 1 Plasma Exterminators."
Output: scope.type="allModels"

Input rule: "■ Any number of Terminator models can each have their Power Fist replaced with 1 Chainfist."
Output: scope.type="anyNumber"

Input rule: "■ This model can be equipped with 1 Ironhail Heavy Stubber."
Output: isAdditional=true, replaces=[], choices=[{items: [{count:1, name:"Ironhail Heavy Stubber", wargearItemId:...}]}]
"""

SYSTEM_PROMPT = f"""You are a Warhammer 40K wargear rules structuring assistant. Given a unit's wargear rules (text) and its wargear catalogue (with IDs), output a JSON array of structured WargearOption objects.

SCHEMA:
{WARGEAR_OPTION_SCHEMA}

{EXAMPLES}

RULES:
- Output ONLY a JSON array. No markdown, no explanation.
- Each element is a WargearOption.
- Every wargearItemId MUST reference an actual id from the provided wargear catalogue.
- If a weapon name in the rule text does not match any item in the catalogue, use the closest match by name.
- Preserve the originalRuleId and originalText from the input.
- For "can be equipped with" rules (no replacement), set isAdditional=true and replaces=[].
- For role-specific rules ("The Sergeant can..."), set scope.role to the full role name.
- For ratio rules ("For every N models, M can..."), set scope.type="ratio" with the ratio.
- For "All models" rules, set scope.type="allModels".
- For "Any number of models" rules, set scope.type="anyNumber".
- When a choice includes a constraint like "(that model's X cannot be replaced)", add the X wargearItemId to locks[].
- When a choice grants back an item that was replaced (e.g. replaces Storm Bolter but choice gives it back), include it in items and add to locks.
"""


def slug(name: str) -> str:
    return name.lower().replace(' ', '-').replace("'", '').replace(',', '')


def build_wargear_catalogue(unit_data: dict) -> list[dict]:
    catalogue = []
    seen = set()
    for entry in unit_data.get('miniatures', [{}])[0].get('wargear', []):
        item = entry.get('wargearItem', {})
        item_id = item.get('id')
        if item_id and item_id not in seen:
            seen.add(item_id)
            catalogue.append({'id': item_id, 'name': item.get('name', '')})
    for entry in unit_data.get('miniatures', [{}])[0].get('defaultWargear', []):
        item = entry.get('wargearItem', {})
        item_id = item.get('id')
        if item_id and item_id not in seen:
            seen.add(item_id)
            catalogue.append({'id': item_id, 'name': item.get('name', '')})
    return catalogue


def structure_loadout(client, unit_name: str, wargear_rules: list[dict], wargear_catalogue: list[dict]) -> list[dict]:
    if not wargear_rules:
        return []

    catalogue_text = '\n'.join(f"  - {item['name']} (id:{item['id']})" for item in wargear_catalogue)
    rules_text = '\n'.join(
        f"- id={r['id']}, rulesText={json.dumps(r['rulesText'])}"
        for r in wargear_rules
    )

    user_msg = f"Unit: {unit_name}\n\nWargear Catalogue:\n{catalogue_text}\n\nWargear Rules:\n{rules_text}"

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


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Genera propuestas de estructuración de loadout.')
    parser.add_argument('faction', help='Nombre de la facción, e.g. "Space Marines"')
    parser.add_argument('--unit', help='Slug de una unidad concreta, e.g. captain')
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
        output_path = Path(__file__).parent / faction_slug_str / 'ai-loadout' / f"{args.unit}.json"
    else:
        unit_files = sorted(base_path.glob('*.json'))
        main_path = Path(__file__).parent / faction_slug_str / 'loadout_proposals.json'
        proposals = {}
        if main_path.exists():
            with open(main_path, encoding='utf-8') as f:
                proposals = json.load(f)
        output_path = main_path

    print(f"Procesando loadout de {len(unit_files)} unidades de {faction_name}…")

    for i, unit_file in enumerate(unit_files, 1):
        unit_slug_str = unit_file.stem
        key = f"{faction_slug_str}/{unit_slug_str}"
        print(f"  [{i}/{len(unit_files)}] {unit_slug_str}…", end=' ', flush=True)

        try:
            with open(unit_file) as f:
                unit_data = json.load(f)

            wargear_rules = unit_data.get('wargearRules', [])
            if not wargear_rules:
                print("sin reglas de wargear, saltando")
                continue

            wargear_catalogue = build_wargear_catalogue(unit_data)
            options = structure_loadout(client, unit_data.get('name', unit_slug_str), wargear_rules, wargear_catalogue)

            proposals[key] = {
                'tag': 'AI_PROPOSED',
                'options': options,
            }
            print(f"OK ({len(options)} opciones)")
        except Exception as e:
            print(f"ERROR: {e}")
            proposals[key] = {
                'tag': 'AI_PROPOSED',
                'options': [],
            }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(proposals, f, ensure_ascii=False, indent=2)

    print(f"\nGuardado en {output_path}")
    print(f"Sube este archivo a Supabase con seed_supabase.py.")


if __name__ == '__main__':
    main()
