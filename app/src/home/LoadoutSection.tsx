import type { StructuredLoadoutData } from '../data/schema'
import { formatScope } from './processUnitLogic'
import styles from './LoadoutSection.module.css'

export function LoadoutSection({ loadoutData, decisions, onDecide, onSave, saving, allDecided }: {
  loadoutData: StructuredLoadoutData
  decisions: Map<number, 'approved' | 'rejected'>
  onDecide: (index: number, value: 'approved' | 'rejected') => void
  onSave: () => void
  saving: boolean
  allDecided: boolean
}) {
  return (
    <section className={styles.section}>
      <h2>Opciones de Loadout <span className={`status-light is-${loadoutData.tag === 'CONFIRMED' ? 'green' : 'red'}`} aria-hidden="true" /></h2>
      <ul className={styles.list}>
        {loadoutData.options.map((option, index) => {
          const decision = decisions.get(index)
          return (
            <li key={index} className={styles.card}>
              <div className={`raw-ability-text ${styles.originalText}`}>
                {option.originalText}
              </div>
              <div className={styles.details}>
                <div><strong>Alcance:</strong> {formatScope(option)}</div>
                {option.isAdditional ? (
                  <div><strong>Equipar adicional</strong></div>
                ) : option.replaces.length > 0 && (
                  <div><strong>Reemplaza:</strong> {option.replaces.map(r => r.name).join(', ')}</div>
                )}
                <div><strong>Opciones:</strong></div>
                <ul className={styles.choicesList}>
                  {option.choices.map((choice, ci) => (
                    <li key={ci}>
                      {choice.items.map(it => `${it.count}× ${it.name}`).join(' + ')}
                      {choice.locks && choice.locks.length > 0 && ' 🔒'}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={decision === 'approved' ? 'confirm-btn' : undefined}
                  onClick={() => onDecide(index, 'approved')}
                >
                  {decision === 'approved' ? '✓ Aprobada' : 'Aprobar'}
                </button>
                <button
                  type="button"
                  className={decision === 'rejected' ? styles.rejectedBtn : undefined}
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
