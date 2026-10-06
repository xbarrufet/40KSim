import { readdir, readFile, writeFile, stat, unlink } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const DATA_DIR = fileURLToPath(new URL('../../../data', import.meta.url))

export interface FactionSummary {
  name: string
  slug: string
  category: string
  unitsCount: number
  baseDataCount: number
  unitDataCount: number
  updatedAt: string | null
}

export interface UnitSummary {
  name: string
  slug: string
  category: string
  points: string | null
  hasDatasheet: boolean
  hasUnitData: boolean
}

export interface PointsUpdateResult {
  name: string
  applied: boolean
  oldPoints?: Array<number | null> | null
  newPoints?: number[]
  error?: string
}

export type PointsUpdates =
  | Record<string, number | number[]>
  | Array<{ name: string; points: number | number[] }>

interface FactionsFile {
  [category: string]: Array<{ name: string; url: string; slug: string }>
}

interface UnitListEntry {
  name: string
  category: string
  url: string
  slug: string
  points: string | null
}

interface UnitsFile {
  faction: string
  slug: string
  units_count: number
  units: UnitListEntry[]
}

interface DatasheetComposition {
  points: number | null
  [key: string]: unknown
}

interface DatasheetUnit {
  name: string
  slug: string
  compositions: DatasheetComposition[]
  [key: string]: unknown
}

function dataPath(...segments: string[]): string {
  return path.join(DATA_DIR, ...segments)
}

function baseDataDir(slug: string): string {
  return dataPath(slug, 'BaseData')
}

function unitDataDir(slug: string): string {
  return dataPath(slug, 'UnitData')
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, 'utf8')
    return JSON.parse(raw) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function listJsonSlugs(dir: string): Promise<Set<string>> {
  try {
    const entries = await readdir(dir)
    return new Set(
      entries.filter((entry) => entry.endsWith('.json')).map((entry) => entry.slice(0, -'.json'.length)),
    )
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return new Set()
    throw error
  }
}

function listBaseDataSlugs(slug: string): Promise<Set<string>> {
  return listJsonSlugs(baseDataDir(slug))
}

function listUnitDataSlugs(slug: string): Promise<Set<string>> {
  return listJsonSlugs(unitDataDir(slug))
}

export async function listFactions(): Promise<FactionSummary[]> {
  const factions = await readJson<FactionsFile>(dataPath('factions.json'))
  if (!factions) return []

  const summaries: FactionSummary[] = []
  for (const [category, entries] of Object.entries(factions)) {
    for (const faction of entries) {
      const units = await readJson<UnitsFile>(dataPath(faction.slug, 'units.json'))
      const baseDataSlugs = await listBaseDataSlugs(faction.slug)
      const unitDataSlugs = await listUnitDataSlugs(faction.slug)
      let updatedAt: string | null = null
      try {
        const info = await stat(baseDataDir(faction.slug))
        updatedAt = info.mtime.toISOString()
      } catch {
        updatedAt = null
      }
      summaries.push({
        name: faction.name,
        slug: faction.slug,
        category,
        unitsCount: units?.units.length ?? 0,
        baseDataCount: baseDataSlugs.size,
        unitDataCount: unitDataSlugs.size,
        updatedAt,
      })
    }
  }
  return summaries
}

export async function listUnits(slug: string): Promise<UnitSummary[]> {
  const units = await readJson<UnitsFile>(dataPath(slug, 'units.json'))
  if (!units) return []
  const baseDataSlugs = await listBaseDataSlugs(slug)
  const unitDataSlugs = await listUnitDataSlugs(slug)
  return units.units.map((unit) => ({
    name: unit.name,
    slug: unit.slug,
    category: unit.category,
    points: unit.points,
    hasDatasheet: baseDataSlugs.has(unit.slug),
    hasUnitData: unitDataSlugs.has(unit.slug),
  }))
}

export async function getAllFactionSlugs(): Promise<Array<{ name: string; slug: string }>> {
  const factions = await readJson<FactionsFile>(dataPath('factions.json'))
  if (!factions) return []
  return Object.values(factions)
    .flat()
    .map((faction) => ({ name: faction.name, slug: faction.slug }))
}

export async function removeUnitDatasheets(slug: string, names: string[]): Promise<void> {
  const units = await readJson<UnitsFile>(dataPath(slug, 'units.json'))
  if (!units) return
  const nameSet = new Set(names)
  const targets = units.units.filter((unit) => nameSet.has(unit.name))
  await Promise.all(
    targets.map(async (unit) => {
      try {
        await unlink(path.join(baseDataDir(slug), `${unit.slug}.json`))
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
    }),
  )
}

export async function removeAllDatasheets(slug: string): Promise<void> {
  const slugs = await listBaseDataSlugs(slug)
  await Promise.all(
    Array.from(slugs).map(async (unitSlug) => {
      try {
        await unlink(path.join(baseDataDir(slug), `${unitSlug}.json`))
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
    }),
  )
}

function normalizeUpdates(updates: PointsUpdates): Array<{ name: string; points: number | number[] }> {
  if (Array.isArray(updates)) return updates
  return Object.entries(updates).map(([name, points]) => ({ name, points }))
}

export async function applyPointsUpdates(
  slug: string,
  updates: PointsUpdates,
): Promise<PointsUpdateResult[]> {
  const normalized = normalizeUpdates(updates)
  const units = await readJson<UnitsFile>(dataPath(slug, 'units.json'))

  const results: PointsUpdateResult[] = []
  let unitsChanged = false

  for (const update of normalized) {
    const pointsArray = Array.isArray(update.points) ? update.points : [update.points]
    const result: PointsUpdateResult = { name: update.name, applied: false }

    const listUnit = units?.units.find((unit) => unit.name === update.name)
    if (!listUnit) {
      result.error = 'Unidad no encontrada en el índice de la facción'
      results.push(result)
      continue
    }

    const datasheetPath = path.join(baseDataDir(slug), `${listUnit.slug}.json`)
    const datasheetUnit = await readJson<DatasheetUnit>(datasheetPath)
    if (!datasheetUnit) {
      result.error = 'Datasheet no descargado para esta unidad'
      results.push(result)
      continue
    }
    if (datasheetUnit.compositions.length !== pointsArray.length) {
      result.error = `La unidad tiene ${datasheetUnit.compositions.length} composicion(es), se recibieron ${pointsArray.length} valor(es)`
      results.push(result)
      continue
    }

    result.oldPoints = datasheetUnit.compositions.map((composition) => composition.points)
    datasheetUnit.compositions.forEach((composition, index) => {
      composition.points = pointsArray[index]
    })
    result.newPoints = pointsArray
    await writeJson(datasheetPath, datasheetUnit)

    listUnit.points = String(pointsArray[0])
    unitsChanged = true

    result.applied = true
    results.push(result)
  }

  if (units && unitsChanged) await writeJson(dataPath(slug, 'units.json'), units)

  return results
}
