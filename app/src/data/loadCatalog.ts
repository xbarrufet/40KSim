import type { UnitCatalog } from './schema'

export async function loadCatalog(): Promise<UnitCatalog> {
  const response = await fetch('/data/units.json')
  if (!response.ok) {
    throw new Error(`No se pudo cargar el catálogo (${response.status}).`)
  }

  const value: unknown = await response.json()
  if (!isUnitCatalog(value)) {
    throw new Error('El catálogo local no coincide con el esquema esperado.')
  }

  return value
}

function isUnitCatalog(value: unknown): value is UnitCatalog {
  if (typeof value !== 'object' || value === null) return false

  const catalog = value as Partial<UnitCatalog>
  return catalog.schemaVersion === 1 && Array.isArray(catalog.factions)
}