"""Seed Supabase tables from local data files.

Usage:
    python3 data/seed_supabase.py <faction-name-or-slug>
    python3 data/seed_supabase.py --all

Requires SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.
Install: pip install supabase
"""

import json
import os
import re
import sys
from pathlib import Path

try:
    from supabase import create_client
except ImportError:
    print("Instala supabase: pip install supabase")
    sys.exit(1)

DATA_DIR = Path(__file__).parent

def slugify(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def get_client():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.")
        sys.exit(1)
    return create_client(url, key)

def load_factions() -> dict[str, list[dict]]:
    """Returns {category: [{name, slug, url}, ...]}"""
    factions_path = DATA_DIR / "factions.json"
    if not factions_path.exists():
        print(f"No se encontró {factions_path}")
        sys.exit(1)
    return json.loads(factions_path.read_text())

def seed_faction(client, faction_slug: str, faction_name: str, category: str):
    faction_dir = DATA_DIR / faction_slug

    units_path = faction_dir / "units.json"
    if not units_path.exists():
        print(f"  No se encontró {units_path}, saltando unidades.")
        return

    units_data = json.loads(units_path.read_text())
    units = units_data.get("units", [])

    icon_path = f"/icons/{faction_slug}-icon.svg"

    print(f"  Upserting facción: {faction_name} ({len(units)} unidades)")
    client.table("factions").upsert({
        "slug": faction_slug,
        "name": faction_name,
        "category": category,
        "icon": icon_path,
        "unit_count": len(units),
    }).execute()

    for unit in units:
        slug = unit["slug"]
        points_raw = unit.get("points")
        points = int(points_raw) if points_raw and str(points_raw).isdigit() else None

        client.table("units").upsert({
            "faction_slug": faction_slug,
            "slug": slug,
            "name": unit["name"],
            "category": unit.get("category"),
            "points": points,
            "keywords": [],
        }).execute()

    base_data_dir = faction_dir / "BaseData"
    if base_data_dir.exists():
        base_files = list(base_data_dir.glob("*.json"))
        print(f"  Subiendo {len(base_files)} BaseData files...")
        for bf in base_files:
            unit_slug = bf.stem
            data = json.loads(bf.read_text())
            client.table("base_data").upsert({
                "faction_slug": faction_slug,
                "unit_slug": unit_slug,
                "data": data,
            }).execute()

    proposals_path = faction_dir / "structuring_proposals.json"
    if proposals_path.exists():
        proposals = json.loads(proposals_path.read_text())
        count = 0
        for key, value in proposals.items():
            parts = key.split("/")
            if len(parts) != 2 or parts[0] != faction_slug:
                continue
            unit_slug = parts[1]
            client.table("unit_data").upsert({
                "faction_slug": faction_slug,
                "unit_slug": unit_slug,
                "tag": value.get("tag", "PENDING"),
                "abilities": value.get("abilities", []),
                "raw_abilities": value.get("rawAbilities", []),
                "base_data_hash": value.get("baseDataHash"),
            }).execute()
            count += 1
        if count:
            print(f"  Subiendo {count} structured abilities (proposals)...")

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 data/seed_supabase.py <faction-name-or-slug>")
        print("     python3 data/seed_supabase.py --all")
        sys.exit(1)

    client = get_client()
    factions_by_category = load_factions()

    all_factions = []
    for category, factions in factions_by_category.items():
        for f in factions:
            all_factions.append({**f, "category": category})

    if sys.argv[1] == "--all":
        targets = all_factions
    else:
        query = sys.argv[1].lower()
        targets = [f for f in all_factions if f["slug"] == query or f["name"].lower() == query]
        if not targets:
            slug_guess = slugify(sys.argv[1])
            targets = [f for f in all_factions if f["slug"] == slug_guess]
        if not targets:
            print(f"Facción no encontrada: {sys.argv[1]}")
            sys.exit(1)

    for faction in targets:
        print(f"\n--- {faction['name']} ({faction['slug']}) ---")
        seed_faction(client, faction["slug"], faction["name"], faction["category"])

    print("\nSeed completado.")

if __name__ == "__main__":
    main()
