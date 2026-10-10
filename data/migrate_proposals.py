#!/usr/bin/env python3
"""
Migra structuring_proposals.json al formato de schema actual.

Transformaciones:
  - attackType → phase en cada structured ability
  - appliedTo movido de ability level a cada effect
  - mortalWounds con gameEvent=onDestroyed → convertidos a OTHER
  - mortalWounds restantes → nuevo formato (hits/resolution/damagePerSuccess)
  - amountByKeyword → se genera un efecto extra por cada keyword override

Uso:
  python3 migrate_proposals.py <nombre_faccion>
  python3 migrate_proposals.py "Space Marines"
"""

import json
import sys
from pathlib import Path


def slug(name: str) -> str:
    return name.lower().replace(' ', '-')


def migrate_amount_to_notation(amount: dict) -> str:
    kind = amount.get('kind')
    if kind == 'fixed':
        return str(amount.get('value', 1))
    if kind == 'roll':
        dice = amount.get('dice', 'D6')
        count = amount.get('count', 1)
        modifier = amount.get('modifier', 0)
        count_str = str(count) if count > 1 else ''
        mod_str = f'+{modifier}' if modifier else ''
        return f'{count_str}{dice}{mod_str}'
    return '1'


def migrate_mortal_wounds_effect(eff: dict, ability_applied_to: str) -> list[dict]:
    game_event = eff.get('gameEvent', '')
    amount = eff.get('amount', {})
    pre_roll = eff.get('preRoll')
    applied_to = eff.get('appliedTo', ability_applied_to)

    if amount.get('kind') == 'perModelRoll':
        hits = {'kind': 'notation', 'value': str(amount.get('threshold', 4))}
        # perModelRoll: hits = by stat (models), resolution = threshold+, damage = onSuccess
        hits = {'kind': 'byStat', 'stat': 'models'}
        resolution = {'kind': 'roll', 'threshold': amount.get('threshold', 4)}
        damage_per_success = str(amount.get('onSuccess', 1))
    elif amount.get('kind') == 'multiDiceCount':
        hits = {'kind': 'notation', 'value': str(amount.get('diceCount', 6))}
        resolution = {'kind': 'roll', 'threshold': amount.get('threshold', 4)}
        damage_per_success = str(amount.get('onSuccess', 1))
    else:
        # fixed or roll amount
        if pre_roll:
            hits = {'kind': 'notation', 'value': '1'}
            resolution = {'kind': 'roll', 'threshold': pre_roll.get('threshold', 2)}
            damage_per_success = migrate_amount_to_notation(amount)
        else:
            hits = {'kind': 'notation', 'value': migrate_amount_to_notation(amount)}
            resolution = {'kind': 'always'}
            damage_per_success = '1'

    base_effect = {
        'category': 'mortalWounds',
        'appliedTo': applied_to,
        'unitType': 'ALL',
        'hits': hits,
        'resolution': resolution,
        'damagePerSuccess': damage_per_success,
    }

    results = [base_effect]

    for override in eff.get('amountByKeyword', []):
        kw = override.get('targetKeyword', '').upper()
        override_effect = {
            'category': 'mortalWounds',
            'appliedTo': applied_to,
            'unitType': kw if kw else 'ALL',
            'hits': dict(hits),
            'resolution': dict(resolution) if isinstance(resolution, dict) else resolution,
            'damagePerSuccess': migrate_amount_to_notation(override.get('amount', {})),
        }
        results.append(override_effect)

    return results


