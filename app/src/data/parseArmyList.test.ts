import 'fake-indexeddb/auto'
import { describe, expect, it, vi } from 'vitest'
import { seedFromCatalog, putBaseData, getListByUrl } from './db'
import {
  applyParentFallback,
  matchUnitNames,
  matchWargearTokens,
  parseAndValidateArmyList,
  parseArmyListText,
  resolveParentFactionSlug,
  saveParsedList,
  tokenizeWargearLine,
  tokenizeWargearLineWithCounts,
  type ParsedEntry,
} from './parseArmyList'
import type { BaseData } from './preprocessBaseData'
import type { ArmyListEntry, UnitCatalog } from './schema'

const SAMPLE_LIST = `04-10
Imperial Fists · Ceramite Sentinels · Devastator Brethren
Mission: Take and Hold
1990/2000 pts

EPIC HEROES [90 pts]
  Tor Garadon [90 pts] - Warlord
    Attached to Heavy Intercessor Squad
    Artificer Grav-gun + Hand of Defiance

LEADERS & CHARACTERS [165 pts]
  Apothecary Biologis [75 pts]
    Attached to Aggressor Squad
    Enhancement: Master-forged Firearms (+15 pts)
    Absolvor Bolt Pistol + Servo-armature
  Librarian in Terminator Armour [90 pts]
    Attached to Terminator Squad
    Enhancement: Spy-skull Data Link (+10 pts)
    Storm Bolter + Smite + Force Weapon

BATTLELINE [400 pts]
  Assault Intercessor Squad [85 pts] (5 models)
    5× Heavy Bolt Pistol / 5× Chainsword
  Heavy Intercessor Squad [230 pts] (10 models)
    Led by Tor Garadon
    10× Ceramite Fists + Bolt Pistol / 8× Heavy Bolt Rifle / 2× Heavy Bolter
  Intercessor Squad [85 pts] (5 models)
    5× Knives and Fists / 5× Bolt Rifle / 5× Bolt Pistol / Grenade Launcher

MOUNTED [80 pts]
  Outrider Squad [80 pts] (3 models)
    3× Chainsword / 3× Twin Bolt Rifle / 3× Heavy Bolt Pistol

INFANTRY, SWARMS, BEASTS [755 pts]
  Aggressor Squad [180 pts] (6 models)
    Supported by Apothecary Biologis
    6× Twin Power Fists / 6× Fragstorm Grenade Launcher + Auto Boltstorm Gauntlets
  Eradicator Squad with melta rifles [100 pts] (3 models)
    3× Ceramite Fists + Bolt Pistol / 3× Melta Rifle
  Infiltrator Squad [85 pts] (5 models)
    Bolt Pistol + Ceramite Fists + Marksman Bolt Carbine / 4× Ceramite Fists + Bolt Pistol + Marksman Bolt Carbine
  Terminator Squad [390 pts] (10 models)
    Led by Librarian in Terminator Armour
    9× Power Fist / 10× Storm Bolter / Cyclone Missile Launcher

VEHICLES, MONSTERS [500 pts]
  Ballistus Dreadnought [150 pts]
    Storm Bolters + Ballistus Lascannon + Ballistus Missile Launcher + Armoured Feet
  Gladiator Lancer [160 pts]
    Defensive Array + Laser Destroyer + Armoured Hull
  Repulsor [190 pts]
    Hunter-slayer Missile + Armoured Hull + Defensive Array / Heavy Onslaught Gatling Cannon / Twin Heavy Bolter

Exported from 40k.app, view the full list here:
https://www.40k.app/lists/KsM8Gd9KU9

Warhammer merchandise
`

