import { describe, expect, it } from 'vitest'
import { parseWeaponAbilityName } from './weaponKeywords'

describe('parseWeaponAbilityName', () => {
  const cases: [string, { name: string; value: string | null }][] = [
    ['ANTI-FLY 2+', { name: 'ANTI-FLY', value: '2+' }],
    ['ANTI-FLY 3+', { name: 'ANTI-FLY', value: '3+' }],
    ['ANTI-FLY 4+', { name: 'ANTI-FLY', value: '4+' }],
    ['ANTI-VEHICLE 2+', { name: 'ANTI-VEHICLE', value: '2+' }],
    ['ASSAULT', { name: 'ASSAULT', value: null }],
    ['BLAST 1', { name: 'BLAST', value: '1' }],
    ['BLAST 2', { name: 'BLAST', value: '2' }],
    ['CLEAVE 1', { name: 'CLEAVE', value: '1' }],
    ['CLEAVE 2', { name: 'CLEAVE', value: '2' }],
    ['CLOSE-QUARTERS', { name: 'CLOSE-QUARTERS', value: null }],
    ['DEVASTATING WOUNDS', { name: 'DEVASTATING WOUNDS', value: null }],
    ['DEVASTATING WOUNDS: non-MONSTER/VEHICLE', { name: 'DEVASTATING WOUNDS', value: null }],
    ['EXTRA ATTACKS', { name: 'EXTRA ATTACKS', value: null }],
    ['HAZARDOUS', { name: 'HAZARDOUS', value: null }],
    ['HEAVY', { name: 'HEAVY', value: null }],
    ['IGNORES COVER', { name: 'IGNORES COVER', value: null }],
    ['INDIRECT FIRE', { name: 'INDIRECT FIRE', value: null }],
    ['LETHAL HITS: non-MONSTER/VEHICLE', { name: 'LETHAL HITS', value: null }],
    ['MELTA 2', { name: 'MELTA', value: '2' }],
    ['MELTA 3', { name: 'MELTA', value: '3' }],
    ['ONE SHOT', { name: 'ONE SHOT', value: null }],
    ['PRECISION', { name: 'PRECISION', value: null }],
    ['Precision', { name: 'PRECISION', value: null }],
    ['PSYCHIC', { name: 'PSYCHIC', value: null }],
    ['RAPID FIRE 1', { name: 'RAPID FIRE', value: '1' }],
    ['RAPID FIRE 12', { name: 'RAPID FIRE', value: '12' }],
    ['RAPID FIRE 2', { name: 'RAPID FIRE', value: '2' }],
    ['RAPID FIRE 3', { name: 'RAPID FIRE', value: '3' }],
    ['RAPID FIRE 4', { name: 'RAPID FIRE', value: '4' }],
    ['RAPID FIRE 6', { name: 'RAPID FIRE', value: '6' }],
    ['SUSTAINED HITS 1', { name: 'SUSTAINED HITS', value: '1' }],
    ['SUSTAINED HITS 1: non-MONSTER/VEHICLE', { name: 'SUSTAINED HITS', value: '1' }],
    ['SUSTAINED HITS 2', { name: 'SUSTAINED HITS', value: '2' }],
    ['SUSTAINED HITS 2: non-MONSTER/VEHICLE', { name: 'SUSTAINED HITS', value: '2' }],
    ['TORRENT', { name: 'TORRENT', value: null }],
    ['TWIN-LINKED', { name: 'TWIN-LINKED', value: null }],
  ]

  it.each(cases)('parses %s', (raw, expected) => {
    const result = parseWeaponAbilityName(raw)
    expect(result.name).toBe(expected.name)
    expect(result.value).toBe(expected.value)
    expect(result.known).toBe(true)
  })

  it('flags an unrecognized keyword as not known, without throwing', () => {
    const result = parseWeaponAbilityName('ANTI-INFANTRY 3+')
    expect(result.known).toBe(false)
    expect(result.name).toBe('ANTI-INFANTRY')
    expect(result.value).toBe('3+')
  })
})
