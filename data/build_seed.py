#!/usr/bin/env python3
"""
Genera el seed file app/public/data/units.json a partir de data/factions.json.
Solo incluye facciones (sin unidades). Las unidades se cargan via upload de BaseData.

Uso:
  python build_seed.py
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent
OUTPUT = DATA_DIR.parent / "app" / "public" / "data" / "units.json"


def main():
    factions_file = DATA_DIR / "factions.json"
    if not factions_file.exists():
        print("Error: factions.json no encontrado. Ejecuta primero fetch_factions.py")
        return

    with open(factions_file, "r", encoding="utf-8") as f:
        factions_by_category = json.load(f)

    catalog_factions = []
    for category, faction_list in factions_by_category.items():
        for faction in faction_list:
            catalog_factions.append({
                "id": faction["slug"],
                "slug": faction["slug"],
                "name": faction["name"],
                "category": category,
                "icon": f"/icons/{faction['slug']}-icon.svg",
                "units": [],
            })

    catalog = {
        "schemaVersion": 1,
        "factions": catalog_factions,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)

    print(f"Seed generado: {OUTPUT}")
    print(f"  {len(catalog_factions)} facciones (sin unidades)")


if __name__ == "__main__":
    main()