describe('parseArmyListText', () => {
  const parsed = parseArmyListText(SAMPLE_LIST)

  it('parses the title, header line, mission, declared points, and list URL', () => {
    expect(parsed.title).toBe('04-10')
    expect(parsed.factionName).toBe('Imperial Fists')
    expect(parsed.armyName).toBe('Ceramite Sentinels')
    expect(parsed.detachment).toBe('Devastator Brethren')
    expect(parsed.mission).toBe('Take and Hold')
    expect(parsed.declaredPoints).toBe('1990/2000')
    expect(parsed.listUrl).toBe('https://www.40k.app/lists/KsM8Gd9KU9')
  })

  it('parses a leader entry with an Attached to line and no model count', () => {
    const entry = parsed.entries.find((e) => e.unitName === 'Tor Garadon')
    expect(entry).toMatchObject({
      category: 'EPIC HEROES',
      points: 90,
      modelCount: undefined,
      attachmentText: 'Attached to Heavy Intercessor Squad',
      rawWargearText: 'Artificer Grav-gun + Hand of Defiance',
    })
    expect(entry?.enhancementText).toBeUndefined()
  })

  it('parses an entry with an Enhancement line', () => {
    const entry = parsed.entries.find((e) => e.unitName === 'Apothecary Biologis')
    expect(entry?.enhancementText).toBe('Enhancement: Master-forged Firearms (+15 pts)')
    expect(entry?.attachmentText).toBe('Attached to Aggressor Squad')
  })

  it('parses a squad entry with a Led by line and a model count', () => {
    const entry = parsed.entries.find((e) => e.unitName === 'Heavy Intercessor Squad')
    expect(entry).toMatchObject({
      category: 'BATTLELINE',
      modelCount: 10,
      attachmentText: 'Led by Tor Garadon',
    })
  })

  it('parses a squad entry with a Supported by line', () => {
    const entry = parsed.entries.find((e) => e.unitName === 'Aggressor Squad')
    expect(entry?.attachmentText).toBe('Supported by Apothecary Biologis')
  })

  it('parses a single-model unit with no model-count suffix', () => {
    const entry = parsed.entries.find((e) => e.unitName === 'Ballistus Dreadnought')
    expect(entry).toMatchObject({
      category: 'VEHICLES, MONSTERS',
      points: 150,
      modelCount: undefined,
      rawWargearText: 'Storm Bolters + Ballistus Lascannon + Ballistus Missile Launcher + Armoured Feet',
    })
  })

  it('parses every category and unit entry', () => {
    expect(parsed.entries).toHaveLength(14)
    const categories = new Set(parsed.entries.map((e) => e.category))
    expect(categories).toEqual(
      new Set(['EPIC HEROES', 'LEADERS & CHARACTERS', 'BATTLELINE', 'MOUNTED', 'INFANTRY, SWARMS, BEASTS', 'VEHICLES, MONSTERS']),
    )
  })
})

describe('tokenizeWargearLine', () => {
  it('tokenizes a single-weapon-per-slot line with no count prefix', () => {
    expect(tokenizeWargearLine('Storm Bolters + Ballistus Lascannon + Ballistus Missile Launcher + Armoured Feet')).toEqual([
      'Storm Bolters',
      'Ballistus Lascannon',
      'Ballistus Missile Launcher',
      'Armoured Feet',
    ])
  })

  it('tokenizes a multi-slot line separated by "/"', () => {
    expect(tokenizeWargearLine('5× Heavy Bolt Pistol / 5× Chainsword')).toEqual(['Heavy Bolt Pistol', 'Chainsword'])
  })

  it('tokenizes a combo slot joined by "+", stripping the count prefix only from the first name', () => {
    expect(tokenizeWargearLine('10× Ceramite Fists + Bolt Pistol / 8× Heavy Bolt Rifle / 2× Heavy Bolter')).toEqual([
      'Ceramite Fists',
      'Bolt Pistol',
      'Heavy Bolt Rifle',
      'Heavy Bolter',
    ])
  })

  it('returns an empty array for an empty line', () => {
    expect(tokenizeWargearLine('')).toEqual([])
  })
})

describe('matchUnitNames', () => {
  const entry: ParsedEntry = {
    category: 'BATTLELINE',
    unitName: 'Assault Intercessor Squad',
    points: 85,
    modelCount: 5,
    rawWargearText: '5× Heavy Bolt Pistol / 5× Chainsword',
  }

  it('marks an entry matched when its unit name matches a known unit (case-insensitive), recording the faction slug', () => {
    const [result] = matchUnitNames(
      [entry],
      [{ slug: 'assault-intercessor-squad', name: 'assault intercessor squad' }],
      'imperial-fists',
    )
    expect(result.unitStatus).toBe('matched')
    expect(result.matchedUnitSlug).toBe('assault-intercessor-squad')
    expect(result.matchedFactionSlug).toBe('imperial-fists')
  })

  it('marks an entry unmatched when no known unit has that name', () => {
    const [result] = matchUnitNames([entry], [{ slug: 'intercessor-squad', name: 'Intercessor Squad' }], 'imperial-fists')
    expect(result.unitStatus).toBe('unmatched')
    expect(result.matchedUnitSlug).toBeNull()
    expect(result.matchedFactionSlug).toBeNull()
  })

  it('marks every entry unmatched when the faction has no units loaded', () => {
    const [result] = matchUnitNames([entry], [], 'imperial-fists')
    expect(result.unitStatus).toBe('unmatched')
    expect(result.matchedUnitSlug).toBeNull()
    expect(result.matchedFactionSlug).toBeNull()
  })
})

