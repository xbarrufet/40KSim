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
  DiceThrow,
  RerollTarget,
  Rule,
  StructuredAbilitiesData,
  UnitStat,
  WargearEntry,
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
import { UnitDatasheet } from './UnitDatasheet'

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

function defaultRuleForType(type: Rule['type'], base: { trigger: string; appliedTo: Rule['appliedTo'] }): Rule {
  switch (type) {
    case 'unitStatsModifier':
      return { ...base, type, stat: 'ObjectiveControl', value: '' }
    case 'weaponStatsModifier':
      return { ...base, type, weaponTarget: 'ALL', stat: 'Strength', value: '' }
    case 'diceModifier':
      return { ...base, type, throw: 'Hit', modifier: { kind: 'adjust', value: '' } }
    case 'addAttribute':
      return { ...base, type, weaponTarget: 'ALL', attribute: KNOWN_WEAPON_KEYWORDS[0], value: null }
  }
}

function describeRule(rule: Rule): string {
  switch (rule.type) {
    case 'unitStatsModifier':
      return `${rule.trigger} · unitStatsModifier · ${rule.appliedTo} · ${rule.stat} (${rule.value})`
    case 'weaponStatsModifier':
      return `${rule.trigger} · weaponStatsModifier · ${rule.appliedTo} · ${rule.weaponTarget} ${rule.stat} (${rule.value})`
    case 'diceModifier': {
      const effect = rule.modifier.kind === 'adjust' ? rule.modifier.value : `reroll ${rule.modifier.reroll}`
      return `${rule.trigger} · diceModifier · ${rule.appliedTo} · ${rule.throw} (${effect})`
    }
    case 'addAttribute':
      return `${rule.trigger} · addAttribute · ${rule.appliedTo} · ${rule.weaponTarget} ${rule.attribute}${rule.value ? ` (${rule.value})` : ''}`
  }
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

  useEffect(() => {
    getStructuredAbilitiesData(faction.slug, unitSlug)
      .then((data) => {
        if (!data) {
          setError('Esta unidad no tiene datos todavía. Sube su BaseData primero.')
          return
        }
        setStructuredAbilitiesData(data)
        setDraft(toDraft(data))
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error al cargar la unidad')
      })

    getBaseData(faction.slug, unitSlug).then((baseData) => {
      if (!baseData) return
      const data = baseData as BaseData
      setUnitName(data.name)
      setDatasheet(extractDatasheetContext(data))
      setWargear(getUnitWargear(data))
      setKeywords(getUnitKeywords(data))
    })
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
      { name: raw.name, type: 'Always', rule: defaultRuleForType('unitStatsModifier', { trigger: 'ALWAYS', appliedTo: 'SelfModel' }) },
    ])
  }

  const cancelStructuring = () => {
    setStructuringIndex(null)
    setStructuringRows([])
  }

  const addStructuringRow = () => {
    if (structuringIndex === null) return
    const raw = draft.rawAbilities[structuringIndex]
    setStructuringRows((rows) => [
      ...rows,
      {
        name: `${raw.name} (effect ${rows.length + 1})`,
        type: 'Always',
        rule: defaultRuleForType('unitStatsModifier', { trigger: 'ALWAYS', appliedTo: 'SelfModel' }),
      },
    ])
  }

  const updateStructuringRow = (rowIndex: number, patch: Partial<{ name: string; type: AbilityContext; rule: Rule }>) => {
    setStructuringRows((rows) =>
      rows.map((row, i) => (i === rowIndex ? { ...row, ...patch, rule: patch.rule ?? row.rule } : row)),
    )
  }

  const commitStructuring = () => {
    if (structuringIndex === null) return
    const newAbilities = buildStructuredAbilities(structuringRows)
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

  const removeRawAbility = (index: number) => {
    setDraft((current) => {
      if (!current) return current
      return { ...current, rawAbilities: current.rawAbilities.filter((_, i) => i !== index) }
    })
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

  const updateReviewedAbilityType = (index: number, type: AbilityContext) => {
    setDraft((current) => {
      if (!current) return current
      return {
        ...current,
        abilities: current.abilities.map((ability, i) => (i === index ? { ...ability, type } : ability)),
      }
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

  const save = async () => {
    setSaving(true)
    try {
      const confirmed: StructuredAbilitiesData = {
        abilities: draft.abilities,
        rawAbilities: draft.rawAbilities,
        tag: 'CONFIRMED',
      }
      await putStructuredAbilitiesData(faction.slug, unitSlug, confirmed)
      setStructuredAbilitiesData(confirmed)
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="workspace">
      <TopBar name={unitName} onBack={onBack} tag={structuredAbilitiesData.tag} />

      <div className="process-unit-actions">
        <button type="button" className="resync-btn" onClick={resync}>
          <RefreshCw size={14} /> Re-sincronizar desde BaseData
        </button>
      </div>

      <UnitDatasheet datasheet={datasheet} wargear={wargear} keywords={keywords} />

      <section className="process-unit-section">
        <h2>Abilidades revisadas ({draft.abilities.length})</h2>
        {draft.abilities.length === 0 && <p className="profile-meta">Ninguna todavía.</p>}
        <ul className="ability-list">
          {draft.abilities.map((ability, index) => (
            <li key={index} className="ability-row">
              <div>
                <strong>{ability.name}</strong>{' '}
                {'rule' in ability ? (
                  <span className="ability-detail">{describeRule(ability.rule)}</span>
                ) : (
                  <span className="ability-detail">OTHER — {ability.text}</span>
                )}
              </div>
              <select
                value={ability.type}
                onChange={(e) => updateReviewedAbilityType(index, e.target.value as AbilityContext)}
              >
                <option value="Always">Always</option>
                <option value="Alone">Alone</option>
                <option value="AsLeader">AsLeader</option>
              </select>
              <button type="button" onClick={() => removeReviewedAbility(index)}>Quitar</button>
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
                <p>{raw.text}</p>
              </div>
              {structuringIndex === index ? (
                <StructuringForm
                  rows={structuringRows}
                  onChangeRow={updateStructuringRow}
                  onAddRow={addStructuringRow}
                  onCancel={cancelStructuring}
                  onCommit={commitStructuring}
                />
              ) : (
                <div className="raw-ability-actions">
                  <button type="button" onClick={() => startStructuring(index)}>Estructurar</button>
                  <button type="button" onClick={() => markAsOther(index)}>Marcar como OTHER</button>
                  <button type="button" onClick={() => removeRawAbility(index)}>Quitar</button>
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

function StructuringForm({
  rows,
  onChangeRow,
  onAddRow,
  onCancel,
  onCommit,
}: {
  rows: { name: string; type: AbilityContext; rule: Rule }[]
  onChangeRow: (index: number, patch: Partial<{ name: string; type: AbilityContext; rule: Rule }>) => void
  onAddRow: () => void
  onCancel: () => void
  onCommit: () => void
}) {
  return (
    <div className="structuring-form">
      {rows.map((row, index) => (
        <div key={index} className="structuring-row">
          <label>
            Nombre
            <input value={row.name} onChange={(e) => onChangeRow(index, { name: e.target.value })} />
          </label>
          <label>
            Contexto
            <select
              value={row.type}
              onChange={(e) => onChangeRow(index, { type: e.target.value as AbilityContext })}
            >
              <option value="Always">Always</option>
              <option value="Alone">Alone</option>
              <option value="AsLeader">AsLeader</option>
            </select>
          </label>
          <label>
            Trigger
            <input
              value={row.rule.trigger}
              onChange={(e) => onChangeRow(index, { rule: { ...row.rule, trigger: e.target.value } })}
            />
          </label>
          <label>
            Tipo de regla
            <select
              value={row.rule.type}
              onChange={(e) =>
                onChangeRow(index, {
                  rule: defaultRuleForType(e.target.value as Rule['type'], {
                    trigger: row.rule.trigger,
                    appliedTo: row.rule.appliedTo,
                  }),
                })
              }
            >
              <option value="unitStatsModifier">unitStatsModifier</option>
              <option value="weaponStatsModifier">weaponStatsModifier</option>
              <option value="diceModifier">diceModifier</option>
              <option value="addAttribute">addAttribute</option>
            </select>
          </label>
          <label>
            Aplica a
            <select
              value={row.rule.appliedTo}
              onChange={(e) =>
                onChangeRow(index, { rule: { ...row.rule, appliedTo: e.target.value as Rule['appliedTo'] } })
              }
            >
              <option value="SelfModel">SelfModel</option>
              <option value="SelfUnit">SelfUnit</option>
              <option value="Enemy">Enemy</option>
              <option value="Ally">Ally</option>
            </select>
          </label>
          <RuleTypeFields rule={row.rule} onChange={(rule) => onChangeRow(index, { rule })} />
        </div>
      ))}
      <div className="structuring-form-actions">
        <button type="button" onClick={onAddRow}>+ Añadir otro efecto</button>
        <button type="button" onClick={onCancel}>Cancelar</button>
        <button type="button" className="confirm-btn" onClick={onCommit}>Guardar habilidad estructurada</button>
      </div>
    </div>
  )
}

function RuleTypeFields({ rule, onChange }: { rule: Rule; onChange: (rule: Rule) => void }) {
  switch (rule.type) {
    case 'unitStatsModifier':
      return (
        <>
          <label>
            Stat
            <select value={rule.stat} onChange={(e) => onChange({ ...rule, stat: e.target.value as UnitStat })}>
              <option value="Movement">Movement</option>
              <option value="Toughness">Toughness</option>
              <option value="Save">Save</option>
              <option value="Invulnerable">Invulnerable</option>
              <option value="Wounds">Wounds</option>
              <option value="ObjectiveControl">ObjectiveControl</option>
              <option value="Leadership">Leadership</option>
            </select>
          </label>
          <label>
            Valor
            <input value={rule.value} onChange={(e) => onChange({ ...rule, value: e.target.value })} />
          </label>
        </>
      )
    case 'weaponStatsModifier':
      return (
        <>
          <label>
            Arma objetivo
            <select
              value={rule.weaponTarget}
              onChange={(e) => onChange({ ...rule, weaponTarget: e.target.value as WeaponTarget })}
            >
              <option value="ALL">ALL</option>
              <option value="RANGE">RANGE</option>
              <option value="MELEE">MELEE</option>
            </select>
          </label>
          <label>
            Stat
            <select value={rule.stat} onChange={(e) => onChange({ ...rule, stat: e.target.value as WeaponStat })}>
              <option value="Strength">Strength</option>
              <option value="Damage">Damage</option>
              <option value="Range">Range</option>
              <option value="Attacks">Attacks</option>
              <option value="AP">AP</option>
              <option value="Skill">Skill</option>
            </select>
          </label>
          <label>
            Valor
            <input value={rule.value} onChange={(e) => onChange({ ...rule, value: e.target.value })} />
          </label>
        </>
      )
    case 'diceModifier':
      return (
        <>
          <label>
            Tirada
            <select value={rule.throw} onChange={(e) => onChange({ ...rule, throw: e.target.value as DiceThrow })}>
              <option value="Hit">Hit</option>
              <option value="Wound">Wound</option>
              <option value="Save">Save</option>
              <option value="Damage">Damage</option>
              <option value="Battleshock">Battleshock</option>
            </select>
          </label>
          <label>
            Efecto
            <select
              value={rule.modifier.kind}
              onChange={(e) =>
                onChange({
                  ...rule,
                  modifier:
                    e.target.value === 'reroll' ? { kind: 'reroll', reroll: '1' } : { kind: 'adjust', value: '' },
                })
              }
            >
              <option value="adjust">Ajuste (+1/-1)</option>
              <option value="reroll">Reroll</option>
            </select>
          </label>
          {rule.modifier.kind === 'adjust' ? (
            <label>
              Valor
              <input
                value={rule.modifier.value}
                onChange={(e) => onChange({ ...rule, modifier: { kind: 'adjust', value: e.target.value } })}
              />
            </label>
          ) : (
            <label>
              Reroll
              <select
                value={rule.modifier.reroll}
                onChange={(e) =>
                  onChange({ ...rule, modifier: { kind: 'reroll', reroll: e.target.value as RerollTarget } })
                }
              >
                <option value="1">1s</option>
                <option value="ALL">ALL</option>
              </select>
            </label>
          )}
        </>
      )
    case 'addAttribute':
      return (
        <>
          <label>
            Arma objetivo
            <select
              value={rule.weaponTarget}
              onChange={(e) => onChange({ ...rule, weaponTarget: e.target.value as WeaponTarget })}
            >
              <option value="ALL">ALL</option>
              <option value="RANGE">RANGE</option>
              <option value="MELEE">MELEE</option>
            </select>
          </label>
          <label>
            Atributo
            <select
              value={rule.attribute}
              onChange={(e) => onChange({ ...rule, attribute: e.target.value as KnownAttribute })}
            >
              {KNOWN_WEAPON_KEYWORDS.map((keyword) => (
                <option key={keyword} value={keyword}>{keyword}</option>
              ))}
            </select>
          </label>
          <label>
            Valor (opcional)
            <input
              value={rule.value ?? ''}
              onChange={(e) => onChange({ ...rule, value: e.target.value || null })}
            />
          </label>
        </>
      )
  }
}
