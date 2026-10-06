import { useState } from 'react'
import { X } from 'lucide-react'
import { parseAndValidateArmyList, saveParsedList } from '../data/parseArmyList'

interface ImportListModalProps {
  onClose: () => void
  onImported: () => void
}

export function ImportListModal({ onClose, onImported }: ImportListModalProps) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const parsed = await parseAndValidateArmyList(text)
      await saveParsedList(parsed)
      onImported()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la lista')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Subir lista</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="list-paste-panel">
          <p>Pega aquí el texto exportado desde 40k.app para guardarla y borrarla cuando quieras.</p>
          <textarea
            className="list-paste-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="04-10&#10;Imperial Fists · Ceramite Sentinels · Devastator Brethren&#10;..."
            rows={10}
          />
          {error && <p className="board-alert">{error}</p>}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="confirm-btn"
            disabled={submitting || !text.trim()}
            onClick={handleSubmit}
          >
            {submitting ? 'Subiendo…' : 'Subir lista'}
          </button>
        </div>
      </div>
    </div>
  )
}
