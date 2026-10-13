import { Fragment, useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { getBaseData, getLoadoutData, getStructuredAbilitiesData, putLoadoutData, putStructuredAbilitiesData } from '../data/db'
import {
  extractDatasheetContext,
  getUnitKeywords,
  getUnitWargear,
  getWeaponNames,
  toRawAbilities,
  type BaseData,
  type DatasheetContext,
  type WeaponNameEntry,
} from '../data/preprocessBaseData'
import type {
  AppliesTo,
  Phase,
  DamageMitigationEffect,
  DiceModifierEffect,
  Effect,
  Frequency,
  MortalWoundsHits,
  MortalWoundsResolution,
  MortalWoundsUnitType,
  OtherAbility,
  StatModifierEffect,
  StructuredAbilitiesData,
  StructuredLoadoutData,
  TargetCondition,
  TargetConditionKeyword,
  UnitKeywordEffect,
  UnitStat,
  WargearEntry,
  WargearOption,
  WeaponKeywordEffect,
  WeaponStat,
  WeaponTarget,
} from '../data/schema'
import { isValidDiceNotation } from '../data/diceNotation'
import { KNOWN_UNIT_KEYWORDS, TARGET_CONDITION_KEYWORDS, type KnownUnitKeyword } from '../data/schema'
import { KNOWN_WEAPON_KEYWORDS, type KnownAttribute } from '../data/weaponKeywords'
import {
  buildOtherAbility,
  buildStructuredAbilities,
  reconcileRawAbilities,
  type StructuringRow,
} from './processUnitLogic'
import { FormattedAbilityText } from './FormattedAbilityText'
import { UnitDatasheet } from './UnitDatasheet'

async function computeBaseDataHash(baseData: unknown): Promise<string> {
  const encoded = new TextEncoder().encode(JSON.stringify(baseData))
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

interface ProcessUnitViewProps {
  faction: { slug: string; name: string }
  unitSlug: string
  onBack: () => void
  onSaved: () => void
}

type Draft = Pick<StructuredAbilitiesData, 'abilities' | 'rawAbilities'>

function toDraft(structuredAbilitiesData: StructuredAbilitiesData): Draft {
  return {
    abilities: structuredAbilitiesData.abilities,
    rawAbilities: structuredAbilitiesData.rawAbilities,
  }
}

const WEAPON_STATS = new Set<string>(['Strength', 'Damage', 'Range', 'Attacks', 'AP', 'Skill'])
function isWeaponStat(s: string): boolean { return WEAPON_STATS.has(s) }

function defaultEffectForCategory(category: Effect['category']): Effect {
  switch (category) {
    case 'statModifier':
      return { category, appliedTo: 'SelfModel', stat: 'ObjectiveControl', mode: 'add', value: 1 }
    case 'diceModifier':
      return { category, appliedTo: 'SelfModel', roll: 'toHit', action: 'rerollOnes' }
    case 'weaponKeyword':
      return { category, appliedTo: 'SelfModel', weaponTarget: 'ALL', keyword: KNOWN_WEAPON_KEYWORDS[0], value: null }
    case 'damageMitigation':
      return { category, appliedTo: 'SelfModel', kind: 'fnp', value: 5, condition: 'any' }
    case 'mortalWounds':
      return { category, appliedTo: 'Enemy', unitType: 'ALL', hits: { kind: 'notation', value: '1' }, resolution: { kind: 'always' }, damagePerSuccess: '1' }
    case 'unitKeyword':
      return { category, appliedTo: 'SelfUnit', keyword: 'BENEFIT OF COVER' as const, value: null }
    case 'heal':
      return { category, appliedTo: 'SelfUnit', amount: '1' }
  }
}

function describeHits(hits: MortalWoundsHits): string {
  switch (hits.kind) {
    case 'notation': return hits.value
    case 'byStat': return hits.stat
  }
}

function describeTargetCondition(tc?: TargetCondition): string {
  if (!tc || tc.keywords.length === 0) return ''
  const label = tc.mode === 'excludes' ? 'non-' : 'vs '
  return ` [${label}${tc.keywords.join('/')}]`
}

function describeEffect(effect: Effect): string {
  switch (effect.category) {
    case 'statModifier':
      return `${effect.mode} ${effect.stat}${effect.value !== undefined ? ` ${effect.value}` : ''}${describeTargetCondition(effect.targetCondition)}`
    case 'diceModifier':
      return `${effect.action} ${effect.roll}${describeTargetCondition(effect.targetCondition)}`
    case 'weaponKeyword':
      return `${effect.keyword}${effect.value ? ` ${effect.value}` : ''} (${effect.weaponTarget})${describeTargetCondition(effect.targetCondition)}`
    case 'damageMitigation':
      return `${effect.kind}${effect.value !== undefined ? ` ${effect.value}` : ''}${effect.condition ? ` vs ${effect.condition}` : ''}`
    case 'mortalWounds': {
      const res = effect.resolution.kind === 'always' ? '' : ` ${effect.resolution.threshold}+`
      const unitStr = effect.unitType !== 'ALL' ? ` vs${effect.unitType}` : ''
      return `MW ${describeHits(effect.hits)}imp${res} →${effect.damagePerSuccess}MW${unitStr}`
    }
    case 'unitKeyword':
      return `${effect.keyword}${effect.value ? ` ${effect.value}` : ''}`
    case 'heal':
      return `Curar ${effect.amount ?? '1'}`
  }
}

const FREQUENCY_LABELS: Record<string, string> = { perPhase: '1/fase', perRound: '1/ronda', perBattle: '1/partida' }

const PHASE_SHORT_LABELS: Record<string, string> = { ANY: 'Cualq.', MOVEMENT: 'Mov.', SHOOTING: 'Disp.', CHARGE: 'Carga', FIGHT: 'Comb.', COMMAND: 'Mando' }

const EFFECT_CATEGORY_LABELS: Record<string, string> = { statModifier: 'stat', diceModifier: 'tirada', weaponKeyword: 'wkw', unitKeyword: 'ukw', damageMitigation: 'dmgMit', mortalWounds: 'MW', heal: 'heal' }



export function ProcessUnitView({ faction, unitSlug, onBack, onSaved }: ProcessUnitViewProps) {
  const [structuredAbilitiesData, setStructuredAbilitiesData] = useState<StructuredAbilitiesData | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [unitName, setUnitName] = useState(unitSlug)
  const [datasheet, setDatasheet] = useState<DatasheetContext | null>(null)
  const [wargear, setWargear] = useState<WargearEntry[]>([])
  const [weaponNames, setWeaponNames] = useState<WeaponNameEntry[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [structuringIndex, setStructuringIndex] = useState<number | null>(null)
  const [structuringRows, setStructuringRows] = useState<StructuringRow[]>([])
  const [editingAbilityIndex, setEditingAbilityIndex] = useState<number | null>(null)
  const [editingAbilityText, setEditingAbilityText] = useState<string | null>(null)
  const [editingOtherIndex, setEditingOtherIndex] = useState<number | null>(null)
  const [editingOtherText, setEditingOtherText] = useState<string>('')
  const [baseDataAbilitiesMap, setBaseDataAbilitiesMap] = useState<Record<string, string>>({})
  const [baseDataChanged, setBaseDataChanged] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [loadoutData, setLoadoutData] = useState<StructuredLoadoutData | null>(null)
  const [loadoutDecisions, setLoadoutDecisions] = useState<Map<number, 'approved' | 'rejected'>>(new Map())
  const [savingLoadout, setSavingLoadout] = useState(false)
  const [resolvedAbilitiesFaction, setResolvedAbilitiesFaction] = useState(faction.slug)
  const [resolvedLoadoutFaction, setResolvedLoadoutFaction] = useState(faction.slug)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [abilitiesResult, baseDataRaw, loadoutResult] = await Promise.all([
          getStructuredAbilitiesData(faction.slug, unitSlug),
          getBaseData(faction.slug, unitSlug),
          getLoadoutData(faction.slug, unitSlug),
        ])
        if (loadoutResult) {
          setLoadoutData(loadoutResult.data)
          setResolvedLoadoutFaction(loadoutResult.resolvedFaction)
          if (loadoutResult.data.tag === 'CONFIRMED') {
            const decisions = new Map<number, 'approved' | 'rejected'>()
            loadoutResult.data.options.forEach((_, i) => decisions.set(i, 'approved'))
            setLoadoutDecisions(decisions)
          }
        }
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

  if (error) {
    return (
      <section className="workspace">
        <TopBar name={unitSlug} onBack={onBack} />
        <p className="board-alert">{error}</p>
      </section>
    )
  }

  if (!structuredAbilitiesData || !draft) {
    return (
      <section className="workspace">
        <TopBar name={unitSlug} onBack={onBack} />
        <p>Cargando…</p>
      </section>
    )
  }

  const startStructuring = (index: number) => {
    const raw = draft.rawAbilities[index]
    setStructuringIndex(index)
    setStructuringRows([
      { name: raw.name, phase: 'ANY', trigger: 'ALWAYS', effects: [defaultEffectForCategory('statModifier')] },
    ])
  }

  const cancelStructuring = () => {
    setStructuringIndex(null)
    setEditingAbilityIndex(null)
    setStructuringRows([])
    setEditingAbilityText(null)
  }

  const startEditingOther = (index: number) => {
    const ability = draft.abilities[index]
    if (!('category' in ability) || ability.category !== 'OTHER') return
    setEditingOtherIndex(index)
    setEditingOtherText(ability.text)
  }

  const cancelEditingOther = () => {
    setEditingOtherIndex(null)
    setEditingOtherText('')
  }

  const saveOther = () => {
    if (editingOtherIndex === null) return
    const ability = draft.abilities[editingOtherIndex] as OtherAbility
    setDraft((current) => {
      if (!current) return current
      const updated = [...current.abilities]
      updated[editingOtherIndex] = { ...ability, text: editingOtherText }
      return { ...current, abilities: updated }
    })
    cancelEditingOther()
  }

  const structureFromOther = () => {
    if (editingOtherIndex === null) return
    const ability = draft.abilities[editingOtherIndex] as OtherAbility
    setEditingAbilityIndex(editingOtherIndex)
    setEditingAbilityText(editingOtherText)
    setStructuringRows([{ name: ability.name, phase: 'ANY', trigger: 'ALWAYS', effects: [defaultEffectForCategory('statModifier')] }])
    cancelEditingOther()
  }

  const startEditing = (index: number) => {
    const ability = draft.abilities[index]
    if (!('effects' in ability)) return
    setEditingAbilityIndex(index)
    const baseName = ability.name.replace(/\s+\(efecto \d+\)$/, '')
    const baseDataText = baseDataAbilitiesMap[ability.name]
      ?? baseDataAbilitiesMap[baseName]
      ?? Object.entries(baseDataAbilitiesMap).find(([k]) => k.toLowerCase() === baseName.toLowerCase())?.[1]
    setEditingAbilityText(
      ability.originalText ??
      baseDataText ??
      (draft.rawAbilities.find((r) => r.name === baseName || r.name === ability.name)?.text ?? null)
    )
    setStructuringRows([{ name: ability.name, phase: ability.phase, trigger: ability.trigger, autoApply: ability.autoApply, frequency: ability.frequency, groupId: ability.groupId, groupOperator: ability.groupOperator, effectsOperator: ability.effectsOperator, effects: [...ability.effects] }])
  }

  const commitEdit = () => {
    if (editingAbilityIndex === null) return
    const existingAbility = draft.abilities[editingAbilityIndex]
    const newAbilities = buildStructuredAbilities(structuringRows)
    newAbilities[0].originalText =
      ('originalText' in existingAbility ? existingAbility.originalText : undefined) ??
      editingAbilityText ??
      undefined
    setDraft((current) => {
      if (!current) return current
      const updated = [...current.abilities]
      updated.splice(editingAbilityIndex, 1, ...newAbilities)
      return { ...current, abilities: updated }
    })
    cancelStructuring()
  }

  const markEditingAbilityAsOther = () => {
    if (editingAbilityIndex === null) return
    const ability = draft.abilities[editingAbilityIndex]
    const otherAbility: OtherAbility = {
      name: ability.name,
      category: 'OTHER',
      text: editingAbilityText ?? '',
    }
    setDraft((current) => {
      if (!current) return current
      const updated = [...current.abilities]
      updated.splice(editingAbilityIndex, 1, otherAbility)
      return { ...current, abilities: updated }
    })
    cancelStructuring()
  }

  const addStructuringRow = () => {
    const baseName =
      structuringIndex !== null
        ? draft.rawAbilities[structuringIndex].name
        : structuringRows[0]?.name ?? ''
    setStructuringRows((rows) => [
      ...rows,
      { name: `${baseName} (efecto ${rows.length + 1})`, phase: 'ANY', trigger: 'ALWAYS', effects: [defaultEffectForCategory('statModifier')] },
    ])
  }

  const updateStructuringRow = (rowIndex: number, patch: Partial<StructuringRow>) => {
    setStructuringRows((rows) => rows.map((row, i) => (i === rowIndex ? { ...row, ...patch } : row)))
  }

  const addEffectToRow = (rowIndex: number) => {
    setStructuringRows((rows) =>
      rows.map((row, i) => i === rowIndex ? { ...row, effects: [...row.effects, defaultEffectForCategory('statModifier')] } : row)
    )
  }

  const removeEffectFromRow = (rowIndex: number, effectIndex: number) => {
    setStructuringRows((rows) =>
      rows.map((row, i) => {
        if (i !== rowIndex) return row
        const effects = row.effects.filter((_, ei) => ei !== effectIndex)
        return { ...row, effects, effectsOperator: effects.length < 2 ? undefined : row.effectsOperator }
      })
    )
  }

  const updateEffectInRow = (rowIndex: number, effectIndex: number, effect: Effect) => {
    setStructuringRows((rows) =>
      rows.map((row, i) => i === rowIndex ? { ...row, effects: row.effects.map((e, ei) => ei === effectIndex ? effect : e) } : row)
    )
  }

  const commitStructuring = () => {
    if (structuringIndex === null) return
    const newAbilities = buildStructuredAbilities(structuringRows)
    newAbilities[0].originalText = draft.rawAbilities[structuringIndex]?.text
    setDraft((current) => {
      if (!current) return current
      return {
        ...current,
        abilities: [...current.abilities, ...newAbilities],
        rawAbilities: current.rawAbilities.filter((_, i) => i !== structuringIndex),
      }
    })
    cancelStructuring()
  }

  const markAsOther = (index: number) => {
    const raw = draft.rawAbilities[index]
    const otherAbility = buildOtherAbility(raw)
    setDraft((current) => {
      if (!current) return current
      return {
        ...current,
        abilities: [...current.abilities, otherAbility],
        rawAbilities: current.rawAbilities.filter((_, i) => i !== index),
      }
    })
  }

  const removeReviewedAbility = (index: number) => {
    setDraft((current) => {
      if (!current) return current
      return { ...current, abilities: current.abilities.filter((_, i) => i !== index) }
    })
  }

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
      ...structuredAbilitiesData,
      baseDataHash: currentHash,
    }
    await putStructuredAbilitiesData(faction.slug, unitSlug, updated)
    setStructuredAbilitiesData(updated)
    setBaseDataChanged(false)
  }

  const validateDiceNotations = (): boolean => {
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
    if (!validateDiceNotations()) return
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

  const setLoadoutDecision = (index: number, value: 'approved' | 'rejected') => {
    setLoadoutDecisions(prev => {
      const next = new Map(prev)
      const current = next.get(index)
      if (current === value) next.delete(index)
      else next.set(index, value)
      return next
    })
  }

  const allLoadoutDecided = loadoutData != null && loadoutData.options.length > 0 && loadoutDecisions.size === loadoutData.options.length

  const saveLoadout = async () => {
    if (!loadoutData || !allLoadoutDecided) return
    setSavingLoadout(true)
    try {
      const approvedOptions = loadoutData.options.filter((_, i) => loadoutDecisions.get(i) === 'approved')
      const confirmed: StructuredLoadoutData = {
        tag: 'CONFIRMED',
        options: approvedOptions,
      }
      await putLoadoutData(resolvedLoadoutFaction, unitSlug, confirmed)
      setLoadoutData(confirmed)
      const decisions = new Map<number, 'approved' | 'rejected'>()
      confirmed.options.forEach((_, i) => decisions.set(i, 'approved'))
      setLoadoutDecisions(decisions)
    } finally {
      setSavingLoadout(false)
    }
  }

  return (
    <section className="workspace">
      <TopBar name={unitName} onBack={onBack} tag={structuredAbilitiesData.tag} />

      {baseDataChanged && (
        <div className="basedata-changed-banner">
          El BaseData de esta unidad ha cambiado desde la última confirmación.
        </div>
      )}

      <div className="process-unit-actions">
        <button type="button" className="resync-btn" onClick={resync}>
          <RefreshCw size={14} /> Re-sincronizar desde BaseData
        </button>
        {baseDataChanged && (
          <button type="button" className="resync-btn" onClick={resyncNoChanges}>
            Re-sincronizar sin cambios
          </button>
        )}
      </div>

      <UnitDatasheet datasheet={datasheet} wargear={wargear} keywords={keywords} />

      <section className="process-unit-section">
        <h2>Abilidades revisadas ({draft.abilities.length})</h2>
        {draft.abilities.length === 0 && <p className="profile-meta">Ninguna todavía.</p>}
        <table className="reviewed-abilities-table">
          <colgroup>
            <col />
            <col style={{ width: 70 }} />
            <col style={{ width: 60 }} />
            <col style={{ width: 180 }} />
            <col style={{ width: 120 }} />
          </colgroup>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Fase</th>
              <th>Freq</th>
              <th>Trigger</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {draft.abilities.map((ability, index) => {
              if (editingAbilityIndex === index) {
                return (
                  <tr key={index}>
                    <td colSpan={5}>
                      {editingAbilityText && (
                        <div className="raw-ability-text">
                          <FormattedAbilityText text={editingAbilityText} />
                        </div>
                      )}
                      <StructuringForm
                        rows={structuringRows}
                        weaponNames={weaponNames}
                        onChangeRow={updateStructuringRow}
                        onAddRow={addStructuringRow}
                        onAddEffect={addEffectToRow}
                        onRemoveEffect={removeEffectFromRow}
                        onUpdateEffect={updateEffectInRow}
                        onCancel={cancelStructuring}
                        onCommit={commitEdit}
                        onMarkAsOther={markEditingAbilityAsOther}
                      />
                    </td>
                  </tr>
                )
              }
              if (editingOtherIndex === index) {
                return (
                  <tr key={index}>
                    <td colSpan={5}>
                      <div className="structuring-form">
                        <textarea
                          style={{ width: '100%', minHeight: 80, background: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 2, padding: 8, fontSize: 12, fontFamily: 'inherit', resize: 'vertical' }}
                          value={editingOtherText}
                          onChange={(e) => setEditingOtherText(e.target.value)}
                        />
                        <div className="structuring-form-actions">
                          <button type="button" onClick={structureFromOther}>Estructurar</button>
                          <button type="button" onClick={cancelEditingOther}>Cancelar</button>
                          <button type="button" className="confirm-btn" onClick={saveOther}>Guardar como OTHER</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              }
              const isStructured = 'effects' in ability
              const isOther = 'category' in ability && ability.category === 'OTHER'
              return (
                <Fragment key={index}>
                  <tr className="ability-main-row">
                    <td>{ability.name}</td>
                    {isStructured ? (
                      <>
                        <td>{PHASE_SHORT_LABELS[ability.phase] ?? ability.phase}</td>
                        <td>{ability.frequency && ability.frequency !== 'always' ? FREQUENCY_LABELS[ability.frequency] ?? ability.frequency : ''}</td>
                        <td className="trigger-cell">
                          {ability.trigger === 'ALWAYS'
                            ? (ability.autoApply ? 'auto' : 'siempre')
                            : ability.trigger}
                        </td>
                      </>
                    ) : (
                      <td colSpan={3}><span className="ability-type-tag">OTHER</span></td>
                    )}
                    <td className="actions-cell">
                      {isStructured && <button type="button" onClick={() => startEditing(index)}>Editar</button>}
                      {isOther && <button type="button" onClick={() => startEditingOther(index)}>Editar</button>}
                      <button type="button" onClick={() => removeReviewedAbility(index)}>Quitar</button>
                    </td>
                  </tr>
                  {(() => {
                    if (!isStructured) return null
                    const baseName = ability.name.replace(/\s+\(efecto \d+\)$/, '')
                    const text = ability.originalText
                      ?? baseDataAbilitiesMap[ability.name]
                      ?? baseDataAbilitiesMap[baseName]
                      ?? Object.entries(baseDataAbilitiesMap).find(([k]) => k.toLowerCase() === baseName.toLowerCase())?.[1]
                    if (!text) return null
                    return (
                      <tr className="original-text-subrow">
                        <td colSpan={5}>
                          <FormattedAbilityText text={text} />
                        </td>
                      </tr>
                    )
                  })()}
                  {isStructured && ability.effects.map((effect, ei) => (
                    <tr key={ei} className="effect-subrow">
                      <td colSpan={5}>
                        <span className="effect-category-label">{EFFECT_CATEGORY_LABELS[effect.category] ?? effect.category}</span>
                        {describeEffect(effect)}
                      </td>
                    </tr>
                  ))}
                  {isOther && (
                    <tr className="effect-subrow">
                      <td colSpan={5}>
                        <FormattedAbilityText text={ability.text} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </section>

      <section className="process-unit-section">
        <h2>Habilidades sin revisar ({draft.rawAbilities.length})</h2>
        <ul className="raw-ability-list">
          {draft.rawAbilities.map((raw, index) => (
            <li key={index} className="raw-ability-row">
              <div className="raw-ability-text">
                <strong>{raw.name}</strong> <span className="ability-type-tag">{raw.abilityType}</span>
                <FormattedAbilityText text={raw.text} />
              </div>
              {structuringIndex === index ? (
                <StructuringForm
                  rows={structuringRows}
                  weaponNames={weaponNames}
                  onChangeRow={updateStructuringRow}
                  onAddRow={addStructuringRow}
                  onAddEffect={addEffectToRow}
                  onRemoveEffect={removeEffectFromRow}
                  onUpdateEffect={updateEffectInRow}
                  onCancel={cancelStructuring}
                  onCommit={commitStructuring}
                />
              ) : (
                <div className="raw-ability-actions">
                  <button type="button" onClick={() => startStructuring(index)}>Estructurar</button>
                  <button type="button" onClick={() => markAsOther(index)}>Marcar como OTHER</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {loadoutData && loadoutData.options.length > 0 && (
        <LoadoutSection
          loadoutData={loadoutData}
          decisions={loadoutDecisions}
          onDecide={setLoadoutDecision}
          onSave={saveLoadout}
          saving={savingLoadout}
          allDecided={allLoadoutDecided}
        />
      )}

      {validationError && (
        <div className="board-alert">{validationError}</div>
      )}
      <div className="modal-actions">
        <button type="button" onClick={onBack}>Cancelar</button>
        <button type="button" className="confirm-btn" disabled={saving} onClick={save}>
          {saving ? 'Guardando…' : 'Guardar y confirmar'}
        </button>
      </div>
    </section>
  )
}

function formatScope(option: WargearOption): string {
  const { scope } = option
  if (scope.role) return scope.role
  switch (scope.type) {
    case 'model': return 'Modelo'
    case 'allModels': return 'Todos los modelos'
    case 'anyNumber': return 'Cualquier número'
    case 'ratio': return `${scope.ratio?.count ?? 1} por cada ${scope.ratio?.per ?? 5} modelos`
  }
}

function LoadoutSection({ loadoutData, decisions, onDecide, onSave, saving, allDecided }: {
  loadoutData: StructuredLoadoutData
  decisions: Map<number, 'approved' | 'rejected'>
  onDecide: (index: number, value: 'approved' | 'rejected') => void
  onSave: () => void
  saving: boolean
  allDecided: boolean
}) {
  return (
    <section className="reviewed-section" style={{ marginTop: '2rem' }}>
      <h2>Opciones de Loadout <span className={`status-light is-${loadoutData.tag === 'CONFIRMED' ? 'green' : 'red'}`} aria-hidden="true" /></h2>
      <ul className="raw-abilities-list">
        {loadoutData.options.map((option, index) => {
          const decision = decisions.get(index)
          return (
            <li key={index} className={`raw-ability-card ${decision === 'approved' ? 'is-approved' : decision === 'rejected' ? 'is-rejected' : ''}`}>
              <div className="raw-ability-text" style={{ whiteSpace: 'pre-wrap', fontStyle: 'italic', marginBottom: '0.5rem', opacity: 0.8 }}>
                {option.originalText}
              </div>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div><strong>Alcance:</strong> {formatScope(option)}</div>
                {option.isAdditional ? (
                  <div><strong>Equipar adicional</strong></div>
                ) : option.replaces.length > 0 && (
                  <div><strong>Reemplaza:</strong> {option.replaces.map(r => r.name).join(', ')}</div>
                )}
                <div><strong>Opciones:</strong></div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  {option.choices.map((choice, ci) => (
                    <li key={ci}>
                      {choice.items.map(it => `${it.count}× ${it.name}`).join(' + ')}
                      {choice.locks && choice.locks.length > 0 && ' 🔒'}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="raw-ability-actions" style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className={decision === 'approved' ? 'confirm-btn' : undefined}
                  onClick={() => onDecide(index, 'approved')}
                >
                  {decision === 'approved' ? '✓ Aprobada' : 'Aprobar'}
                </button>
                <button
                  type="button"
                  style={decision === 'rejected' ? { background: 'var(--rust)', color: 'var(--on-accent)', borderColor: 'var(--rust)' } : undefined}
                  onClick={() => onDecide(index, 'rejected')}
                >
                  {decision === 'rejected' ? '✗ Rechazada' : 'Rechazar'}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="modal-actions">
        <button type="button" className="confirm-btn" disabled={saving || !allDecided} onClick={onSave}>
          {saving ? 'Guardando…' : 'Guardar Loadout'}
        </button>
      </div>
    </section>
  )
}

function TopBar({ name, onBack, tag }: { name: string; onBack: () => void; tag?: StructuredAbilitiesData['tag'] }) {
  return (
    <div className="unit-board-topbar">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={14} /> Unidades
      </button>
      <h1>{name}</h1>
      {tag && <span className={`status-light is-${tag === 'CONFIRMED' ? 'green' : 'red'}`} aria-hidden="true" />}
    </div>
  )
}

type StructuringFormProps = {
  rows: StructuringRow[]
  weaponNames: WeaponNameEntry[]
  onChangeRow: (index: number, patch: Partial<StructuringRow>) => void
  onAddRow: () => void
  onAddEffect: (rowIndex: number) => void
  onRemoveEffect: (rowIndex: number, effectIndex: number) => void
  onUpdateEffect: (rowIndex: number, effectIndex: number, effect: Effect) => void
  onCancel: () => void
  onCommit: () => void
  onMarkAsOther?: () => void
}

function StructuringForm({ rows, weaponNames, onChangeRow, onAddRow, onAddEffect, onRemoveEffect, onUpdateEffect, onCancel, onCommit, onMarkAsOther }: StructuringFormProps) {
  return (
    <div className="structuring-form">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="structuring-row">
          <div className="structuring-row-name">
            <label>
              Nombre
              <input value={row.name} onChange={(e) => onChangeRow(rowIndex, { name: e.target.value })} />
            </label>
          </div>
          <div className="structuring-row-descriptors">
            <label>
              Fase
              <select value={row.phase} onChange={(e) => onChangeRow(rowIndex, { phase: e.target.value as Phase })}>
                <option value="ANY">Cualquiera</option>
                <option value="MOVEMENT">Movimiento</option>
                <option value="SHOOTING">Disparo</option>
                <option value="CHARGE">Carga</option>
                <option value="FIGHT">Combate</option>
                <option value="COMMAND">Mando</option>
              </select>
            </label>
            <label>
              Frecuencia
              <select value={row.frequency ?? 'always'} onChange={(e) => onChangeRow(rowIndex, { frequency: e.target.value === 'always' ? undefined : e.target.value as Frequency })}>
                <option value="always">Siempre</option>
                <option value="perPhase">1/fase</option>
                <option value="perRound">1/ronda</option>
                <option value="perBattle">1/partida</option>
              </select>
            </label>
            <div className="trigger-row">
              <span className="trigger-label">Trigger</span>
              <button
                type="button"
                className={`toggle-switch ${row.trigger !== 'ALWAYS' ? 'is-on' : ''}`}
                onClick={() => {
                  if (row.trigger === 'ALWAYS') {
                    onChangeRow(rowIndex, { trigger: '', autoApply: false })
                  } else {
                    onChangeRow(rowIndex, { trigger: 'ALWAYS', autoApply: true })
                  }
                }}
                aria-label="Toggle trigger"
              >
                <span className="toggle-knob" />
              </button>
              {row.trigger !== 'ALWAYS' && (
                <input
                  className="trigger-input"
                  value={row.trigger}
                  placeholder="Condición del trigger..."
                  onChange={(e) => onChangeRow(rowIndex, { trigger: e.target.value })}
                />
              )}
            </div>
            {row.effects.length >= 2 && (
              <label>
                Op. efectos
                <select
                  value={row.effectsOperator ?? 'AND'}
                  onChange={(e) => onChangeRow(rowIndex, { effectsOperator: e.target.value === 'AND' ? undefined : e.target.value as 'AND' | 'OR' })}
                >
                  <option value="AND">AND — Aplicar todos</option>
                  <option value="OR">OR — Según condición</option>
                </select>
              </label>
            )}
          </div>
          <div className="structuring-effects-list">
            {row.effects.map((effect, effectIndex) => (
              <div key={effectIndex} className="structuring-effect-row">
                <div className="effect-target-category-row">
                  {TARGET_SELECT(effect, (e) => onUpdateEffect(rowIndex, effectIndex, e))}
                  <label>
                    Categoría
                    <select
                      value={effect.category}
                      onChange={(e) => onUpdateEffect(rowIndex, effectIndex, { ...defaultEffectForCategory(e.target.value as Effect['category']), appliedTo: effect.appliedTo })}
                    >
                      <option value="statModifier">Stats</option>
                      <option value="diceModifier">Tirada</option>
                      <option value="weaponKeyword">Palabra Clave</option>
                      <option value="unitKeyword">Keyword Unidad</option>
                      <option value="damageMitigation">Mitigación Daño</option>
                      <option value="mortalWounds">Heridas Mortales</option>
                      <option value="heal">Curar</option>
                    </select>
                  </label>
                </div>
                <EffectFields effect={effect} weaponNames={weaponNames} onChange={(e) => onUpdateEffect(rowIndex, effectIndex, e)} />
                {row.effects.length > 1 && (
                  <button type="button" className="effect-remove-btn" onClick={() => onRemoveEffect(rowIndex, effectIndex)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="add-effect-btn" onClick={() => onAddEffect(rowIndex)}>+ Añadir efecto</button>
          </div>
        </div>
      ))}
      {rows.length >= 2 && (
        <div className="structuring-form-actions" style={{ justifyContent: 'flex-start', borderTop: 'none', paddingTop: 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            Operador
            <select
              value={rows[0]?.groupOperator ?? 'AND'}
              onChange={(e) => {
                const op = e.target.value as 'AND' | 'OR'
                if (op === 'AND') {
                  rows.forEach((_, i) => onChangeRow(i, { groupId: undefined, groupOperator: undefined }))
                } else {
                  const id = crypto.randomUUID()
                  rows.forEach((_, i) => onChangeRow(i, { groupId: id, groupOperator: 'OR' }))
                }
              }}
              style={{ height: 28, padding: '0 6px', fontSize: 12 }}
            >
              <option value="AND">AND — Aplicar todos</option>
              <option value="OR">OR — El jugador elige uno</option>
            </select>
          </label>
        </div>
      )}
      <div className="structuring-form-actions">
        <button type="button" onClick={onAddRow}>+ Añadir otra habilidad</button>
        {onMarkAsOther && (
          <button type="button" onClick={onMarkAsOther}>Marcar como OTHER</button>
        )}
        <button type="button" onClick={onCancel}>Cancelar</button>
        <button type="button" className="confirm-btn" onClick={onCommit}>Guardar habilidad estructurada</button>
      </div>
    </div>
  )
}

const TARGET_SELECT = (effect: Effect, onChange: (e: Effect) => void) => (
  <label>
    Target
    <select value={effect.appliedTo} onChange={(e) => onChange({ ...effect, appliedTo: e.target.value as AppliesTo })}>
      <option value="SelfModel">Modelo</option>
      <option value="SelfUnit">Unidad</option>
      <option value="Ally">Aliado</option>
      <option value="Enemy">Enemigo</option>
    </select>
  </label>
)

function WeaponSelect({ value, weaponNames, onChange }: { value: string; weaponNames: WeaponNameEntry[]; onChange: (v: string) => void }) {
  const ranged = weaponNames.filter((w) => w.type === 'ranged')
  const melee = weaponNames.filter((w) => w.type === 'melee')
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="ALL">Todas</option>
      <option value="RANGE">Distancia</option>
      <option value="MELEE">Cuerpo a Cuerpo</option>
      {ranged.length > 0 && (
        <optgroup label="Distancia">
          {ranged.map((w) => <option key={w.name} value={w.name}>{w.name}</option>)}
        </optgroup>
      )}
      {melee.length > 0 && (
        <optgroup label="Cuerpo a Cuerpo">
          {melee.map((w) => <option key={w.name} value={w.name}>{w.name}</option>)}
        </optgroup>
      )}
    </select>
  )
}

function EffectFields({ effect, weaponNames, onChange }: { effect: Effect; weaponNames: WeaponNameEntry[]; onChange: (e: Effect) => void }) {
  switch (effect.category) {
    case 'statModifier':
      return (
        <>
          {isWeaponStat(effect.stat) && (
            <label>
              Arma
              <WeaponSelect value={effect.weaponTarget ?? 'ALL'} weaponNames={weaponNames} onChange={(v) => onChange({ ...effect, weaponTarget: v as WeaponTarget })} />
            </label>
          )}
          <label>
            Stat
            <select value={effect.stat} onChange={(e) => onChange({ ...effect, stat: e.target.value as UnitStat | WeaponStat })}>
              <optgroup label="Unidad">
                <option value="Movement">Movement</option>
                <option value="Toughness">Toughness</option>
                <option value="Save">Save</option>
                <option value="Invulnerable">Invulnerable</option>
                <option value="Wounds">Wounds</option>
                <option value="ObjectiveControl">ObjectiveControl</option>
                <option value="Leadership">Leadership</option>
              </optgroup>
              <optgroup label="Arma">
                <option value="Strength">Strength</option>
                <option value="Damage">Damage</option>
                <option value="Range">Range</option>
                <option value="Attacks">Attacks</option>
                <option value="AP">AP</option>
                <option value="Skill">Skill</option>
              </optgroup>
            </select>
          </label>
          <label>
            Modo
            <select value={effect.mode} onChange={(e) => onChange({ ...effect, mode: e.target.value as StatModifierEffect['mode'] })}>
              <option value="add">Sumar</option>
              <option value="subtract">Restar</option>
              <option value="setValue">Fijar valor</option>
              <option value="halve">Dividir 2</option>
            </select>
          </label>
          {effect.mode !== 'halve' && (
            <label>
              Valor
              <input type="number" value={effect.value ?? ''} onChange={(e) => onChange({ ...effect, value: e.target.value ? Number(e.target.value) : undefined })} />
            </label>
          )}
          <TargetConditionFields condition={effect.targetCondition} onChange={(tc) => onChange({ ...effect, targetCondition: tc })} />
        </>
      )
    case 'diceModifier':
      return (
        <>
          <label>
            Tirada
            <select value={effect.roll} onChange={(e) => onChange({ ...effect, roll: e.target.value as DiceModifierEffect['roll'] })}>
              <option value="toHit">Impactar</option>
              <option value="toWound">Herir</option>
              <option value="savingThrow">Salvación</option>
              <option value="damage">Daño</option>
              <option value="hazard">Hazard</option>
              <option value="charge">Carga</option>
              <option value="battleshock">Battleshock</option>
            </select>
          </label>
          <label>
            Acción
            <select value={effect.action} onChange={(e) => onChange({ ...effect, action: e.target.value as DiceModifierEffect['action'] })}>
              <option value="rerollOnes">Reroll 1s</option>
              <option value="rerollFailed">Reroll fallos</option>
              <option value="rerollAll">Reroll todos</option>
              <option value="addToRoll">+1 a la tirada</option>
              <option value="subtractFromRoll">-1 a la tirada</option>
              <option value="autoSuccess">Éxito automático</option>
              <option value="ignoreModifiers">Ignorar modificadores</option>
            </select>
          </label>
          <label>
            Arma
            <WeaponSelect value={effect.attackType ?? 'ALL'} weaponNames={weaponNames} onChange={(v) => onChange({ ...effect, attackType: v as DiceModifierEffect['attackType'] })} />
          </label>
          <TargetConditionFields condition={effect.targetCondition} onChange={(tc) => onChange({ ...effect, targetCondition: tc })} />
        </>
      )
    case 'weaponKeyword':
      return (
        <>
          <label>
            Arma
            <WeaponSelect value={effect.weaponTarget} weaponNames={weaponNames} onChange={(v) => onChange({ ...effect, weaponTarget: v as WeaponTarget })} />
          </label>
          <label>
            Keyword
            <select value={effect.keyword} onChange={(e) => onChange({ ...effect, keyword: e.target.value as KnownAttribute })}>
              {KNOWN_WEAPON_KEYWORDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label>
            Valor (opc.)
            <input value={effect.value ?? ''} onChange={(e) => onChange({ ...effect, value: e.target.value || null } as WeaponKeywordEffect)} />
          </label>
          <TargetConditionFields condition={effect.targetCondition} onChange={(tc) => onChange({ ...effect, targetCondition: tc })} />
        </>
      )
    case 'unitKeyword':
      return (
        <>
          <label>
            Keyword
            <select value={effect.keyword} onChange={(e) => onChange({ ...effect, keyword: e.target.value as KnownUnitKeyword })}>
              {KNOWN_UNIT_KEYWORDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label>
            Valor (opc.)
            <input value={effect.value ?? ''} onChange={(e) => onChange({ ...effect, value: e.target.value || null } as UnitKeywordEffect)} />
          </label>
        </>
      )
    case 'damageMitigation':
      return (
        <>
          <label>
            Tipo
            <select value={effect.kind} onChange={(e) => onChange({ ...effect, kind: e.target.value as DamageMitigationEffect['kind'] })}>
              <option value="fnp">Feel No Pain</option>
              <option value="damageReduction">Reducción daño</option>
              <option value="damageHalved">Daño a la mitad</option>
              <option value="fightOnDeath">Pelear al morir</option>
            </select>
          </label>
          {(effect.kind === 'fnp' || effect.kind === 'damageReduction') && (
            <label>
              Valor
              <input type="number" value={effect.value ?? ''} onChange={(e) => onChange({ ...effect, value: e.target.value ? Number(e.target.value) : undefined })} />
            </label>
          )}
          {effect.kind === 'fnp' && (
            <label>
              Condición
              <select value={effect.condition ?? 'any'} onChange={(e) => onChange({ ...effect, condition: e.target.value as DamageMitigationEffect['condition'] })}>
                <option value="any">Cualquiera</option>
                <option value="vsMortalWounds">vs Heridas Mortales</option>
                <option value="vsPsychic">vs Ataques Psíquicos</option>
              </select>
            </label>
          )}
        </>
      )
    case 'mortalWounds': {
      return (
        <>
          <label>
            Tipo Unidad
            <select value={effect.unitType} onChange={(e) => onChange({ ...effect, unitType: e.target.value as MortalWoundsUnitType })}>
              <option value="ALL">Todas</option>
              <option value="VEHICLE">Vehicle</option>
              <option value="INFANTRY">Infantry</option>
              <option value="MONSTER">Monster</option>
              <option value="CHARACTER">Character</option>
              <option value="MOUNTED">Mounted</option>
              <option value="FLY">Fly</option>
              <option value="WALKER">Walker</option>
              <option value="TITANIC">Titanic</option>
            </select>
          </label>
          <fieldset>
            <legend>Impactos</legend>
            <MortalWoundsHitsFields hits={effect.hits} onChange={(hits) => onChange({ ...effect, hits })} />
          </fieldset>
          <fieldset>
            <legend>Resolución</legend>
            <MortalWoundsResolutionFields resolution={effect.resolution} onChange={(resolution) => onChange({ ...effect, resolution })} />
          </fieldset>
          <label>
            MW por éxito
            <DiceNotationInput value={effect.damagePerSuccess} onChange={(damagePerSuccess) => onChange({ ...effect, damagePerSuccess })} />
          </label>
        </>
      )
    }
    case 'heal':
      return (
        <label>
          Cantidad
          <DiceNotationInput
            value={effect.amount ?? '1'}
            onChange={v => onChange({ ...effect, amount: v })}
          />
        </label>
      )
  }
}

function DiceNotationInput({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: boolean }) {
  return (
    <input
      className={`dice-notation-input${error ? ' dice-notation-error' : ''}`}
      value={value}
      placeholder="ej: 3, D6, 2D3+1"
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function TargetConditionFields({ condition, onChange }: { condition: TargetCondition | undefined; onChange: (tc: TargetCondition | undefined) => void }) {
  const active = condition !== undefined
  return (
    <div className="target-condition-block">
      <label className="target-condition-toggle">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => {
            if (e.target.checked) {
              onChange({ keywords: [], mode: 'excludes' })
            } else {
              onChange(undefined)
            }
          }}
        />
        Condición objetivo
      </label>
      {active && condition && (
        <div className="target-condition-fields">
          <select
            value={condition.mode}
            onChange={(e) => onChange({ ...condition, mode: e.target.value as TargetCondition['mode'] })}
          >
            <option value="excludes">Excepto contra</option>
            <option value="includes">Solo contra</option>
          </select>
          <div className="target-condition-chips">
            {TARGET_CONDITION_KEYWORDS.map((kw) => {
              const selected = condition.keywords.includes(kw)
              return (
                <button
                  key={kw}
                  type="button"
                  className={`target-condition-chip${selected ? ' selected' : ''}`}
                  onClick={() => {
                    const next = selected
                      ? condition.keywords.filter((k: TargetConditionKeyword) => k !== kw)
                      : [...condition.keywords, kw]
                    onChange({ ...condition, keywords: next })
                  }}
                >
                  {kw}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function MortalWoundsHitsFields({ hits, onChange }: { hits: MortalWoundsHits; onChange: (h: MortalWoundsHits) => void }) {
  return (
    <>
      <label>
        Tipo
        <select value={hits.kind} onChange={(e) => {
          const kind = e.target.value as MortalWoundsHits['kind']
          if (kind === 'notation') onChange({ kind, value: '1' })
          else onChange({ kind, stat: 'models' })
        }}>
          <option value="notation">Notación</option>
          <option value="byStat">Por Stats</option>
        </select>
      </label>
      {hits.kind === 'notation' && (
        <label>
          Valor
          <DiceNotationInput value={hits.value} onChange={(value) => onChange({ ...hits, value })} />
        </label>
      )}
      {hits.kind === 'byStat' && (
        <label>
          Stat
          <select value={hits.stat} onChange={(e) => onChange({ ...hits, stat: e.target.value })}>
            <option value="models">Nº Modelos</option>
            <option value="Movement">Movement</option>
            <option value="Toughness">Toughness</option>
            <option value="Save">Save</option>
            <option value="Invulnerable">Invulnerable</option>
            <option value="Wounds">Wounds</option>
            <option value="ObjectiveControl">ObjectiveControl</option>
            <option value="Leadership">Leadership</option>
          </select>
        </label>
      )}
    </>
  )
}

function MortalWoundsResolutionFields({ resolution, onChange }: { resolution: MortalWoundsResolution; onChange: (r: MortalWoundsResolution) => void }) {
  return (
    <>
      <label>
        Tipo
        <select value={resolution.kind} onChange={(e) => {
          const kind = e.target.value as MortalWoundsResolution['kind']
          if (kind === 'always') onChange({ kind })
          else onChange({ kind, threshold: 4 })
        }}>
          <option value="always">Siempre</option>
          <option value="roll">Tirada</option>
        </select>
      </label>
      {resolution.kind === 'roll' && (
        <label>
          Umbral (N+) en 1D6
          <select value={resolution.threshold} onChange={(e) => onChange({ ...resolution, threshold: Number(e.target.value) })}>
            {[2, 3, 4, 5, 6].map((v) => <option key={v} value={v}>{v}+</option>)}
          </select>
        </label>
      )}
    </>
  )
}

