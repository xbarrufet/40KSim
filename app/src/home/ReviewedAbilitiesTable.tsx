import { Fragment } from 'react'
import type { UnitDataAbility } from '../data/schema'
import type { WeaponNameEntry } from '../data/preprocessBaseData'
import { describeEffect, EFFECT_CATEGORY_SHORT_LABELS, FREQUENCY_LABELS, PHASE_SHORT_LABELS } from './processUnitLogic'
import { FormattedAbilityText } from './FormattedAbilityText'
import { StructuringForm } from './StructuringForm'
import { OtherAbilityEditor } from './OtherAbilityEditor'
import type { StructuringRow } from './processUnitLogic'
import styles from './ReviewedAbilitiesTable.module.css'

export interface ReviewedAbilitiesTableProps {
  abilities: UnitDataAbility[]
  editingAbilityIndex: number | null
  editingAbilityText: string | null
  editingOtherIndex: number | null
  editingOtherText: string
  setEditingOtherText: (text: string) => void
  structuringRows: StructuringRow[]
  weaponNames: WeaponNameEntry[]
  baseDataAbilitiesMap: Record<string, string>
  updateStructuringRow: (index: number, patch: Partial<StructuringRow>) => void
  addStructuringRow: () => void
  addEffectToRow: (rowIndex: number) => void
  removeEffectFromRow: (rowIndex: number, effectIndex: number) => void
  updateEffectInRow: (rowIndex: number, effectIndex: number, effect: import('../data/schema').Effect) => void
  cancelStructuring: () => void
  commitEdit: () => void
  markEditingAbilityAsOther: () => void
  startEditing: (index: number) => void
  startEditingOther: (index: number) => void
  removeReviewedAbility: (index: number) => void
  structureFromOther: () => void
  cancelEditingOther: () => void
  saveOther: () => void
}

export function ReviewedAbilitiesTable({
  abilities,
  editingAbilityIndex,
  editingAbilityText,
  editingOtherIndex,
  editingOtherText,
  setEditingOtherText,
  structuringRows,
  weaponNames,
  baseDataAbilitiesMap,
  updateStructuringRow,
  addStructuringRow,
  addEffectToRow,
  removeEffectFromRow,
  updateEffectInRow,
  cancelStructuring,
  commitEdit,
  markEditingAbilityAsOther,
  startEditing,
  startEditingOther,
  removeReviewedAbility,
  structureFromOther,
  cancelEditingOther,
  saveOther,
}: ReviewedAbilitiesTableProps) {
  return (
    <section className="process-unit-section">
      <h2>Abilidades revisadas ({abilities.length})</h2>
      {abilities.length === 0 && <p className="profile-meta">Ninguna todavía.</p>}
      <table className={styles.table}>
        <colgroup>
          <col />
          <col className={styles.colPhase} />
          <col className={styles.colFreq} />
          <col className={styles.colTrigger} />
          <col className={styles.colActions} />
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
          {abilities.map((ability, index) => {
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
                    <OtherAbilityEditor
                      editingOtherText={editingOtherText}
                      setEditingOtherText={setEditingOtherText}
                      onStructure={structureFromOther}
                      onCancel={cancelEditingOther}
                      onSave={saveOther}
                    />
                  </td>
                </tr>
              )
            }
            const isStructured = 'effects' in ability
            const isOther = 'category' in ability && ability.category === 'OTHER'
            return (
              <Fragment key={index}>
                <tr className={styles.abilityMainRow}>
                  <td>{ability.name}</td>
                  {isStructured ? (
                    <>
                      <td>{PHASE_SHORT_LABELS[ability.phase] ?? ability.phase}</td>
                      <td>{ability.frequency && ability.frequency !== 'always' ? FREQUENCY_LABELS[ability.frequency] ?? ability.frequency : ''}</td>
                      <td className={styles.triggerCell}>
                        {ability.trigger === 'ALWAYS'
                          ? (ability.autoApply ? 'auto' : 'siempre')
                          : ability.trigger}
                      </td>
                    </>
                  ) : (
                    <td colSpan={3}><span className="ability-type-tag">OTHER</span></td>
                  )}
                  <td className={styles.actionsCell}>
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
                    <tr className={styles.originalTextSubrow}>
                      <td colSpan={5}>
                        <FormattedAbilityText text={text} />
                      </td>
                    </tr>
                  )
                })()}
                {isStructured && ability.effects.map((effect, ei) => (
                  <tr key={ei} className={styles.effectSubrow}>
                    <td colSpan={5}>
                      <span className="effect-category-label">{EFFECT_CATEGORY_SHORT_LABELS[effect.category] ?? effect.category}</span>
                      {describeEffect(effect)}
                    </td>
                  </tr>
                ))}
                {isOther && (
                  <tr className={styles.effectSubrow}>
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
  )
}
