#!/usr/bin/env python3
"""
Descarga los datasheets completos de todas las unidades de una faccion.
Requiere que exista units_<slug>.json generado por fetch_units.py.

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


def fetch_faction_datasheets(faction_slug, faction_name):
    units_file = DATA_DIR / f"units_{faction_slug}.json"
    if not units_file.exists():
        print(f"Error: {units_file} no encontrado. Ejecuta primero fetch_units.py")
        return None

    with open(units_file, 'r', encoding='utf-8') as f:
        units_data = json.load(f)

    units = units_data['units']
    total = len(units)

    output_file = DATA_DIR / f"datasheets_{faction_slug}.json"
    existing = []
    existing_names = set()
    if output_file.exists():
        with open(output_file, 'r', encoding='utf-8') as f:
            prev = json.load(f)
            existing = prev.get('units', [])
            existing_names = {u['name'] for u in existing}

    print(f"\n{'='*60}")
    print(f"  {faction_name} — datasheets ({total} unidades)")
    if existing_names:
        print(f"  ({len(existing_names)} ya descargados, descargando restantes)")
    print(f"{'='*60}\n")

    results = list(existing)
    errors = []

    for i, unit in enumerate(units):
        if unit['name'] in existing_names:
            continue
        print(f"  [{i+1}/{total}] {unit['name']}...", end=' ', flush=True)
        try:
            ds = extract_datasheet(unit['url'])
            if ds:
                results.append(ds)
                print("OK")
            else:
                print("NO DATA")
                errors.append(unit['name'])
        except Exception as e:
            print(f"ERROR: {e}")
            errors.append(unit['name'])
        time.sleep(REQUEST_DELAY)

    output = {
        "faction": faction_name,
        "slug": faction_slug,
        "units_count": len(results),
        "units": results
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n  Guardado en {output_file}")
    print(f"  Datasheets: {len(results)}/{total}")
    if errors:
        print(f"  Errores: {errors}")

    return output


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
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python fetch_datasheets.py <nombre_faccion>")
        print("  python fetch_datasheets.py --all")
        print("\nEjemplos:")
        print("  python fetch_datasheets.py 'Space Marines'")
        print("  python fetch_datasheets.py necrons")
        print("  python fetch_datasheets.py --all")
        sys.exit(1)

    factions = load_factions()

    if sys.argv[1] == '--all':
        all_factions = []
        for category, faction_list in factions.items():
            all_factions.extend(faction_list)
        print(f"Descargando datasheets de {len(all_factions)} facciones...")
        for faction in all_factions:
            try:
                fetch_faction_datasheets(faction['slug'], faction['name'])
            except Exception as e:
                print(f"  ERROR con {faction['name']}: {e}")
    else:
        search_term = ' '.join(sys.argv[1:])
        faction = find_faction(factions, search_term)
        if not faction:
            print(f"Faccion '{search_term}' no encontrada")
            sys.exit(1)
        fetch_faction_datasheets(faction['slug'], faction['name'])


if __name__ == "__main__":
    main()
