import type { RawAbility } from '../data/schema'
import type { WeaponNameEntry } from '../data/preprocessBaseData'
import type { StructuringRow } from './processUnitLogic'
import { FormattedAbilityText } from './FormattedAbilityText'
import { StructuringForm } from './StructuringForm'
import styles from './RawAbilitiesList.module.css'

export interface RawAbilitiesListProps {
  rawAbilities: RawAbility[]
  structuringIndex: number | null
  structuringRows: StructuringRow[]
  weaponNames: WeaponNameEntry[]
  updateStructuringRow: (index: number, patch: Partial<StructuringRow>) => void
  addStructuringRow: () => void
  addEffectToRow: (rowIndex: number) => void
  removeEffectFromRow: (rowIndex: number, effectIndex: number) => void
  updateEffectInRow: (rowIndex: number, effectIndex: number, effect: import('../data/schema').Effect) => void
  cancelStructuring: () => void
  commitStructuring: () => void
  startStructuring: (index: number) => void
  markAsOther: (index: number) => void
}

export function RawAbilitiesList({
  rawAbilities,
  structuringIndex,
  structuringRows,
  weaponNames,
  updateStructuringRow,
  addStructuringRow,
  addEffectToRow,
  removeEffectFromRow,
  updateEffectInRow,
  cancelStructuring,
  commitStructuring,
  startStructuring,
  markAsOther,
}: RawAbilitiesListProps) {
  return (
    <section className="process-unit-section">
      <h2>Habilidades sin revisar ({rawAbilities.length})</h2>
      <ul className={styles.list}>
        {rawAbilities.map((raw, index) => (
          <li key={index} className={styles.row}>
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
              <div className={styles.actions}>
                <button type="button" onClick={() => startStructuring(index)}>Estructurar</button>
                <button type="button" onClick={() => markAsOther(index)}>Marcar como OTHER</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
