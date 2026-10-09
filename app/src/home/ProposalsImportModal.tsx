import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from 'react'
import { X } from 'lucide-react'
import { getStructuredAbilitiesData, putStructuredAbilitiesData } from '../data/db'
import type { StructuredAbilitiesData } from '../data/schema'

interface ProposalsImportModalProps {
  factionSlug: string
  onClose: () => void
  onImported: () => void
}

type UnitTag = 'new' | 'PENDING' | 'AI_PROPOSED' | 'CONFIRMED'

interface UnitPreviewEntry {
  slug: string
  currentTag: UnitTag
  checked: boolean
}

type ModalStatus = 'idle' | 'loaded' | 'confirming'

export function ProposalsImportModal({ factionSlug, onClose, onImported }: ProposalsImportModalProps) {
  const [status, setStatus] = useState<ModalStatus>('idle')
  const [units, setUnits] = useState<UnitPreviewEntry[]>([])
  const [dragging, setDragging] = useState(false)
  const [parsedData, setParsedData] = useState<Record<string, unknown>>({})
  const selectAllRef = useRef<HTMLInputElement>(null)

  const checkedCount = units.filter((u) => u.checked).length

  useEffect(() => {
    if (!selectAllRef.current || units.length === 0) return
    selectAllRef.current.indeterminate = checkedCount > 0 && checkedCount < units.length
    selectAllRef.current.checked = checkedCount === units.length
  }, [checkedCount, units.length])

  const handleFile = async (file: File) => {
    let json: Record<string, unknown>
    try {
      json = JSON.parse(await file.text()) as Record<string, unknown>
    } catch {
      return
    }

    const entries: UnitPreviewEntry[] = []
    for (const key of Object.keys(json)) {
      const parts = key.split('/')
      if (parts.length !== 2 || parts[0] !== factionSlug) continue
      const unitSlug = parts[1]
      const existing = await getStructuredAbilitiesData(factionSlug, unitSlug)
      const currentTag: UnitTag = existing?.tag === 'CONFIRMED'
        ? 'CONFIRMED'
        : existing?.tag === 'AI_PROPOSED'
          ? 'AI_PROPOSED'
          : existing?.tag === 'PENDING'
            ? 'PENDING'
            : 'new'
      entries.push({ slug: unitSlug, currentTag, checked: currentTag !== 'CONFIRMED' })
    }

    setParsedData(json)
    setUnits(entries)
    setStatus('loaded')
  }

  const toggleUnit = (slug: string) => {
    setUnits((prev) => prev.map((u) => u.slug === slug ? { ...u, checked: !u.checked } : u))
  }

  const toggleAll = (checked: boolean) => {
    setUnits((prev) => prev.map((u) => ({ ...u, checked })))
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.json')) await handleFile(file)
  }

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleFile(file)
  }

  const handleConfirm = async () => {
    setStatus('confirming')
    for (const entry of units) {
      if (!entry.checked) continue
      const key = `${factionSlug}/${entry.slug}`
      const value = parsedData[key]
      if (value) await putStructuredAbilitiesData(factionSlug, entry.slug, value as StructuredAbilitiesData)
    }
    onImported()
    onClose()
  }

  const tagLabel = (tag: UnitTag): { text: string; className: string } => {
    switch (tag) {
      case 'new': return { text: 'NUEVO', className: 'file-new' }
      case 'PENDING': return { text: 'PENDING', className: 'file-new' }
      case 'AI_PROPOSED': return { text: 'AI_PROPOSED', className: 'file-match' }
      case 'CONFIRMED': return { text: 'CONFIRMED', className: 'file-skip' }
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Importar propuestas IA</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div
          className={`drop-zone${dragging ? ' drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
        >
          <label style={{ cursor: 'pointer', display: 'block' }}>
            <p style={{ margin: 0 }}>Arrastra <code>structuring_proposals.json</code> o un archivo de la carpeta <code>ai-abilities/</code></p>
            <p style={{ margin: '4px 0 0', fontSize: 11 }}>o haz clic para seleccionar</p>
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
          </label>
        </div>

        {units.length > 0 && (
          <>
            <div className="file-list-header">
              <input
                type="checkbox"
                ref={selectAllRef}
                onChange={(e) => toggleAll(e.target.checked)}
              />
              <span>Seleccionar todo</span>
            </div>
            <div className="file-list">
              <ul>
                {units.map((entry) => {
                  const label = tagLabel(entry.currentTag)
                  return (
                    <li key={entry.slug} className="file-entry">
                      <input
                        type="checkbox"
                        checked={entry.checked}
                        onChange={() => toggleUnit(entry.slug)}
                      />
                      <span className="file-name">{entry.slug}</span>
                      <span className={label.className}>{label.text}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="confirm-btn"
            disabled={status === 'idle' || status === 'confirming' || checkedCount === 0}
            onClick={handleConfirm}
          >
            {status === 'confirming'
              ? 'Importando…'
              : `Confirmar${checkedCount > 0 ? ` (${checkedCount})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
