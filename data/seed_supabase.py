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

def seed_loadout(client, faction_slug: str, override_confirmed: bool = False):
    faction_dir = DATA_DIR / faction_slug
    loadout_proposals = {}

    loadout_path = faction_dir / "loadout_proposals.json"
    if loadout_path.exists():
        loadout_proposals = json.loads(loadout_path.read_text())

    ai_loadout_dir = faction_dir / "ai-loadout"
    if ai_loadout_dir.exists():
        for f in ai_loadout_dir.glob("*.json"):
            data = json.loads(f.read_text())
            loadout_proposals.update(data)

    confirmed = set() if override_confirmed else get_confirmed_slugs(client, "loadout_data", faction_slug)
    count = 0
    skipped = 0
    for key, value in loadout_proposals.items():
        parts = key.split("/")
        if len(parts) != 2 or parts[0] != faction_slug:
            continue
        unit_slug = parts[1]
        if unit_slug in confirmed:
            skipped += 1
            continue
        client.table("loadout_data").upsert({
            "faction_slug": faction_slug,
            "unit_slug": unit_slug,
            "tag": value.get("tag", "AI_PROPOSED"),
            "options": value.get("options", []),
        }).execute()
        count += 1
    if count:
        print(f"  Subiendo {count} loadout proposals...")
    if skipped:
        print(f"  Saltando {skipped} loadouts ya CONFIRMED (usa --override-confirmed para forzar)")


def get_confirmed_slugs(client, table: str, faction_slug: str) -> set[str]:
    result = client.table(table).select("unit_slug").eq("faction_slug", faction_slug).eq("tag", "CONFIRMED").execute()
    return {row["unit_slug"] for row in (result.data or [])}


def seed_faction(client, faction_slug: str, faction_name: str, category: str, loadout_only: bool = False, detachments_only: bool = False, override_confirmed: bool = False):
    faction_dir = DATA_DIR / faction_slug

    if loadout_only:
        print(f"  Solo loadout para {faction_name}")
        seed_loadout(client, faction_slug, override_confirmed=override_confirmed)
        return

    if detachments_only:
        print(f"  Solo detachments para {faction_name}")
        seed_detachments(client, faction_slug, override_confirmed=override_confirmed)
        return

    icon_path = f"/icons/{faction_slug}-icon.svg"

    units_path = faction_dir / "units.json"
    units = []
    if units_path.exists():
        units_data = json.loads(units_path.read_text())
        units = units_data.get("units", [])

    army_rules = None
    faction_data_path = faction_dir / "faction_data.json"
    if faction_data_path.exists():
        faction_data = json.loads(faction_data_path.read_text())
        army_rules = faction_data.get("army_rules")

    print(f"  Upserting facción: {faction_name} ({len(units)} unidades)")
    client.table("factions").upsert({
        "slug": faction_slug,
        "name": faction_name,
        "category": category,
        "icon": icon_path,
        "unit_count": len(units),
        "army_rules": army_rules,
    }).execute()

    if not units:
        return

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
        confirmed = set() if override_confirmed else get_confirmed_slugs(client, "unit_data", faction_slug)
        proposals = json.loads(proposals_path.read_text())
        count = 0
        skipped = 0
        for key, value in proposals.items():
            parts = key.split("/")
            if len(parts) != 2 or parts[0] != faction_slug:
                continue
            unit_slug = parts[1]
            if unit_slug in confirmed:
                skipped += 1
                continue
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
        if skipped:
            print(f"  Saltando {skipped} unidades ya CONFIRMED (usa --override-confirmed para forzar)")

    seed_loadout(client, faction_slug, override_confirmed=override_confirmed)
    seed_detachments(client, faction_slug, override_confirmed=override_confirmed)


def get_parent_detachment_slugs(faction_slug: str) -> set[str]:
    """Returns the set of detachment slugs that belong to the parent faction."""
    parent = PARENT_FACTION.get(faction_slug)
    if not parent:
        return set()
    parent_data_path = DATA_DIR / parent / "faction_data.json"
    if not parent_data_path.exists():
        return set()
    parent_data = json.loads(parent_data_path.read_text())
    return {det["slug"] for det in parent_data.get("detachments", []) if det.get("slug")}


