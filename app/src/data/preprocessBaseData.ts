import type { RawAbility, UnitData, UnitDataStats, WargearEntry, WeaponProfileData } from './schema'
import { parseWeaponAbilityName } from './weaponKeywords'

interface BaseDataAbility {
  name: string
  rules: string | null
  abilityType: string
}

interface BaseDataWeaponAbility {
  id: number
  name: string
}

interface BaseDataWeaponProfile {
  id: number
  name: string
  type: 'melee' | 'ranged'
  range: string
  attacks: string
  ballisticSkill?: string | null
  weaponSkill?: string | null
  strength: string
  armourPenetration: string
  damage: string
  abilities: BaseDataWeaponAbility[]
}

interface BaseDataWargearItem {
  id: number
  name: string
  wargearType: string
  profiles: BaseDataWeaponProfile[]
}

interface BaseDataWargearEntry {
  count?: number
  wargearItem: BaseDataWargearItem
}

interface BaseDataMiniature {
  id: number
  name: string
  stats: Record<string, string>
  keywords: { id: number; name: string }[]
  defaultWargear: BaseDataWargearEntry[]
  wargear: BaseDataWargearEntry[]
}

interface BaseDataComposition {
  points: number
  models: number
  miniatures: { miniatureId: number; miniatureName: string; min: number; max: number }[]
}

interface BaseDataLeadsEntry {
  attachType: 'leader' | 'support'
  datasheet: { name: string }
}

export interface BaseData {
  id: number
  slug: string
  name: string
  baseSize?: string
  unitComposition?: string
  abilities: BaseDataAbility[]
  miniatures: BaseDataMiniature[]
  compositions?: BaseDataComposition[]
  ledBy?: BaseDataLeadsEntry[]
}

function parseStatNumber(raw: string | undefined): number {
  if (!raw) return 0
  const match = raw.match(/\d+/)
  return match ? Number(match[0]) : 0
}

// A datasheet's statline is shared by all its miniatures (sergeant-type variants
// are wargear-only, per simulation-unit-data's Out of Scope note), so the
// representative miniature is just the one with the largest squad presence.
function pickRepresentativeMiniature(baseData: BaseData): BaseDataMiniature {
  const maxByMiniatureId = new Map<number, number>()
  for (const composition of baseData.compositions ?? []) {
    for (const entry of composition.miniatures) {
      const current = maxByMiniatureId.get(entry.miniatureId) ?? 0
      maxByMiniatureId.set(entry.miniatureId, Math.max(current, entry.max))
    }
  }

  let best = baseData.miniatures[0]
  let bestMax = maxByMiniatureId.get(best.id) ?? 0
  for (const miniature of baseData.miniatures) {
    const max = maxByMiniatureId.get(miniature.id) ?? 0
    if (max > bestMax) {
      best = miniature
      bestMax = max
    }
  }
  return best
}

function toStats(miniature: BaseDataMiniature): UnitDataStats {
  return {
    movement: parseStatNumber(miniature.stats.movement),
    toughness: parseStatNumber(miniature.stats.toughness),
    save: parseStatNumber(miniature.stats.save),
    invulnerableSave: null,
    wounds: parseStatNumber(miniature.stats.wounds),
    leadership: parseStatNumber(miniature.stats.leadership),
    objectiveControl: parseStatNumber(miniature.stats.objectiveControl),
  }
}

function toWeaponProfile(profile: BaseDataWeaponProfile): WeaponProfileData {
  return {
    id: profile.id,
    name: profile.name,
    type: profile.type,
    range: profile.range,
    attacks: profile.attacks,
    ballisticSkill: profile.ballisticSkill ?? null,
    weaponSkill: profile.weaponSkill ?? null,
    strength: profile.strength,
    armourPenetration: profile.armourPenetration,
    damage: profile.damage,
    abilities: profile.abilities.map((ability) => {
      const parsed = parseWeaponAbilityName(ability.name)
      return { id: ability.id, name: parsed.name, value: parsed.value }
    }),
  }
}

function buildWargearCatalogue(baseData: BaseData): WargearEntry[] {
  const defaultCounts = new Map<number, number>()
  for (const miniature of baseData.miniatures) {
    for (const entry of miniature.defaultWargear) {
      if (entry.count !== undefined) defaultCounts.set(entry.wargearItem.id, entry.count)
    }
  }

  const byId = new Map<number, WargearEntry>()
  for (const miniature of baseData.miniatures) {
    for (const entry of [...miniature.defaultWargear, ...miniature.wargear]) {
      const item = entry.wargearItem
      if (byId.has(item.id)) continue
      byId.set(item.id, {
        wargearItem: {
          id: item.id,
          name: item.name,
          wargearType: item.wargearType,
          count: defaultCounts.get(item.id) ?? entry.count ?? 1,
          profiles: item.profiles.map(toWeaponProfile),
        },
      })
    }
  }

  return [...byId.values()]
}

function toRawAbilities(baseData: BaseData): RawAbility[] {
  return baseData.abilities.map((ability) => ({
    name: ability.name,
    text: ability.rules ?? '',
    abilityType: ability.abilityType,
  }))
}

export interface DatasheetMiniatureRow {
  name: string
  baseSize?: string
  stats: UnitDataStats
}

export interface DatasheetCost {
  models: number
  points: number
}

export interface DatasheetContext {
  unitComposition?: string
  miniatures: DatasheetMiniatureRow[]
  costs: DatasheetCost[]
  ledBy: string[]
  supportedBy: string[]
}

export function extractDatasheetContext(baseData: BaseData): DatasheetContext {
  const ledByEntries = baseData.ledBy ?? []
  return {
    unitComposition: baseData.unitComposition,
    miniatures: baseData.miniatures.map((miniature) => ({
      name: miniature.name,
      baseSize: baseData.baseSize,
      stats: toStats(miniature),
    })),
    costs: (baseData.compositions ?? []).map((composition) => ({
      models: composition.models,
      points: composition.points,
    })),
    ledBy: ledByEntries.filter((entry) => entry.attachType === 'leader').map((entry) => entry.datasheet.name),
    supportedBy: ledByEntries.filter((entry) => entry.attachType === 'support').map((entry) => entry.datasheet.name),
  }
}

export function preprocessBaseData(baseData: BaseData): UnitData {
  const representative = pickRepresentativeMiniature(baseData)
  return {
    tag: 'PENDING',
    id: baseData.id,
    slug: baseData.slug,
    name: baseData.name,
    keywords: representative.keywords.map((keyword) => keyword.name.toUpperCase()),
    stats: toStats(representative),
    wargear: buildWargearCatalogue(baseData),
    abilities: [],
    rawAbilities: toRawAbilities(baseData),
  }
}
