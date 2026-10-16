import type { Effect, Frequency, Phase } from '../data/schema'
import type { WeaponNameEntry } from '../data/preprocessBaseData'
import type { StructuringRow } from './processUnitLogic'
import { AppliedToSelect, CategorySelect, EffectFields, defaultEffectForCategory } from './EffectEditor'
import styles from './StructuringForm.module.css'

export type StructuringFormProps = {
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

export function StructuringForm({ rows, weaponNames, onChangeRow, onAddRow, onAddEffect, onRemoveEffect, onUpdateEffect, onCancel, onCommit, onMarkAsOther }: StructuringFormProps) {
  return (
    <div className={styles.form}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.row}>
          <div className={styles.rowName}>
            <label>
              Nombre
              <input value={row.name} onChange={(e) => onChangeRow(rowIndex, { name: e.target.value })} />
            </label>
          </div>
          <div className={styles.rowDescriptors}>
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
            <div className={styles.triggerRow}>
              <span className={styles.triggerLabel}>Trigger</span>
              <button
                type="button"
                className={`${styles.toggleSwitch} ${row.trigger !== 'ALWAYS' ? styles.toggleSwitchOn : ''}`}
                onClick={() => {
                  if (row.trigger === 'ALWAYS') {
                    onChangeRow(rowIndex, { trigger: '', autoApply: false })
                  } else {
                    onChangeRow(rowIndex, { trigger: 'ALWAYS', autoApply: true })
                  }
                }}
                aria-label="Toggle trigger"
              >
                <span className={styles.toggleKnob} />
              </button>
              {row.trigger !== 'ALWAYS' && (
                <input
                  className={styles.triggerInput}
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
          <div className={styles.effectsList}>
            {row.effects.map((effect, effectIndex) => (
              <div key={effectIndex} className={styles.effectRow}>
                <div className={styles.targetCategoryRow}>
                  <AppliedToSelect value={effect.appliedTo} onChange={(v) => onUpdateEffect(rowIndex, effectIndex, { ...effect, appliedTo: v })} />
                  <CategorySelect value={effect.category} onChange={(cat) => onUpdateEffect(rowIndex, effectIndex, { ...defaultEffectForCategory(cat), appliedTo: effect.appliedTo })} />
                </div>
                <EffectFields effect={effect} weaponNames={weaponNames} onChange={(e) => onUpdateEffect(rowIndex, effectIndex, e)} />
                {row.effects.length > 1 && (
                  <button type="button" className={styles.removeBtn} onClick={() => onRemoveEffect(rowIndex, effectIndex)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className={styles.addBtn} onClick={() => onAddEffect(rowIndex)}>+ Añadir efecto</button>
          </div>
        </div>
      ))}
      {rows.length >= 2 && (
        <div className={styles.formActionsInline}>
          <label className={styles.operatorLabel}>
            Operador
            <select
              className={styles.operatorSelect}
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
            >
              <option value="AND">AND — Aplicar todos</option>
              <option value="OR">OR — El jugador elige uno</option>
            </select>
          </label>
        </div>
      )}
      <div className={styles.formActions}>
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