describe('applyParentFallback', () => {
  const matchedEntry: ArmyListEntry = {
    category: 'BATTLELINE',
    unitName: 'Tor Garadon',
    matchedUnitSlug: 'tor-garadon',
    matchedFactionSlug: 'imperial-fists',
    unitStatus: 'matched',
    rawWargearText: '',
    wargearTokens: [],
  }
  const unmatchedEntry: ArmyListEntry = {
    category: 'BATTLELINE',
    unitName: 'Heavy Intercessor Squad',
    matchedUnitSlug: null,
    matchedFactionSlug: null,
    unitStatus: 'unmatched',
    rawWargearText: '',
    wargearTokens: [],
  }

  it('matches a still-unmatched entry against the parent faction, recording the parent slug', () => {
    const [result] = applyParentFallback(
      [unmatchedEntry],
      [{ slug: 'heavy-intercessor-squad', name: 'Heavy Intercessor Squad' }],
      'space-marines',
    )
    expect(result.unitStatus).toBe('matched')
    expect(result.matchedUnitSlug).toBe('heavy-intercessor-squad')
    expect(result.matchedFactionSlug).toBe('space-marines')
  })

  it('leaves an already-matched entry untouched (own-faction match is not overridden)', () => {
    const [result] = applyParentFallback(
      [matchedEntry],
      [{ slug: 'tor-garadon', name: 'Tor Garadon' }],
      'space-marines',
    )
    expect(result).toEqual(matchedEntry)
  })

  it('leaves an entry unmatched when the parent faction has no match either', () => {
    const [result] = applyParentFallback([unmatchedEntry], [], 'space-marines')
    expect(result.unitStatus).toBe('unmatched')
    expect(result.matchedUnitSlug).toBeNull()
    expect(result.matchedFactionSlug).toBeNull()
  })
})

describe('resolveParentFactionSlug', () => {
  const factions = [
    { slug: 'space-marines', name: 'Space Marines', category: 'Space Marines' },
    { slug: 'imperial-fists', name: 'Imperial Fists', category: 'Space Marines' },
    { slug: 'blood-angels', name: 'Blood Angels', category: 'Space Marines' },
    { slug: 'chaos-space-marines', name: 'Chaos Space Marines', category: 'Chaos' },
    { slug: 'death-guard', name: 'Death Guard', category: 'Chaos' },
    { slug: 'necrons', name: 'Necrons' },
  ]

  it('resolves a chapter to the faction in its category named after that category', () => {
    expect(resolveParentFactionSlug('imperial-fists', factions)).toBe('space-marines')
    expect(resolveParentFactionSlug('blood-angels', factions)).toBe('space-marines')
  })

  it('resolves to null for the generic faction itself (no other faction shares its name)', () => {
    expect(resolveParentFactionSlug('space-marines', factions)).toBeNull()
  })

  it('resolves to null when no faction in the category is named after the category', () => {
    expect(resolveParentFactionSlug('chaos-space-marines', factions)).toBeNull()
    expect(resolveParentFactionSlug('death-guard', factions)).toBeNull()
  })

  it('resolves to null when the faction has no category', () => {
    expect(resolveParentFactionSlug('necrons', factions)).toBeNull()
  })

  it('resolves to null for an unknown faction slug', () => {
    expect(resolveParentFactionSlug('does-not-exist', factions)).toBeNull()
  })
})

describe('matchWargearTokens', () => {
  it('marks a token matched when its name is in the known wargear names (case-insensitive), carrying its count through', () => {
    const [result] = matchWargearTokens([{ name: 'bolt pistol', count: 5 }], ['Bolt Pistol', 'Chainsword'])
    expect(result).toEqual({ name: 'bolt pistol', count: 5, status: 'matched' })
  })

  it('marks a token unmatched when its name is not in the known wargear names', () => {
    const [result] = matchWargearTokens([{ name: 'Plasma Pistol', count: 1 }], ['Bolt Pistol', 'Chainsword'])
    expect(result).toEqual({ name: 'Plasma Pistol', count: 1, status: 'unmatched' })
  })

  it('marks every token unverified when there is nothing to check against', () => {
    const result = matchWargearTokens([{ name: 'Bolt Pistol', count: 10 }, { name: 'Chainsword', count: 2 }], null)
    expect(result).toEqual([
      { name: 'Bolt Pistol', count: 10, status: 'unverified' },
      { name: 'Chainsword', count: 2, status: 'unverified' },
    ])
  })
})

