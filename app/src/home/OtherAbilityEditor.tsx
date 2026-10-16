import styles from './StructuringForm.module.css'

export interface OtherAbilityEditorProps {
  editingOtherText: string
  setEditingOtherText: (text: string) => void
  onStructure: () => void
  onCancel: () => void
  onSave: () => void
}

export function OtherAbilityEditor({ editingOtherText, setEditingOtherText, onStructure, onCancel, onSave }: OtherAbilityEditorProps) {
  return (
    <div className={styles.form}>
      <textarea
        className={styles.otherTextarea}
        value={editingOtherText}
        onChange={(e) => setEditingOtherText(e.target.value)}
      />
      <div className={styles.formActions}>
        <button type="button" onClick={onStructure}>Estructurar</button>
        <button type="button" onClick={onCancel}>Cancelar</button>
        <button type="button" className="confirm-btn" onClick={onSave}>Guardar como OTHER</button>
      </div>
    </div>
  )
}
