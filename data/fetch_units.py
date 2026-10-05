#!/usr/bin/env python3
"""
Script para obtener las unidades de una faccion especifica de Warhammer 40K
Requiere que exista factions.json generado por fetch_factions.py
"""

import json
import re
import sys
from pathlib import Path
from difflib import SequenceMatcher

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Instalando dependencias necesarias...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "beautifulsoup4"])
    import requests
    from bs4 import BeautifulSoup

BASE_URL = "https://www.40k.app"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def load_factions(factions_path="factions.json"):
    factions_file = Path(__file__).parent / factions_path
    if not factions_file.exists():
        print(f"Error: No se encontro {factions_file}")
        print("Ejecuta primero fetch_factions.py")
        sys.exit(1)
    with open(factions_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def find_faction(factions, search_term):
    search_lower = search_term.lower().strip()
    for category, faction_list in factions.items():
        for faction in faction_list:
            if faction['name'].lower() == search_lower:
                return faction, category
    for category, faction_list in factions.items():
        for faction in faction_list:
            if faction['slug'].lower() == search_lower:
                return faction, category
    matches = []
    for category, faction_list in factions.items():
        for faction in faction_list:
            name_lower = faction['name'].lower()
            if search_lower in name_lower or name_lower in search_lower:
                matches.append((faction, category, 1.0))
            else:
                ratio = SequenceMatcher(None, search_lower, name_lower).ratio()
                if ratio > 0.6:
                    matches.append((faction, category, ratio))
    if not matches:
        return None, None
    matches.sort(key=lambda x: x[2], reverse=True)
    best_match = matches[0]
    print(f"\nQuisiste decir '{best_match[0]['name']}'? (similitud: {best_match[2]:.2%})")
    if len(matches) > 1:
        print("Otras posibles coincidencias:")
        for m in matches[1:5]:
            print(f"  - {m[0]['name']} ({m[2]:.2%})")
    return best_match[0], best_match[1]

def fetch_units(faction_url, faction_name):
    print(f"\nObteniendo unidades de {faction_name}...")
    response = requests.get(faction_url, headers=HEADERS)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    units = []

    # Find all category sections
    for section in soup.find_all('section', class_=lambda x: x and 'ContentList' in str(x) and 'category' in str(x)):
        header = section.find('h2')
        if not header:
            continue
        category = header.get_text(strip=True)
        if not category or category in ['Support me on Ko-fi']:
            continue

        # Find ALL ul elements within this section (both primus and medus)
        for ul in section.find_all('ul'):
            for li in ul.find_all('li', recursive=False):
                link = li.find('a', href=True)
                if link:
                    href = link.get('href', '')
                    if '/units/' in href:
                        name_span = link.find('span')
                        name = name_span.get_text(strip=True) if name_span else link.get_text(strip=True)
                        points = None
                        points_text = li.get_text(strip=True)
                        points_match = re.search(r'(\d+)\+?\s*$', points_text)
                        if points_match:
                            points = points_match.group(1)
                        units.append({
                            "name": name,
                            "category": category,
                            "url": f"{BASE_URL}{href}",
                            "slug": href.split('/')[-1],
                            "points": points
                        })

    return units

def save_units(units, faction_slug, faction_name):
    output_file = Path(__file__).parent / f"units_{faction_slug}.json"
    data = {
        "faction": faction_name,
        "slug": faction_slug,
        "units_count": len(units),
        "units": units
    }
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"\nUnidades guardadas en {output_file}")
    categories = {}
    for unit in units:
        cat = unit['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(unit)
    print(f"\nResumen de {faction_name}:")
    print(f"- Total unidades: {len(units)}")
    for cat, cat_units in categories.items():
        print(f"  - {cat}: {len(cat_units)} unidades")
    return output_file

def main():
    if len(sys.argv) < 2:
        print("Uso: python fetch_units.py <nombre_faccion>")
        print("\nEjemplos:")
        print("  python fetch_units.py 'Adepta Sororitas'")
        print("  python fetch_units.py 'Space Marines'")
        print("  python fetch_units.py necrons")
        sys.exit(1)
    search_term = ' '.join(sys.argv[1:])
    factions = load_factions()
    faction, category = find_faction(factions, search_term)
    if not faction:
        print(f"\nNo se encontro la faccion '{search_term}'")
        print("Facciones disponibles:")
        for cat, faction_list in factions.items():
            print(f"\n{cat}:")
            for f in faction_list:
                print(f"  - {f['name']}")
        sys.exit(1)
    print(f"\nFaccion encontrada: {faction['name']} ({category})")
    print(f"URL: {faction['url']}")
    units = fetch_units(faction['url'], faction['name'])
    if units:
        save_units(units, faction['slug'], faction['name'])
    else:
        print("No se encontraron unidades para esta faccion")

if __name__ == "__main__":
    main()
