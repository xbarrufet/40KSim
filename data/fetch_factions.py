#!/usr/bin/env python3
"""
Script para obtener la lista de facciones de Warhammer 40K desde 40k.app
Genera el archivo factions.json con todas las facciones y sus URLs
"""

import json
import sys
from pathlib import Path

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
FACTIONS_URL = f"{BASE_URL}/factions"

def fetch_factions():
    """Obtiene todas las facciones agrupadas por categoría"""
    print(f"Obteniendo facciones desde {FACTIONS_URL}...")
    
    response = requests.get(FACTIONS_URL)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    factions = {}
    
    # Buscar todos los headers que contienen las categorías
    # La estructura es: header > h2 (categoría) y luego div hermano con las facciones
    for header in soup.find_all('header', class_=lambda x: x and 'FactionGrid' in str(x)):
        h2 = header.find('h2')
        if not h2:
            continue
            
        category = h2.get_text(strip=True)
        if not category or category in ['Support me on Ko-fi']:
            continue
        
        # Las facciones están en el siguiente hermano del header
        next_element = header.find_next_sibling()
        if next_element:
            faction_links = next_element.find_all('a', href=True)
            if faction_links:
                factions[category] = []
                for link in faction_links:
                    href = link.get('href', '')
                    if href.startswith('/factions/') and href != '/factions':
                        name = link.get_text(strip=True)
                        if name:
                            factions[category].append({
                                "name": name,
                                "url": f"{BASE_URL}{href}",
                                "slug": href.split('/')[-1]
                            })
    
    return factions

def save_factions(factions, output_path="factions.json"):
    """Guarda las facciones en un archivo JSON"""
    output_file = Path(__file__).parent / output_path
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(factions, f, indent=2, ensure_ascii=False)
    
    print(f"Facciones guardadas en {output_file}")
    
    # Imprimir resumen
    total = sum(len(flist) for flist in factions.values())
    print(f"\nResumen:")
    print(f"- Categorías: {len(factions)}")
    print(f"- Total facciones: {total}")
    
    return output_file

if __name__ == "__main__":
    factions = fetch_factions()
    save_factions(factions)
