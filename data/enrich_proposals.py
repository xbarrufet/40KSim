#!/usr/bin/env python3
"""
Enriquece structuring_proposals.json con el campo originalText
leyendo BaseData localmente, sin llamar a la API de Anthropic.

Uso:
  python3 enrich_proposals.py <nombre_faccion>
  python3 enrich_proposals.py "Space Marines"

Es idempotente: no sobreescribe originalText si ya está presente.
"""

import json
import re
import sys
from pathlib import Path


def slug(name: str) -> str:
    return name.lower().replace(' ', '-')


def main():
    if len(sys.argv) < 2:
        print("Uso: python enrich_proposals.py <nombre_faccion>")
        print("Ejemplo: python enrich_proposals.py \"Space Marines\"")
        sys.exit(1)

    faction_name = sys.argv[1]
    faction_slug_str = slug(faction_name)
    base_path = Path(__file__).parent / faction_slug_str / 'BaseData'
    proposals_path = Path(__file__).parent / faction_slug_str / 'structuring_proposals.json'

    if not proposals_path.exists():
        print(f"ERROR: No se encontró {proposals_path}")
        sys.exit(1)

    with open(proposals_path, encoding='utf-8') as f:
        proposals = json.load(f)

    updated = 0
    skipped = 0
    missing_base = 0

    for key, unit_data in proposals.items():
        parts = key.split('/')
        if len(parts) != 2:
            continue
        unit_slug_str = parts[1]
        unit_file = base_path / f"{unit_slug_str}.json"

        if not unit_file.exists():
            missing_base += 1
            continue

        with open(unit_file, encoding='utf-8') as f:
            base_data = json.load(f)

        ab_rules = {
            a['name']: a['rules']
            for a in base_data.get('abilities', [])
            if a.get('rules')
        }

        for ab in unit_data.get('abilities', []):
            if 'effects' not in ab:
                continue
            name = ab.get('name', '')
            if re.search(r'\s+\(efecto \d+\)$', name):
                continue
            if 'originalText' in ab:
                skipped += 1
                continue
            if name in ab_rules:
                ab['originalText'] = ab_rules[name]
                updated += 1

    with open(proposals_path, 'w', encoding='utf-8') as f:
        json.dump(proposals, f, ensure_ascii=False, indent=2)
        f.write('\n')

    print(f"Actualizado: {updated} habilidades")
    print(f"Ya tenían originalText: {skipped}")
    print(f"Sin BaseData: {missing_base} unidades")
    print(f"Guardado en {proposals_path}")


if __name__ == '__main__':
    main()