def seed_detachments(client, faction_slug: str, override_confirmed: bool = False):
    faction_dir = DATA_DIR / faction_slug
    faction_data_path = faction_dir / "faction_data.json"
    if not faction_data_path.exists():
        return

    faction_data = json.loads(faction_data_path.read_text())
    detachments = faction_data.get("detachments", [])
    if not detachments:
        return

    parent_slugs = get_parent_detachment_slugs(faction_slug)

    enhancement_proposals = {}
    proposals_path = faction_dir / "enhancement_proposals.json"
    if proposals_path.exists():
        enhancement_proposals = json.loads(proposals_path.read_text())

    confirmed = set() if override_confirmed else get_confirmed_detachment_slugs(client, faction_slug)
    count = 0
    skipped = 0
    inherited = 0
    for det in detachments:
        det_slug = det.get("slug")
        if not det_slug:
            continue
        if det_slug in parent_slugs:
            inherited += 1
            continue
        if det_slug in confirmed:
            skipped += 1
            continue
        proposal_key = f"{faction_slug}/{det_slug}"
        structured = enhancement_proposals.get(proposal_key)
        tag = "AI_PROPOSED" if structured else "SCRAPED"
        client.table("detachment_data").upsert({
            "faction_slug": faction_slug,
            "detachment_slug": det_slug,
            "tag": tag,
            "data": det,
            "enhancements": structured,
        }).execute()
        count += 1
    if count:
        print(f"  Subiendo {count} detachments...")
    if inherited:
        print(f"  Saltando {inherited} detachments heredados del padre")
    if skipped:
        print(f"  Saltando {skipped} detachments ya CONFIRMED (usa --override-confirmed para forzar)")


def get_confirmed_detachment_slugs(client, faction_slug: str) -> set[str]:
    result = client.table("detachment_data").select("detachment_slug").eq("faction_slug", faction_slug).eq("tag", "CONFIRMED").execute()
    return {row["detachment_slug"] for row in (result.data or [])}


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Seed Supabase tables from local data files.')
    parser.add_argument('--faction', required=True, help='Nombre de la facción o ALL para todas')
    parser.add_argument('--loadout-only', action='store_true', help='Solo subir loadout proposals (desde loadout_proposals.json y ai-loadout/)')
    parser.add_argument('--detachments-only', action='store_true', help='Solo subir detachments (desde faction_data.json y enhancement_proposals.json)')
    parser.add_argument('--override-confirmed', action='store_true', help='Sobreescribir registros CONFIRMED (por defecto se saltan)')
    args = parser.parse_args()

    client = get_client()
    factions_by_category = load_factions()

    all_factions = []
    for category, factions in factions_by_category.items():
        for f in factions:
            all_factions.append({**f, "category": category})

    if args.faction.upper() == "ALL":
        parents = [f for f in all_factions if f["slug"] not in PARENT_FACTION]
        children = [f for f in all_factions if f["slug"] in PARENT_FACTION]
        targets = parents + children
    else:
        query = args.faction.lower()
        targets = [f for f in all_factions if f["slug"] == query or f["name"].lower() == query]
        if not targets:
            slug_guess = slugify(args.faction)
            targets = [f for f in all_factions if f["slug"] == slug_guess]
        if not targets:
            print(f"Facción no encontrada: {args.faction}")
            sys.exit(1)
        matched_slug = targets[0]["slug"]
        children = [f for f in all_factions if PARENT_FACTION.get(f["slug"]) == matched_slug]
        if children:
            targets = targets + children

    for faction in targets:
        print(f"\n--- {faction['name']} ({faction['slug']}) ---")
        seed_faction(client, faction["slug"], faction["name"], faction["category"], loadout_only=args.loadout_only, detachments_only=args.detachments_only, override_confirmed=args.override_confirmed)

    print("\nSeed completado.")

if __name__ == "__main__":
    main()
