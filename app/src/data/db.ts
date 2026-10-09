import type { ArmyList, Effect, StructuredAbilitiesData, UnitDataAbility, WeaponTarget } from './schema'
import type { UnitCatalog } from './schema'

function migrateAbility(raw: unknown): UnitDataAbility {
  const a = raw as Record<string, unknown>
  if ('effects' in a) return a as unknown as UnitDataAbility
  if (a.category === 'OTHER') return a as unknown as UnitDataAbility
  const rule = a.rule as Record<string, unknown>
  if (!rule) return a as unknown as UnitDataAbility

  const trigger = (rule.trigger as string) ?? 'ALWAYS'
  const appliedTo = (rule.appliedTo as string) ?? 'SelfModel'

  let effect: Effect
  const ruleType = rule.type as string

  const ap = appliedTo as import('./schema').AppliesTo
  if (ruleType === 'unitStatsModifier') {
    const raw_value = rule.value as string
    const num = parseFloat(raw_value?.replace('+', '') ?? '0')
    effect = { category: 'statModifier', appliedTo: ap, stat: rule.stat as never, mode: num < 0 ? 'subtract' : 'add', value: Math.abs(num) }
  } else if (ruleType === 'weaponStatsModifier') {
    const raw_value = rule.value as string
    const num = parseFloat(raw_value?.replace('+', '') ?? '0')
    effect = { category: 'statModifier', appliedTo: ap, weaponTarget: (rule.weaponTarget as WeaponTarget) ?? 'ALL', stat: rule.stat as never, mode: num < 0 ? 'subtract' : 'add', value: Math.abs(num) }
  } else if (ruleType === 'diceModifier') {
    const modifier = rule.modifier as Record<string, unknown>
    const rollMap: Record<string, 'toHit' | 'toWound' | 'savingThrow'> = { Hit: 'toHit', Wound: 'toWound', Save: 'savingThrow' }
    const roll = rollMap[rule.throw as string] ?? 'toHit'
    if (modifier?.kind === 'reroll') {
      effect = { category: 'diceModifier', appliedTo: ap, roll, action: modifier.reroll === 'ALL' ? 'rerollAll' : 'rerollOnes' }
    } else {
      const val = parseFloat((modifier?.value as string)?.replace('+', '') ?? '0')
      effect = { category: 'diceModifier', appliedTo: ap, roll, action: val < 0 ? 'subtractFromRoll' : 'addToRoll' }
    }
  } else {
    effect = { category: 'weaponKeyword', appliedTo: ap, weaponTarget: (rule.weaponTarget as WeaponTarget) ?? 'ALL', keyword: rule.attribute as never, value: (rule.value as string) ?? null }
  }

  return {
    type: (a.type as never) ?? 'Always',
    name: (a.name as string) ?? '',
    attackType: 'ANY',
    trigger,
    effects: [effect],
  }
}

const DB_NAME = '40ksim'
const DB_VERSION = 2

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
      if (!db.objectStoreNames.contains('lists')) {
        db.createObjectStore('lists')
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

export async function getBaseDataUnitsByFaction(factionSlug: string): Promise<{ slug: string; name: string }[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'baseData', 'readonly')
    const store = t.objectStore('baseData')
    const results: { slug: string; name: string }[] = []
    const request = store.openCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        const key = cursor.key as string
        if (key.startsWith(factionSlug + '/')) {
          const value = cursor.value as { slug: string; name: string }
          results.push({ slug: value.slug, name: value.name })
        }
        cursor.continue()
      } else {
        resolve(results)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getBaseData(factionSlug: string, unitSlug: string): Promise<unknown> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'baseData', 'readonly')
    const request = t.objectStore('baseData').get(`${factionSlug}/${unitSlug}`)
    request.onsuccess = () => resolve(request.result)
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

export async function hasStructuredAbilitiesData(factionSlug: string, unitSlug: string): Promise<boolean> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'unitData', 'readonly')
    const request = t.objectStore('unitData').count(`${factionSlug}/${unitSlug}`)
    request.onsuccess = () => resolve(request.result > 0)
    request.onerror = () => reject(request.error)
  })
}

