import { useEffect, useState } from 'react'
import { getBaseData, getStructuredAbilitiesData, putStructuredAbilitiesData } from '../../data/db'
import {
  extractDatasheetContext,
  getUnitKeywords,
  getUnitWargear,
  getWeaponNames,
  toRawAbilities,
  type BaseData,
  type DatasheetContext,
  type WeaponNameEntry,
} from '../../data/preprocessBaseData'
import type { StructuredAbilitiesData, WargearEntry } from '../../data/schema'
import { isValidDiceNotation } from '../../data/diceNotation'
import { computeBaseDataHash, reconcileRawAbilities } from '../processUnitLogic'

export type Draft = Pick<StructuredAbilitiesData, 'abilities' | 'rawAbilities'>

function toDraft(structuredAbilitiesData: StructuredAbilitiesData): Draft {
  return {
    abilities: structuredAbilitiesData.abilities,
    rawAbilities: structuredAbilitiesData.rawAbilities,
  }
}

export function useProcessUnitData(faction: { slug: string; name: string }, unitSlug: string, onSaved: () => void) {
  const [structuredAbilitiesData, setStructuredAbilitiesData] = useState<StructuredAbilitiesData | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [unitName, setUnitName] = useState(unitSlug)
  const [datasheet, setDatasheet] = useState<DatasheetContext | null>(null)
  const [wargear, setWargear] = useState<WargearEntry[]>([])
  const [weaponNames, setWeaponNames] = useState<WeaponNameEntry[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [baseDataAbilitiesMap, setBaseDataAbilitiesMap] = useState<Record<string, string>>({})
  const [baseDataChanged, setBaseDataChanged] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [resolvedAbilitiesFaction, setResolvedAbilitiesFaction] = useState(faction.slug)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [abilitiesResult, baseDataRaw] = await Promise.all([
          getStructuredAbilitiesData(faction.slug, unitSlug),
          getBaseData(faction.slug, unitSlug),
        ])
        if (!abilitiesResult) {
          setError('Esta unidad no tiene datos todavía. Sube su BaseData primero.')
          return
        }
        const structuredData = abilitiesResult.data
        setResolvedAbilitiesFaction(abilitiesResult.resolvedFaction)
        setStructuredAbilitiesData(structuredData)
        setDraft(toDraft(structuredData))
        if (baseDataRaw) {
          const data = baseDataRaw as BaseData
          setUnitName(data.name)
          setDatasheet(extractDatasheetContext(data))
          const unitWargear = getUnitWargear(data)
          setWargear(unitWargear)
          setWeaponNames(getWeaponNames(unitWargear))
          setKeywords(getUnitKeywords(data))
          const abMap: Record<string, string> = {}
          for (const ab of data.abilities) {
            if (ab.rules) abMap[ab.name] = ab.rules
          }
          setBaseDataAbilitiesMap(abMap)
          if (structuredData.tag === 'CONFIRMED') {
            const currentHash = await computeBaseDataHash(baseDataRaw)
            setBaseDataChanged(!structuredData.baseDataHash || structuredData.baseDataHash !== currentHash)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la unidad')
      }
    }
    void loadData()
  }, [faction.slug, unitSlug])

  const resync = async () => {
    const baseData = await getBaseData(faction.slug, unitSlug)
    if (!baseData) {
      setError('No se encontró BaseData para esta unidad.')
      return
    }
    const data = baseData as BaseData
    setUnitName(data.name)
    setDatasheet(extractDatasheetContext(data))
    const unitWargear = getUnitWargear(data)
    setWargear(unitWargear)
    setWeaponNames(getWeaponNames(unitWargear))
    setKeywords(getUnitKeywords(data))
    setDraft((current) => {
      if (!current) return current
      return { ...current, rawAbilities: reconcileRawAbilities(current.abilities, current.rawAbilities, toRawAbilities(data)) }
    })
  }

  const resyncNoChanges = async () => {
    const baseDataRaw = await getBaseData(faction.slug, unitSlug)
    if (!baseDataRaw) return
    const currentHash = await computeBaseDataHash(baseDataRaw)
    const updated: StructuredAbilitiesData = {
      ...structuredAbilitiesData!,
      baseDataHash: currentHash,
    }
    await putStructuredAbilitiesData(faction.slug, unitSlug, updated)
    setStructuredAbilitiesData(updated)
    setBaseDataChanged(false)
  }

  const validateDiceNotations = (): boolean => {
    if (!draft) return false
    for (const ability of draft.abilities) {
      if (!('effects' in ability)) continue
      for (const effect of ability.effects) {
        if (effect.category === 'mortalWounds') {
          if (effect.hits.kind === 'notation' && !isValidDiceNotation(effect.hits.value)) {
            setValidationError(`"${effect.hits.value}" no es notación de dados válida en "${ability.name}" (Impactos)`)
            return false
          }
          if (!isValidDiceNotation(effect.damagePerSuccess)) {
            setValidationError(`"${effect.damagePerSuccess}" no es notación de dados válida en "${ability.name}" (MW por éxito)`)
            return false
          }
        }
        if ('targetCondition' in effect && effect.targetCondition && effect.targetCondition.keywords.length === 0) {
          setValidationError(`Condición objetivo sin keywords en "${ability.name}"`)
          return false
        }
      }
    }
    setValidationError(null)
    return true
  }

  const save = async () => {
    if (!draft || !validateDiceNotations()) return
    setSaving(true)
    try {
      const baseDataRaw = await getBaseData(faction.slug, unitSlug)
      const baseDataHash = baseDataRaw ? await computeBaseDataHash(baseDataRaw) : undefined
      const confirmed: StructuredAbilitiesData = {
        abilities: draft.abilities,
        rawAbilities: draft.rawAbilities,
        tag: 'CONFIRMED',
        baseDataHash,
      }
      await putStructuredAbilitiesData(resolvedAbilitiesFaction, unitSlug, confirmed)
      setStructuredAbilitiesData(confirmed)
      setBaseDataChanged(false)
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return {
    structuredAbilitiesData,
    draft,
    setDraft,
    unitName,
    datasheet,
    wargear,
    weaponNames,
    keywords,
    error,
    saving,
    baseDataAbilitiesMap,
    baseDataChanged,
    validationError,
    resync,
    resyncNoChanges,
    save,
  }
}