describe('tokenizeWargearLineWithCounts', () => {
  it('reads the leading "N×" count on a single-weapon-per-slot line', () => {
    expect(tokenizeWargearLineWithCounts('5× Heavy Bolt Pistol / 5× Chainsword')).toEqual([
      { name: 'Heavy Bolt Pistol', count: 5 },
      { name: 'Chainsword', count: 5 },
    ])
  })

  it('shares a slot\'s leading count across every "+"-joined item in that slot', () => {
    expect(tokenizeWargearLineWithCounts('10× Ceramite Fists + Bolt Pistol / 8× Heavy Bolt Rifle / 2× Heavy Bolter')).toEqual([
      { name: 'Ceramite Fists', count: 10 },
      { name: 'Bolt Pistol', count: 10 },
      { name: 'Heavy Bolt Rifle', count: 8 },
      { name: 'Heavy Bolter', count: 2 },
    ])
  })

  it('defaults to a count of 1 when a slot has no leading "N×" prefix', () => {
    expect(tokenizeWargearLineWithCounts('Storm Bolters + Ballistus Lascannon')).toEqual([
      { name: 'Storm Bolters', count: 1 },
      { name: 'Ballistus Lascannon', count: 1 },
    ])
  })

  it('returns an empty array for an empty line', () => {
    expect(tokenizeWargearLineWithCounts('')).toEqual([])
  })
})

function sampleCatalog(): UnitCatalog {
  return {
    schemaVersion: 1,
    factions: [
      {
        id: 'imperial-fists',
        slug: 'imperial-fists',
        name: 'Imperial Fists',
        units: [],
      },
    ],
  }
}

/** Minimal BaseData fixture: a single miniature whose default wargear is exactly the given names. */
function sampleBaseData(options: { slug: string; name: string; wargearNames?: string[] }): BaseData {
  return {
    id: 1,
    slug: options.slug,
    name: options.name,
    abilities: [],
    miniatures: [
      {
        id: 1,
        name: options.name,
        stats: { movement: '6"', toughness: '4', save: '3+', wounds: '2', leadership: '7+', objectiveControl: '1' },
        keywords: [],
        defaultWargear: (options.wargearNames ?? []).map((name, index) => ({
          wargearItem: { id: index + 1, name, wargearType: 'weapon', profiles: [] },
        })),
        wargear: [],
      },
    ],
  }
}

describe('parseAndValidateArmyList', () => {
  it('matches units against their uploaded BaseData and matches their wargear against that same BaseData', async () => {
    await seedFromCatalog(sampleCatalog())
    await putBaseData(
      'imperial-fists',
      'tor-garadon',
      sampleBaseData({ slug: 'tor-garadon', name: 'Tor Garadon', wargearNames: ['Artificer Grav-gun', 'Hand of Defiance'] }),
    )

    const list = await parseAndValidateArmyList(SAMPLE_LIST)

    expect(list.factionSlug).toBe('imperial-fists')
    const garadon = list.entries.find((e) => e.unitName === 'Tor Garadon')
    expect(garadon?.unitStatus).toBe('matched')
    expect(garadon?.wargearTokens.every((t) => t.status === 'matched')).toBe(true)

    const unknownUnit = list.entries.find((e) => e.unitName === 'Ballistus Dreadnought')
    expect(unknownUnit?.unitStatus).toBe('unmatched')
    expect(unknownUnit?.wargearTokens.every((t) => t.status === 'unverified')).toBe(true)
  })

  it('falls back to the parent faction for a unit the chapter has no BaseData for, matching its wargear against the parent BaseData', async () => {
    await seedFromCatalog({
      schemaVersion: 1,
      factions: [
        { id: 'imperial-fists', slug: 'imperial-fists', name: 'Imperial Fists', category: 'Space Marines', units: [] },
        { id: 'space-marines', slug: 'space-marines', name: 'Space Marines', category: 'Space Marines', units: [] },
      ],
    })
    await putBaseData('imperial-fists', 'tor-garadon', sampleBaseData({ slug: 'tor-garadon', name: 'Tor Garadon' }))
    await putBaseData(
      'space-marines',
      'outrider-squad',
      sampleBaseData({ slug: 'outrider-squad', name: 'Outrider Squad', wargearNames: ['Chainsword', 'Heavy Bolt Pistol'] }),
    )

    const list = await parseAndValidateArmyList(SAMPLE_LIST)

    const outriders = list.entries.find((e) => e.unitName === 'Outrider Squad')
    expect(outriders?.unitStatus).toBe('matched')
    expect(outriders?.matchedUnitSlug).toBe('outrider-squad')
    expect(outriders?.matchedFactionSlug).toBe('space-marines')
    expect(outriders?.wargearTokens.find((t) => t.name === 'Chainsword')?.status).toBe('matched')
    expect(outriders?.wargearTokens.find((t) => t.name === 'Heavy Bolt Pistol')?.status).toBe('matched')
    expect(outriders?.wargearTokens.find((t) => t.name === 'Twin Bolt Rifle')?.status).toBe('unmatched')

    // A unit matched directly in the chapter's own faction is unaffected by the parent fallback.
    const garadon = list.entries.find((e) => e.unitName === 'Tor Garadon')
    expect(garadon?.matchedFactionSlug).toBe('imperial-fists')
  })

  it('matches wargear tokens against BaseData when it exists for the unit', async () => {
    await seedFromCatalog(sampleCatalog())
    await putBaseData(
      'imperial-fists',
      'heavy-intercessor-squad',
      sampleBaseData({ slug: 'heavy-intercessor-squad', name: 'Heavy Intercessor Squad', wargearNames: ['Ceramite Fists'] }),
    )

    const list = await parseAndValidateArmyList(SAMPLE_LIST)

    const heavyIntercessors = list.entries.find((e) => e.unitName === 'Heavy Intercessor Squad')
    const ceramiteFists = heavyIntercessors?.wargearTokens.find((t) => t.name === 'Ceramite Fists')
    const unknownToken = heavyIntercessors?.wargearTokens.find((t) => t.name === 'Bolt Pistol')
    expect(ceramiteFists?.status).toBe('matched')
    expect(unknownToken?.status).toBe('unmatched')
  })

  it('marks every entry unmatched when the list faction has no units loaded', async () => {
    const list = await parseAndValidateArmyList(SAMPLE_LIST.replace('Imperial Fists', 'Unknown Faction'))
    expect(list.factionSlug).toBeNull()
    expect(list.entries.every((e) => e.unitStatus === 'unmatched')).toBe(true)
  })
})