export type UnitStatus = 'red' | 'amber' | 'green'

export async function getUnitStatuses(factionSlug: string, unitSlugs: string[]): Promise<Map<string, UnitStatus>> {
  const db = await getDB()
  const result = new Map<string, UnitStatus>()
  const t = tx(db, 'unitData', 'readonly')
  const unitStore = t.objectStore('unitData')

  await Promise.all(unitSlugs.map(unitSlug => {
    const key = `${factionSlug}/${unitSlug}`
    return new Promise<void>((resolve, reject) => {
      const request = unitStore.get(key)
      request.onsuccess = () => {
        const structuredAbilitiesData = request.result as StructuredAbilitiesData | undefined
        const tag = structuredAbilitiesData?.tag
        result.set(unitSlug, tag === 'CONFIRMED' ? 'green' : tag === 'AI_PROPOSED' ? 'amber' : 'red')
        resolve()
      }
      request.onerror = () => reject(request.error)
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

export async function getStructuredAbilitiesData(factionSlug: string, unitSlug: string): Promise<StructuredAbilitiesData | undefined> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'unitData', 'readonly')
    const request = t.objectStore('unitData').get(`${factionSlug}/${unitSlug}`)
    request.onsuccess = () => {
      const raw = request.result as StructuredAbilitiesData | undefined
      if (!raw) { resolve(undefined); return }
      resolve({ ...raw, abilities: raw.abilities.map(migrateAbility) })
    }
    request.onerror = () => reject(request.error)
  })
}

export async function putStructuredAbilitiesData(factionSlug: string, unitSlug: string, data: StructuredAbilitiesData): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'unitData', 'readwrite')
    const request = t.objectStore('unitData').put(data, `${factionSlug}/${unitSlug}`)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function syncUnitCatalog(
  factionSlug: string,
  catalogUnits: Array<{ slug: string; name: string; category?: string; points?: number }>,
): Promise<{ added: number; updated: number }> {
  const existing = await getUnitsByFaction(factionSlug)
  const bySlug = new Map(existing.map((u) => [u.slug, u]))
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'units', 'readwrite')
    const store = t.objectStore('units')
    let added = 0
    let updated = 0
    for (const unit of catalogUnits) {
      const prev = bySlug.get(unit.slug)
      const record: UnitRecord = prev
        ? { ...prev, name: unit.name, category: unit.category, points: unit.points }
        : { slug: unit.slug, name: unit.name, factionSlug, category: unit.category, points: unit.points, keywords: [] }
      if (prev) updated++; else added++
      store.put(record, `${factionSlug}/${unit.slug}`)
    }
    t.oncomplete = () => resolve({ added, updated })
    t.onerror = () => reject(t.error)
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

export async function getConfirmedUnitDataCount(factionSlug: string): Promise<number> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'unitData', 'readonly')
    let count = 0
    const request = t.objectStore('unitData').openCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        const key = cursor.key as string
        const structuredAbilitiesData = cursor.value as StructuredAbilitiesData
        if (key.startsWith(factionSlug + '/') && structuredAbilitiesData.tag === 'CONFIRMED') count++
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

export async function getAllLists(): Promise<ArmyList[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'lists', 'readonly')
    const request = t.objectStore('lists').getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getListByUrl(listUrl: string): Promise<ArmyList | undefined> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'lists', 'readonly')
    const request = t.objectStore('lists').getAll()
    request.onsuccess = () => {
      const lists = request.result as ArmyList[]
      resolve(lists.find((list) => list.listUrl === listUrl))
    }
    request.onerror = () => reject(request.error)
  })
}

export async function putList(list: ArmyList): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'lists', 'readwrite')
    const request = t.objectStore('lists').put(list, list.id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function deleteList(id: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'lists', 'readwrite')
    const request = t.objectStore('lists').delete(id)
    request.onsuccess = () => resolve()
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
        category: unit.category,
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
