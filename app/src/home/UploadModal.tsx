import { useState, type DragEvent } from 'react'
import { X } from 'lucide-react'
import { putBaseData, putUnit } from '../data/db'

interface UploadModalProps {
  factionSlug: string
  units: { slug: string; name: string }[]
  onClose: () => void
  onUploaded: () => void
}

interface FileEntry {
  slug: string
  fileName: string
  data: unknown
  matchedUnit: string | null
}

export function UploadModal({ factionSlug, units, onClose, onUploaded }: UploadModalProps) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [confirming, setConfirming] = useState(false)

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    const items = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.json'))
    const entries: FileEntry[] = []

    for (const file of items) {
      const slug = file.name.replace(/\.json$/, '')
      const text = await file.text()
      let data: unknown
      try {
        data = JSON.parse(text)
      } catch {
        continue
      }
      const matched = units.find((u) => u.slug === slug)
      entries.push({
        slug,
        fileName: file.name,
        data,
        matchedUnit: matched?.name ?? null,
      })
    }

    setFiles(entries)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      for (const entry of files) {
        if (!entry.matchedUnit) {
          await putUnit(factionSlug, {
            slug: entry.slug,
            name: entry.slug,
            factionSlug,
            keywords: [],
          })
        }
        await putBaseData(factionSlug, entry.slug, entry.data)
      }
      onUploaded()
      onClose()
    } catch {
      setConfirming(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Subir BaseData</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div
          className="drop-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <p>Arrastra archivos .json aquí</p>
        </div>

        {files.length > 0 && (
          <div className="file-list">
            <ul>
              {files.map((entry) => (
                <li key={entry.fileName} className="file-entry">
                  <span className="file-name">{entry.fileName}</span>
                  {entry.matchedUnit ? (
                    <span className="file-match">→ {entry.matchedUnit}</span>
                  ) : (
                    <span className="file-new">+ new</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="confirm-btn"
            disabled={files.length === 0 || confirming}
            onClick={handleConfirm}
          >
            {confirming ? 'Subiendo…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
