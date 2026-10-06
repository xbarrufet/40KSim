import type {
  AbilityContext,
  OtherAbility,
  RawAbility,
  Rule,
  StructuredAbility,
  UnitDataStats,
  WargearEntry,
  WeaponProfileData,
} from '../data/schema'

export interface StructuringRow {
  name: string
  type: AbilityContext
  rule: Rule
}

export function buildStructuredAbilities(rows: StructuringRow[]): StructuredAbility[] {
  return rows.map((row) => ({ type: row.type, name: row.name, rule: row.rule }))
}

export function buildOtherAbility(raw: RawAbility, type: AbilityContext = 'Always'): OtherAbility {
  return { type, name: raw.name, category: 'OTHER', text: raw.text }
}

export interface ReviewDraft {
  stats: UnitDataStats
  keywords: string[]
  wargear: WargearEntry[]
}

export function applyResync<T extends ReviewDraft>(draft: T, refreshed: ReviewDraft): T {
  return { ...draft, stats: refreshed.stats, keywords: refreshed.keywords, wargear: refreshed.wargear }
}

export interface WeaponRow {
  key: string
  label: string
  profile: WeaponProfileData
}

export function splitWeaponProfiles(wargear: WargearEntry[]): { ranged: WeaponRow[]; melee: WeaponRow[] } {
  const ranged: WeaponRow[] = []
  const melee: WeaponRow[] = []

  for (const entry of wargear) {
    for (const profile of entry.wargearItem.profiles) {
      const label =
        profile.name && profile.name !== entry.wargearItem.name
          ? `${entry.wargearItem.name} (${profile.name})`
          : entry.wargearItem.name
      const row: WeaponRow = { key: `${entry.wargearItem.id}-${profile.id}`, label, profile }
      ;(profile.type === 'ranged' ? ranged : melee).push(row)
    }
  }

  return { ranged, melee }
}
