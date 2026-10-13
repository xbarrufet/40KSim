#!/usr/bin/env python3
"""
Descarga los datasheets completos de todas las unidades de una faccion.
Requiere que exista <slug>/units.json generado por fetch_units.py.

Uso:
  python fetch_datasheets.py <nombre_faccion>
  python fetch_datasheets.py --all
"""

import json
import re
import sys
import time
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "beautifulsoup4"])
    import requests
    from bs4 import BeautifulSoup

BASE_URL = "https://www.40k.app"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
DATA_DIR = Path(__file__).parent
REQUEST_DELAY = 3


def get_page(url, retries=3, retry_delay=15):
    for attempt in range(retries):
        r = requests.get(url, headers=HEADERS)
        if r.status_code == 429 and attempt < retries - 1:
            wait = retry_delay * (attempt + 1)
            print(f"(429, reintentando en {wait}s)", end=' ', flush=True)
            time.sleep(wait)
            continue
        r.raise_for_status()
        return r.text


def extract_datasheet(url):
    """Extrae el JSON del datasheet de una pagina de unidad."""
    html = get_page(url)
    for script in BeautifulSoup(html, 'html.parser').find_all('script'):
        s = script.string or ''
        if 'toughness' not in s or len(s) < 5000:
            continue
        m = re.match(r'self\.__next_f\.push\(\[1,"(.*)"\]\)$', s, re.DOTALL)
        if not m:
            cleaned = s.replace('\\\\\\"', '__QUOTE__')
            cleaned = cleaned.replace('\\"', '"')
            cleaned = cleaned.replace('__QUOTE__', '\\"')
        else:
            cleaned = json.loads('"' + m.group(1) + '"')

        match = re.search(r'"datasheet":(\{.+?\}),"release"', cleaned)
        if match:
            return json.loads(match.group(1))
    return None


def fetch_faction_datasheets(faction_slug, faction_name, skip_parent=None):
    units_file = DATA_DIR / faction_slug / "units.json"
    if not units_file.exists():
        print(f"Error: {units_file} no encontrado. Ejecuta primero fetch_units.py")
        return None

    with open(units_file, 'r', encoding='utf-8') as f:
        units_data = json.load(f)

    units = units_data['units']
    total = len(units)

    parent_slugs = set()
    if skip_parent:
        parent_bd = DATA_DIR / skip_parent / "BaseData"
        if parent_bd.exists():
            parent_slugs = {f.stem for f in parent_bd.glob("*.json")}

    base_data_dir = DATA_DIR / faction_slug / "BaseData"
    base_data_dir.mkdir(parents=True, exist_ok=True)

    already = sum(1 for unit in units if (base_data_dir / f"{unit['slug']}.json").exists())
    skipped_parent = sum(1 for unit in units if unit['slug'] in parent_slugs)

    print(f"\n{'='*60}")
    print(f"  {faction_name} — datasheets ({total} unidades)")
    if skip_parent and skipped_parent:
        print(f"  ({skipped_parent} heredadas de {skip_parent}, {total - skipped_parent} propias)")
    if already:
        print(f"  ({already} ya descargados, descargando restantes)")
    print(f"{'='*60}\n")

    downloaded = 0
    errors = []

    for i, unit in enumerate(units):
        target = base_data_dir / f"{unit['slug']}.json"
        if target.exists():
            continue
        if unit['slug'] in parent_slugs:
            continue
        print(f"  [{i+1}/{total}] {unit['name']}...", end=' ', flush=True)
        try:
            ds = extract_datasheet(unit['url'])
            if ds:
                with open(target, 'w', encoding='utf-8') as f:
                    json.dump(ds, f, indent=2, ensure_ascii=False)
                downloaded += 1
                print("OK")
            else:
                print("NO DATA")
                errors.append(unit['name'])
        except Exception as e:
            print(f"ERROR: {e}")
            errors.append(unit['name'])
        time.sleep(REQUEST_DELAY)

    total_on_disk = sum(1 for unit in units if (base_data_dir / f"{unit['slug']}.json").exists())

    print(f"\n  Guardados en {base_data_dir}")
    print(f"  Datasheets: {total_on_disk}/{total} ({downloaded} nuevos esta ejecucion)")
    if errors:
        print(f"  Errores: {errors}")

    return {"faction": faction_name, "slug": faction_slug, "units_count": total_on_disk}


def load_factions():
    factions_file = DATA_DIR / "factions.json"
    if not factions_file.exists():
        print("Error: factions.json no encontrado")
        sys.exit(1)
    with open(factions_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def find_faction(factions, search_term):
    search_lower = search_term.lower().strip()
    for category, faction_list in factions.items():
        for faction in faction_list:
            if faction['name'].lower() == search_lower:
                return faction
            if faction['slug'].lower() == search_lower:
                return faction
    for category, faction_list in factions.items():
        for faction in faction_list:
            if search_lower in faction['name'].lower():
                return faction
    return None


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Descarga datasheets de una facción.')
    parser.add_argument('faction', nargs='?', help='Nombre de la facción o --all')
    parser.add_argument('--all', action='store_true', help='Descargar todas las facciones')
    parser.add_argument('--skip-parent', help='Slug de la facción padre para saltar unidades heredadas (e.g. space-marines)')
    args = parser.parse_args()

    if not args.faction and not args.all:
        parser.print_help()
        sys.exit(1)

    factions = load_factions()

    if args.all:
        all_factions = []
        for category, faction_list in factions.items():
            all_factions.extend(faction_list)
        print(f"Descargando datasheets de {len(all_factions)} facciones...")
        for faction in all_factions:
            try:
                fetch_faction_datasheets(faction['slug'], faction['name'], skip_parent=args.skip_parent)
            except Exception as e:
                print(f"  ERROR con {faction['name']}: {e}")
    else:
        faction = find_faction(factions, args.faction)
        if not faction:
            print(f"Faccion '{args.faction}' no encontrada")
            sys.exit(1)
        fetch_faction_datasheets(faction['slug'], faction['name'], skip_parent=args.skip_parent)


if __name__ == "__main__":
    main()
