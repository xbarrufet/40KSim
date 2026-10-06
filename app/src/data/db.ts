import type { UnitCatalog } from './schema'

const DB_NAME = '40ksim'
const DB_VERSION = 1

interface FactionRecord {
  id: string
  slug: string
  name: string
  category?: string
  icon?: string
  unitCount: number
}

interface UnitRecord {
  slug: string
  name: string
  factionSlug: string
  category?: string
  points?: number
  keywords: string[]
}

let dbPromise: Promise<IDBDatabase> | null = null

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('factions')) {
        db.createObjectStore('factions', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('units')) {
        db.createObjectStore('units')
      }
      if (!db.objectStoreNames.contains('baseData')) {
        db.createObjectStore('baseData')
      }
      if (!db.objectStoreNames.contains('unitData')) {
        db.createObjectStore('unitData')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

function tx(db: IDBDatabase, stores: string | string[], mode: IDBTransactionMode) {
  return db.transaction(stores, mode)
}

export async function getAllFactions(): Promise<FactionRecord[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'factions', 'readonly')
    const request = t.objectStore('factions').getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getUnitsByFaction(factionSlug: string): Promise<UnitRecord[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'units', 'readonly')
    const store = t.objectStore('units')
    const results: UnitRecord[] = []
    const request = store.openCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        const key = cursor.key as string
        if (key.startsWith(factionSlug + '/')) {
          results.push(cursor.value)
        }
        cursor.continue()
      } else {
        resolve(results)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export async function hasBaseData(factionSlug: string, unitSlug: string): Promise<boolean> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'baseData', 'readonly')
    const request = t.objectStore('baseData').count(`${factionSlug}/${unitSlug}`)
    request.onsuccess = () => resolve(request.result > 0)
    request.onerror = () => reject(request.error)
  })
}

export async function hasUnitData(factionSlug: string, unitSlug: string): Promise<boolean> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'unitData', 'readonly')
    const request = t.objectStore('unitData').count(`${factionSlug}/${unitSlug}`)
    request.onsuccess = () => resolve(request.result > 0)
    request.onerror = () => reject(request.error)
  })
}

export type UnitStatus = 'red' | 'yellow' | 'green'

export async function getUnitStatuses(factionSlug: string, unitSlugs: string[]): Promise<Map<string, UnitStatus>> {
  const db = await getDB()
  const result = new Map<string, UnitStatus>()
  const t = tx(db, ['baseData', 'unitData'], 'readonly')
  const baseStore = t.objectStore('baseData')
  const unitStore = t.objectStore('unitData')

  await Promise.all(unitSlugs.map(unitSlug => {
    const key = `${factionSlug}/${unitSlug}`
    return new Promise<void>((resolve, reject) => {
      const baseReq = baseStore.count(key)
      baseReq.onsuccess = () => {
        const hasBase = baseReq.result > 0
        if (!hasBase) {
          result.set(unitSlug, 'red')
          resolve()
          return
        }
        const unitReq = unitStore.count(key)
        unitReq.onsuccess = () => {
          result.set(unitSlug, unitReq.result > 0 ? 'green' : 'yellow')
          resolve()
        }
        unitReq.onerror = () => reject(unitReq.error)
      }
      baseReq.onerror = () => reject(baseReq.error)
    })
  }))

  return result
}

export async function putBaseData(factionSlug: string, unitSlug: string, data: unknown): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'baseData', 'readwrite')
    const request = t.objectStore('baseData').put(data, `${factionSlug}/${unitSlug}`)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function putUnit(factionSlug: string, unit: UnitRecord): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'units', 'readwrite')
    const request = t.objectStore('units').put(unit, `${factionSlug}/${unit.slug}`)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getBaseDataCount(factionSlug: string): Promise<number> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'baseData', 'readonly')
    let count = 0
    const request = t.objectStore('baseData').openKeyCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        if ((cursor.key as string).startsWith(factionSlug + '/')) count++
        cursor.continue()
      } else {
        resolve(count)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getUnitDataCount(factionSlug: string): Promise<number> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'unitData', 'readonly')
    let count = 0
    const request = t.objectStore('unitData').openKeyCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        if ((cursor.key as string).startsWith(factionSlug + '/')) count++
        cursor.continue()
      } else {
        resolve(count)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export async function isFactionsEmpty(): Promise<boolean> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'factions', 'readonly')
    const request = t.objectStore('factions').count()
    request.onsuccess = () => resolve(request.result === 0)
    request.onerror = () => reject(request.error)
  })
}

export async function seedFromCatalog(catalog: UnitCatalog): Promise<void> {
  const db = await getDB()
  const t = tx(db, ['factions', 'units'], 'readwrite')
  const factionsStore = t.objectStore('factions')
  const unitsStore = t.objectStore('units')

  for (const faction of catalog.factions) {
    const record: FactionRecord = {
      id: faction.id,
      slug: faction.slug,
      name: faction.name,
      category: faction.category,
      icon: faction.icon,
      unitCount: faction.units.length,
    }
    factionsStore.put(record)

    for (const unit of faction.units) {
      const unitRecord: UnitRecord = {
        slug: unit.slug,
        name: unit.name,
        factionSlug: faction.slug,
        category: undefined,
        points: unit.points,
        keywords: unit.keywords ?? [],
      }
      unitsStore.put(unitRecord, `${faction.slug}/${unit.slug}`)
    }
  }

  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
  })
}
