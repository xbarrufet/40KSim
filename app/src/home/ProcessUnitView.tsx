import { useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { getBaseData, getStructuredAbilitiesData, putStructuredAbilitiesData } from '../data/db'
import {
  extractDatasheetContext,
  getUnitKeywords,
  getUnitWargear,
  toRawAbilities,
  type BaseData,
  type DatasheetContext,
} from '../data/preprocessBaseData'
import type {
  AbilityContext,
  AppliesTo,
  AttackType,
  DamageMitigationEffect,
  DiceModifierEffect,
  Effect,
  MortalWoundsAmount,
  MortalWoundsAmountByKeyword,
  MortalWoundsEffect,
  OtherAbility,
  StatModifierEffect,
  StructuredAbilitiesData,
  UnitStat,
  WargearEntry,
  WeaponKeywordEffect,
  WeaponStat,
  WeaponTarget,
} from '../data/schema'
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
      return { category, appliedTo: 'Enemy', gameEvent: 'onCharge', targetScope: 'engagedUnit', amount: { kind: 'fixed', value: 1 } }
  }
}

function describeAmount(amount: MortalWoundsAmount): string {
  switch (amount.kind) {
    case 'fixed': return `${amount.value}MW`
    case 'roll': return `${amount.count && amount.count > 1 ? amount.count : ''}${amount.dice}${amount.modifier ? `+${amount.modifier}` : ''}MW`
    case 'perModelRoll': return `perModel(${amount.threshold}+→${amount.onSuccess}MW)`
    case 'multiDiceCount': return `${amount.diceCount}d(${amount.threshold}+→${amount.onSuccess}MW)`
  }
}

function describeEffect(effect: Effect): string {
  switch (effect.category) {
    case 'statModifier':
      return `${effect.mode} ${effect.stat}${effect.value !== undefined ? ` ${effect.value}` : ''}`
    case 'diceModifier':
      return `${effect.action} ${effect.roll}`
    case 'weaponKeyword':
      return `${effect.keyword}${effect.value ? ` ${effect.value}` : ''} (${effect.weaponTarget})`
    case 'damageMitigation':
      return `${effect.kind}${effect.value !== undefined ? ` ${effect.value}` : ''}${effect.condition ? ` vs ${effect.condition}` : ''}`
    case 'mortalWounds': {
      const amountStr = describeAmount(effect.amount)
      const kwStr = effect.amountByKeyword && effect.amountByKeyword.length > 0
        ? ` (+${effect.amountByKeyword.length} override${effect.amountByKeyword.length > 1 ? 's' : ''})`
        : ''
      return `MW ${effect.gameEvent} ${effect.targetScope} ${amountStr}${kwStr}`
    }
  }
}

function describeAbility(ability: { trigger: string; autoApply?: boolean; attackType: string; effects: Effect[] }): string {
  const triggerPart = ability.trigger === 'ALWAYS'
    ? ''
    : ability.autoApply
      ? ' [AUTO]'
      : ` [${ability.trigger}]`
  return `${ability.attackType}${triggerPart} · ${ability.effects.map(describeEffect).join(', ')}`
}

