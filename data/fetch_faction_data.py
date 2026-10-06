#!/usr/bin/env python3
"""
Descarga Rules y Detachments de facciones de Warhammer 40K desde 40k.app.
Requiere factions.json generado por fetch_factions.py.

Uso:
  python fetch_faction_data.py <nombre_faccion>
  python fetch_faction_data.py --all
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


def decode_rsc_payload(html):
    """Extrae y decodifica los payloads RSC de Next.js de una pagina."""
    lines = []
    for script in BeautifulSoup(html, 'html.parser').find_all('script'):
        s = script.string or ''
        m = re.match(r'self\.__next_f\.push\(\[1,"(.*)"\]\)$', s, re.DOTALL)
        if m:
            decoded = json.loads('"' + m.group(1) + '"')
            lines.append(decoded)
    return '\n'.join(lines)


def extract_json_object(text, start_idx):
    """Extrae un objeto JSON completo desde start_idx usando conteo de llaves."""
    if start_idx >= len(text) or text[start_idx] != '{':
        return None
    depth = 0
    in_str = False
    esc = False
    for i in range(start_idx, len(text)):
        c = text[i]
        if esc:
            esc = False
            continue
        if c == '\\':
            esc = True
            continue
        if c == '"':
            in_str = not in_str
            continue
        if not in_str:
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    return text[start_idx:i + 1]
    return None


def extract_json_array(text, start_idx):
    """Extrae un array JSON completo desde start_idx usando conteo de brackets."""
    if start_idx >= len(text) or text[start_idx] != '[':
        return None
    depth = 0
    in_str = False
    esc = False
    for i in range(start_idx, len(text)):
        c = text[i]
        if esc:
            esc = False
            continue
        if c == '\\':
            esc = True
            continue
        if c == '"':
            in_str = not in_str
            continue
        if not in_str:
            if c == '[':
                depth += 1
            elif c == ']':
                depth -= 1
                if depth == 0:
                    return text[start_idx:i + 1]
    return None


def find_in_rsc_lines(rsc_text, marker):
    """Busca un marker en las lineas RSC y devuelve la linea que lo contiene."""
    for line in rsc_text.split('\n'):
        if marker in line:
            return line
    return None


# ─── 1. Links a Rules y Detachments ───

def fetch_faction_links(faction_slug):
    """Obtiene los links a army-rules y detachments de una faccion."""
    html = get_page(f"{BASE_URL}/factions/{faction_slug}/detachments")
    slugs = re.findall(
        rf'/factions/{re.escape(faction_slug)}/detachments/([a-z0-9-]+)', html
    )
    detachment_slugs = sorted(set(slugs))

    return {
        "army_rules_url": f"{BASE_URL}/factions/{faction_slug}/army-rules",
        "detachments": [
            {
                "slug": s,
                "url": f"{BASE_URL}/factions/{faction_slug}/detachments/{s}"
            }
            for s in detachment_slugs
        ]
    }


# ─── 2. Descargar contenido de Rules y Detachments ───

def fetch_army_rules(faction_slug):
    """Descarga las army rules de una faccion."""
    html = get_page(f"{BASE_URL}/factions/{faction_slug}/army-rules")
    rsc = decode_rsc_payload(html)

    line = find_in_rsc_lines(rsc, '"rules":[')
    if not line:
        return None

    idx = line.find('"rules":[')
    if idx < 0:
        return None

    arr_start = idx + len('"rules":')
    raw = extract_json_array(line, arr_start)
    if raw:
        return json.loads(raw)
    return None


def fetch_detachment(faction_slug, detachment_slug):
    """Descarga los datos completos de un detachment."""
    html = get_page(
        f"{BASE_URL}/factions/{faction_slug}/detachments/{detachment_slug}"
    )
    rsc = decode_rsc_payload(html)

    line = find_in_rsc_lines(rsc, '"detachment":{')
    if not line:
        return None

    idx = line.find('"detachment":{')
    if idx < 0:
        return None

    obj_start = idx + len('"detachment":')
    raw = extract_json_object(line, obj_start)
    if raw:
        return json.loads(raw)
    return None


def fetch_all_faction_data(faction_slug, faction_name):
    """Descarga rules y todos los detachments de una faccion."""
    print(f"\n{'='*60}")
    print(f"  {faction_name} ({faction_slug})")
    print(f"{'='*60}")

    # Army Rules
    print(f"\n  Descargando army rules...", end=' ', flush=True)
    army_rules = fetch_army_rules(faction_slug)
    if army_rules:
        print(f"OK ({len(army_rules)} reglas)")
    else:
        print("ERROR")

    time.sleep(REQUEST_DELAY)

    # Detachment links
    print(f"  Obteniendo lista de detachments...", end=' ', flush=True)
    links = fetch_faction_links(faction_slug)
    detachment_links = links['detachments']
    print(f"{len(detachment_links)} detachments")

    time.sleep(REQUEST_DELAY)

    # Detachment details
    detachments = []
    for i, det_link in enumerate(detachment_links):
        print(
            f"  [{i+1}/{len(detachment_links)}] {det_link['slug']}...",
            end=' ', flush=True
        )
        try:
            det = fetch_detachment(faction_slug, det_link['slug'])
            if det:
                detachments.append(det)
                n_enh = len(det.get('enhancements', []))
                n_str = len(det.get('stratagems', []))
                print(f"OK ({n_enh} enhancements, {n_str} stratagems)")
            else:
                print("NO DATA")
        except requests.exceptions.HTTPError as e:
            print(f"HTTP ERROR: {e}")
        except Exception as e:
            print(f"ERROR: {e}")
        time.sleep(REQUEST_DELAY)

    result = {
        "faction": faction_name,
        "slug": faction_slug,
        "army_rules": army_rules,
        "detachments_count": len(detachments),
        "detachments": detachments
    }

    faction_dir = DATA_DIR / faction_slug
    faction_dir.mkdir(parents=True, exist_ok=True)
    output_file = faction_dir / "faction_data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"\n  Guardado en {output_file}")
    print(f"  Army rules: {len(army_rules) if army_rules else 0}")
    print(f"  Detachments: {len(detachments)}/{len(detachment_links)}")

    return result


# ─── CLI ───

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
        print("  python fetch_faction_data.py <nombre_faccion>")
        print("  python fetch_faction_data.py --all")
        print("\nEjemplos:")
        print("  python fetch_faction_data.py 'Space Marines'")
        print("  python fetch_faction_data.py necrons")
        print("  python fetch_faction_data.py --all")
        sys.exit(1)

    factions = load_factions()

    if sys.argv[1] == '--all':
        all_factions = []
        for category, faction_list in factions.items():
            all_factions.extend(faction_list)
        print(f"Descargando datos de {len(all_factions)} facciones...")
        for faction in all_factions:
            try:
                fetch_all_faction_data(faction['slug'], faction['name'])
            except Exception as e:
                print(f"  ERROR con {faction['name']}: {e}")
    else:
        search_term = ' '.join(sys.argv[1:])
        faction = find_faction(factions, search_term)
        if not faction:
            print(f"Faccion '{search_term}' no encontrada")
            sys.exit(1)
        fetch_all_faction_data(faction['slug'], faction['name'])


if __name__ == "__main__":
    main()
