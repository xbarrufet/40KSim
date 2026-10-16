export interface UnitRow {
  faction_slug: string
  slug: string
  name: string
  category: string | null
  points: number | null
  keywords: string[]
}

export interface UnitDataRow {
  tag: string
  abilities: unknown[]
  raw_abilities: unknown[]
  base_data_hash: string | null
}

export interface LoadoutDataRow {
  tag: string
  options: unknown[]
}

export interface UnitFull {
  slug: string
  name: string
  category: string | null
  points: number | null
  keywords: string[]
  baseData: Record<string, unknown> | null
  abilities: {
    tag: string
    abilities: unknown[]
    rawAbilities: unknown[]
    baseDataHash: string | null
  } | null
  loadout: {
    tag: string
    options: unknown[]
  } | null
}

export function buildUnitFull(
  unit: UnitRow,
  baseData: Record<string, unknown> | null,
  unitData: UnitDataRow | null,
  loadoutData: LoadoutDataRow | null,
): UnitFull {
  return {
    slug: unit.slug,
    name: unit.name,
    category: unit.category,
    points: unit.points,
    keywords: unit.keywords,
    baseData: baseData ?? null,
    abilities: unitData
      ? {
          tag: unitData.tag,
          abilities: unitData.abilities,
          rawAbilities: unitData.raw_abilities,
          baseDataHash: unitData.base_data_hash,
        }
      : null,
    loadout: loadoutData
      ? {
          tag: loadoutData.tag,
          options: loadoutData.options,
        }
      : null,
  }
}