describe('saveParsedList', () => {
  it('creates a new record when the parsed list has no listUrl', async () => {
    const list = await saveParsedList({ id: 'ignored', title: 'No URL', factionSlug: null, entries: [] })
    expect(list.id).toBe('ignored')
    expect(list.uploadedAt).toBeDefined()
  })

  it('creates a new record when the listUrl does not match any stored list', async () => {
    const list = await saveParsedList({
      id: 'new-list',
      title: 'New',
      factionSlug: null,
      listUrl: 'https://www.40k.app/lists/brand-new',
      entries: [],
    })
    expect(list.id).toBe('new-list')
    expect(await getListByUrl('https://www.40k.app/lists/brand-new')).toEqual(list)
  })

  it('overwrites the existing stored list, reusing its id, when the listUrl matches', async () => {
    const first = await saveParsedList({
      id: 'first-id',
      title: 'Version 1',
      factionSlug: null,
      listUrl: 'https://www.40k.app/lists/dedupe-me',
      entries: [],
    })
    const second = await saveParsedList({
      id: 'second-id',
      title: 'Version 2',
      factionSlug: null,
      listUrl: 'https://www.40k.app/lists/dedupe-me',
      entries: [],
    })

    expect(first.id).toBe('first-id')
    expect(second.id).toBe('first-id')
    const stored = await getListByUrl('https://www.40k.app/lists/dedupe-me')
    expect(stored?.id).toBe('first-id')
    expect(stored?.title).toBe('Version 2')
  })

  it('refreshes uploadedAt to the most recent save, not the original, on a dedupe update', async () => {
    const isoDates = ['2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z']
    const toISOStringSpy = vi.spyOn(Date.prototype, 'toISOString').mockImplementation(() => isoDates.shift()!)

    try {
      const first = await saveParsedList({
        id: 'first-id',
        title: 'Version 1',
        factionSlug: null,
        listUrl: 'https://www.40k.app/lists/refresh-me',
        entries: [],
      })

      const second = await saveParsedList({
        id: 'second-id',
        title: 'Version 2',
        factionSlug: null,
        listUrl: 'https://www.40k.app/lists/refresh-me',
        entries: [],
      })

      expect(first.uploadedAt).toBe('2026-01-01T00:00:00.000Z')
      expect(second.uploadedAt).toBe('2026-02-01T00:00:00.000Z')
      const stored = await getListByUrl('https://www.40k.app/lists/refresh-me')
      expect(stored?.uploadedAt).toBe('2026-02-01T00:00:00.000Z')
    } finally {
      toISOStringSpy.mockRestore()
    }
  })
})