export function ProcessUnitView({ faction, unitSlug, onBack, onSaved }: ProcessUnitViewProps) {
  const [structuredAbilitiesData, setStructuredAbilitiesData] = useState<StructuredAbilitiesData | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [unitName, setUnitName] = useState(unitSlug)
  const [datasheet, setDatasheet] = useState<DatasheetContext | null>(null)
  const [wargear, setWargear] = useState<WargearEntry[]>([])
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [structuredData, baseDataRaw] = await Promise.all([
          getStructuredAbilitiesData(faction.slug, unitSlug),
          getBaseData(faction.slug, unitSlug),
        ])
        if (!structuredData) {
          setError('Esta unidad no tiene datos todavía. Sube su BaseData primero.')
          return
        }
        setStructuredAbilitiesData(structuredData)
        setDraft(toDraft(structuredData))
        if (baseDataRaw) {
          const data = baseDataRaw as BaseData
          setUnitName(data.name)
          setDatasheet(extractDatasheetContext(data))
          setWargear(getUnitWargear(data))
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
      { name: raw.name, type: 'Always', attackType: 'ANY', trigger: 'ALWAYS', effects: [defaultEffectForCategory('statModifier')] },
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
    setStructuringRows([{ name: ability.name, type: ability.type, attackType: 'ANY', trigger: 'ALWAYS', effects: [defaultEffectForCategory('statModifier')] }])
    cancelEditingOther()
  }

  const startEditing = (index: number) => {
    const ability = draft.abilities[index]
    if (!('effects' in ability)) return
    setEditingAbilityIndex(index)
    const baseName = ability.name.replace(/\s+\(efecto \d+\)$/, '')
    setEditingAbilityText(
      ability.originalText ??
      baseDataAbilitiesMap[ability.name] ??
      baseDataAbilitiesMap[baseName] ??
      (draft.rawAbilities.find((r) => r.name === baseName || r.name === ability.name)?.text ?? null)
    )
    setStructuringRows([{ name: ability.name, type: ability.type, attackType: ability.attackType, trigger: ability.trigger, autoApply: ability.autoApply, groupId: ability.groupId, groupOperator: ability.groupOperator, effects: [...ability.effects] }])
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
      type: ability.type,
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
      { name: `${baseName} (efecto ${rows.length + 1})`, type: 'Always', attackType: 'ANY', trigger: 'ALWAYS', effects: [defaultEffectForCategory('statModifier')] },
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
      rows.map((row, i) => i === rowIndex ? { ...row, effects: row.effects.filter((_, ei) => ei !== effectIndex) } : row)
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
    setWargear(getUnitWargear(data))
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

  const save = async () => {
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
      await putStructuredAbilitiesData(faction.slug, unitSlug, confirmed)
      setStructuredAbilitiesData(confirmed)
      setBaseDataChanged(false)
      onSaved()
    } finally {
      setSaving(false)
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
        <ul className="ability-list">
          {draft.abilities.map((ability, index) => (
            <li key={index} className="ability-row">
              {editingAbilityIndex === index ? (
                <>
                  {editingAbilityText && (
                    <div className="raw-ability-text">
                      <FormattedAbilityText text={editingAbilityText} />
                    </div>
                  )}
                  <StructuringForm
                    rows={structuringRows}
                    onChangeRow={updateStructuringRow}
                    onAddRow={addStructuringRow}
                    onAddEffect={addEffectToRow}
                    onRemoveEffect={removeEffectFromRow}
                    onUpdateEffect={updateEffectInRow}
                    onCancel={cancelStructuring}
                    onCommit={commitEdit}
                    onMarkAsOther={markEditingAbilityAsOther}
                  />
                </>
              ) : editingOtherIndex === index ? (
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
              ) : (
                <>
                  <div>
                    <strong>{ability.name}</strong>{' '}
                    {'effects' in ability ? (
                      <span className="ability-detail">{describeAbility(ability)}</span>
                    ) : (
                      <div className="ability-detail">OTHER — <FormattedAbilityText text={ability.text} /></div>
                    )}
                    {'originalText' in ability && ability.originalText && (
                      <div className="raw-ability-text">
                        <FormattedAbilityText text={ability.originalText} />
                      </div>
                    )}
                  </div>
                  {'effects' in ability && (
                    <button type="button" onClick={() => startEditing(index)}>Editar</button>
                  )}
                  {'category' in ability && ability.category === 'OTHER' && (
                    <button type="button" onClick={() => startEditingOther(index)}>Editar</button>
                  )}
                  <button type="button" onClick={() => removeReviewedAbility(index)}>Quitar</button>
                </>
              )}
            </li>
          ))}
        </ul>
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

      <div className="modal-actions">
        <button type="button" onClick={onBack}>Cancelar</button>
        <button type="button" className="confirm-btn" disabled={saving} onClick={save}>
          {saving ? 'Guardando…' : 'Guardar y confirmar'}
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
  onChangeRow: (index: number, patch: Partial<StructuringRow>) => void
  onAddRow: () => void
  onAddEffect: (rowIndex: number) => void
  onRemoveEffect: (rowIndex: number, effectIndex: number) => void
  onUpdateEffect: (rowIndex: number, effectIndex: number, effect: Effect) => void
  onCancel: () => void
  onCommit: () => void
  onMarkAsOther?: () => void
}

function StructuringForm({ rows, onChangeRow, onAddRow, onAddEffect, onRemoveEffect, onUpdateEffect, onCancel, onCommit, onMarkAsOther }: StructuringFormProps) {
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
              Contexto
              <select value={row.type} onChange={(e) => onChangeRow(rowIndex, { type: e.target.value as AbilityContext })}>
                <option value="Always">Siempre</option>
                <option value="AsLeader">Como Líder</option>
                <option value="Alone">Como Lone Operative</option>
              </select>
            </label>
            <label>
              Fase
              <select value={row.attackType} onChange={(e) => onChangeRow(rowIndex, { attackType: e.target.value as AttackType })}>
                <option value="ANY">Cualquiera</option>
                <option value="SHOOTING">Disparo</option>
                <option value="FIGHT">Combate</option>
              </select>
            </label>
            <label>
              Trigger
              <input
                value={row.trigger}
                disabled={!!row.autoApply}
                onChange={(e) => onChangeRow(rowIndex, { trigger: e.target.value })}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={!!row.autoApply}
                onChange={() => onChangeRow(rowIndex, { autoApply: !row.autoApply })}
              />
              {' '}Aplicar siempre (sin preguntar)
            </label>
          </div>
          <div className="structuring-effects-list">
            {row.effects.map((effect, effectIndex) => (
              <div key={effectIndex} className="structuring-effect-row">
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
                    <option value="damageMitigation">Mitigación Daño</option>
                    <option value="mortalWounds">Heridas Mortales</option>
                  </select>
                </label>
                <EffectFields effect={effect} onChange={(e) => onUpdateEffect(rowIndex, effectIndex, e)} />
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

function EffectFields({ effect, onChange }: { effect: Effect; onChange: (e: Effect) => void }) {
  switch (effect.category) {
    case 'statModifier':
      return (
        <>
          {isWeaponStat(effect.stat) && (
            <label>
              Arma
              <select value={effect.weaponTarget ?? 'ALL'} onChange={(e) => onChange({ ...effect, weaponTarget: e.target.value as WeaponTarget })}>
                <option value="ALL">Todas</option>
                <option value="RANGE">Distancia</option>
                <option value="MELEE">Cuerpo a Cuerpo</option>
              </select>
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
            <select value={effect.attackType ?? 'ALL'} onChange={(e) => onChange({ ...effect, attackType: e.target.value as DiceModifierEffect['attackType'] })}>
              <option value="ALL">Todas</option>
              <option value="RANGE">Distancia</option>
              <option value="MELEE">Cuerpo a Cuerpo</option>
            </select>
          </label>
        </>
      )
    case 'weaponKeyword':
      return (
        <>
          <label>
            Arma
            <select value={effect.weaponTarget} onChange={(e) => onChange({ ...effect, weaponTarget: e.target.value as WeaponTarget })}>
              <option value="ALL">Todas</option>
              <option value="RANGE">Distancia</option>
              <option value="MELEE">Cuerpo a Cuerpo</option>
            </select>
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
    case 'mortalWounds':
      return (
        <>
          <label>
            Evento
            <select value={effect.gameEvent} onChange={(e) => onChange({ ...effect, gameEvent: e.target.value as MortalWoundsEffect['gameEvent'] })}>
              <option value="onCharge">Al cargar</option>
              <option value="activeAbility">Habilidad activa</option>
            </select>
          </label>
          <label>
            Objetivo
            <select value={effect.targetScope} onChange={(e) => onChange({ ...effect, targetScope: e.target.value as MortalWoundsEffect['targetScope'], range: undefined })}>
              <option value="engagedUnit">Unidad trabada</option>
              <option value="selectedEnemyUnit">Unidad enemiga seleccionada</option>
            </select>
          </label>
          {effect.targetScope === 'selectedEnemyUnit' && (
            <label>
              Rango (cm)
              <input type="number" value={effect.range ?? ''} onChange={(e) => onChange({ ...effect, range: e.target.value ? Number(e.target.value) : undefined })} />
            </label>
          )}
          <label>
            Pre-tirada
            <input type="checkbox" checked={!!effect.preRoll} onChange={(e) => onChange({ ...effect, preRoll: e.target.checked ? { dice: 'D6', threshold: 2 } : undefined })} />
          </label>
          {effect.preRoll && (
            <>
              <label>
                Dado
                <select value={effect.preRoll.dice} onChange={(e) => onChange({ ...effect, preRoll: { ...effect.preRoll!, dice: e.target.value as 'D6' | 'D3' } })}>
                  <option value="D6">D6</option>
                  <option value="D3">D3</option>
                </select>
              </label>
              <label>
                Umbral (N+)
                <input type="number" min={2} max={6} value={effect.preRoll.threshold} onChange={(e) => onChange({ ...effect, preRoll: { ...effect.preRoll!, threshold: Number(e.target.value) } })} />
              </label>
            </>
          )}
          <fieldset>
            <legend>Cantidad base</legend>
            <MortalWoundsAmountFields
              amount={effect.amount}
              onChange={(amount) => onChange({ ...effect, amount })}
            />
          </fieldset>
          <fieldset>
            <legend>Modificadores por keyword</legend>
            {(effect.amountByKeyword ?? []).map((entry, i) => (
              <div key={i} className="mw-keyword-entry">
                <label>
                  Keyword
                  <input value={entry.targetKeyword} onChange={(e) => {
                    const updated = [...(effect.amountByKeyword ?? [])]
                    updated[i] = { ...entry, targetKeyword: e.target.value }
                    onChange({ ...effect, amountByKeyword: updated })
                  }} />
                </label>
                <MortalWoundsAmountFields
                  amount={entry.amount}
                  onChange={(amount) => {
                    const updated = [...(effect.amountByKeyword ?? [])]
                    updated[i] = { ...entry, amount }
                    onChange({ ...effect, amountByKeyword: updated })
                  }}
                />
                <button type="button" onClick={() => {
                  const updated = (effect.amountByKeyword ?? []).filter((_, j) => j !== i)
                  onChange({ ...effect, amountByKeyword: updated.length ? updated : undefined })
                }}>Quitar</button>
              </div>
            ))}
            <button type="button" onClick={() => {
              const newEntry: MortalWoundsAmountByKeyword = { targetKeyword: '', amount: { kind: 'fixed', value: 1 } }
              onChange({ ...effect, amountByKeyword: [...(effect.amountByKeyword ?? []), newEntry] })
            }}>+ Añadir override</button>
          </fieldset>
        </>
      )
  }
}

function MortalWoundsAmountFields({ amount, onChange }: { amount: MortalWoundsAmount; onChange: (a: MortalWoundsAmount) => void }) {
  return (
    <>
      <label>
        Estrategia
        <select value={amount.kind} onChange={(e) => {
          const kind = e.target.value as MortalWoundsAmount['kind']
          if (kind === 'fixed') onChange({ kind, value: 1 })
          else if (kind === 'roll') onChange({ kind, dice: 'D6' })
          else if (kind === 'perModelRoll') onChange({ kind, threshold: 4, onSuccess: 1 })
          else onChange({ kind, diceCount: 6, threshold: 4, onSuccess: 1 })
        }}>
          <option value="fixed">Fijo</option>
          <option value="roll">Tirada de dado</option>
          <option value="perModelRoll">Por modelo</option>
          <option value="multiDiceCount">Múltiples dados</option>
        </select>
      </label>
      {amount.kind === 'fixed' && (
        <label>
          Heridas
          <input type="number" min={1} value={amount.value} onChange={(e) => onChange({ ...amount, value: Number(e.target.value) })} />
        </label>
      )}
      {amount.kind === 'roll' && (
        <>
          <label>
            Dado
            <select value={amount.dice} onChange={(e) => onChange({ ...amount, dice: e.target.value as 'D3' | 'D6' })}>
              <option value="D3">D3</option>
              <option value="D6">D6</option>
            </select>
          </label>
          <label>
            Cantidad (opc.)
            <input type="number" min={1} value={amount.count ?? 1} onChange={(e) => onChange({ ...amount, count: Number(e.target.value) || undefined })} />
          </label>
          <label>
            Modificador (opc.)
            <input type="number" value={amount.modifier ?? 0} onChange={(e) => onChange({ ...amount, modifier: Number(e.target.value) || undefined })} />
          </label>
        </>
      )}
      {amount.kind === 'perModelRoll' && (
        <>
          <label>
            Umbral (N+)
            <input type="number" min={2} max={6} value={amount.threshold} onChange={(e) => onChange({ ...amount, threshold: Number(e.target.value) })} />
          </label>
          <label>
            HM por éxito
            <input type="number" min={1} value={amount.onSuccess} onChange={(e) => onChange({ ...amount, onSuccess: Number(e.target.value) })} />
          </label>
        </>
      )}
      {amount.kind === 'multiDiceCount' && (
        <>
          <label>
            Nº dados
            <input type="number" min={1} value={amount.diceCount} onChange={(e) => onChange({ ...amount, diceCount: Number(e.target.value) })} />
          </label>
          <label>
            Umbral (N+)
            <input type="number" min={2} max={6} value={amount.threshold} onChange={(e) => onChange({ ...amount, threshold: Number(e.target.value) })} />
          </label>
          <label>
            HM por éxito
            <input type="number" min={1} value={amount.onSuccess} onChange={(e) => onChange({ ...amount, onSuccess: Number(e.target.value) })} />
          </label>
        </>
      )}
    </>
  )
}