def migrate_ability(ab: dict) -> list[dict]:
    if 'effects' not in ab:
        return [ab]

    ability_applied_to = ab.get('appliedTo', 'SelfModel')

    has_deadly_demise = False
    for eff in ab.get('effects', []):
        if eff.get('category') == 'mortalWounds' and eff.get('gameEvent') == 'onDestroyed':
            has_deadly_demise = True
            break

    if has_deadly_demise:
        return [{
            'type': ab.get('type', 'Always'),
            'name': ab.get('name', ''),
            'category': 'OTHER',
            'text': ab.get('originalText', f'{ab.get("name", "")} (no simulable)'),
        }]

    phase = ab.get('phase', ab.get('attackType', 'ANY'))

    new_effects = []
    for eff in ab.get('effects', []):
        if eff.get('category') == 'mortalWounds':
            migrated = migrate_mortal_wounds_effect(eff, ability_applied_to)
            new_effects.extend(migrated)
        else:
            new_eff = dict(eff)
            if 'appliedTo' not in new_eff:
                new_eff['appliedTo'] = ability_applied_to
            new_effects.append(new_eff)

    if len(new_effects) <= len(ab.get('effects', [])):
        result = {
            'type': ab.get('type', 'Always'),
            'name': ab.get('name', ''),
            'phase': phase,
            'trigger': ab.get('trigger', 'ALWAYS'),
            'effects': new_effects,
        }
        if ab.get('autoApply'):
            result['autoApply'] = True
        if ab.get('groupId'):
            result['groupId'] = ab['groupId']
        if ab.get('groupOperator'):
            result['groupOperator'] = ab['groupOperator']
        if ab.get('originalText'):
            result['originalText'] = ab['originalText']
        return [result]

    # amountByKeyword expanded into multiple effects → fan out into multiple abilities
    base_effects = [new_effects[0]]
    extra_effects = new_effects[1:]

    base_ab = {
        'type': ab.get('type', 'Always'),
        'name': ab.get('name', ''),
        'phase': phase,
        'trigger': ab.get('trigger', 'ALWAYS'),
        'effects': base_effects,
    }
    if ab.get('autoApply'):
        base_ab['autoApply'] = True
    if ab.get('originalText'):
        base_ab['originalText'] = ab['originalText']

    results = [base_ab]
    for i, extra_eff in enumerate(extra_effects, 2):
        extra_ab = {
            'type': ab.get('type', 'Always'),
            'name': f'{ab.get("name", "")} (efecto {i})',
            'phase': phase,
            'trigger': ab.get('trigger', 'ALWAYS'),
            'effects': [extra_eff],
        }
        if ab.get('autoApply'):
            extra_ab['autoApply'] = True
        results.append(extra_ab)

    return results


def main():
    if len(sys.argv) < 2:
        print('Uso: python migrate_proposals.py <nombre_faccion>')
        print('Ejemplo: python migrate_proposals.py "Space Marines"')
        sys.exit(1)

    faction_name = sys.argv[1]
    faction_slug_str = slug(faction_name)
    proposals_path = Path(__file__).parent / faction_slug_str / 'structuring_proposals.json'

    if not proposals_path.exists():
        print(f'ERROR: No se encontró {proposals_path}')
        sys.exit(1)

    with open(proposals_path, encoding='utf-8') as f:
        proposals = json.load(f)

    stats = {'migrated': 0, 'to_other': 0, 'mw_migrated': 0, 'fan_out': 0}

    for key, unit_data in proposals.items():
        if not isinstance(unit_data, dict):
            continue

        new_abilities = []
        for ab in unit_data.get('abilities', []):
            if not isinstance(ab, dict):
                new_abilities.append(ab)
                continue

            migrated = migrate_ability(ab)
            new_abilities.extend(migrated)

            if len(migrated) == 1 and migrated[0].get('category') == 'OTHER' and 'effects' in ab:
                stats['to_other'] += 1
            elif len(migrated) > 1:
                stats['fan_out'] += len(migrated) - 1
            if 'effects' in ab:
                stats['migrated'] += 1
                for eff in ab.get('effects', []):
                    if eff.get('category') == 'mortalWounds':
                        stats['mw_migrated'] += 1

        unit_data['abilities'] = new_abilities

    with open(proposals_path, 'w', encoding='utf-8') as f:
        json.dump(proposals, f, ensure_ascii=False, indent=2)
        f.write('\n')

    print(f'Habilidades migradas: {stats["migrated"]}')
    print(f'Convertidas a OTHER (Deadly Demise): {stats["to_other"]}')
    print(f'Efectos MW migrados: {stats["mw_migrated"]}')
    print(f'Fan-out por keyword override: {stats["fan_out"]}')
    print(f'Guardado en {proposals_path}')


if __name__ == '__main__':
    main()
