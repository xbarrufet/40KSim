import { useEffect, useState, type DragEvent } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import { useCatalog } from '../data/useCatalog'
import { getBaseDataCount, getConfirmedUnitDataCount, getFactionsWithoutUnits, syncUnitCatalog } from '../data/db'
import { upsertFaction } from '../data/supabase'

interface FactionsViewProps {
  onSelectFaction: (faction: { slug: string; name: string }) => void
}

export function FactionsView({ onSelectFaction }: FactionsViewProps) {
  const catalogState = useCatalog()
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <section className="workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">40KSIM <span>·</span> CATÁLOGO</p>
          <h1>Choose your <span>army</span></h1>
        </div>
        <button type="button" className="heading-action" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Añadir facción
        </button>
      </div>

      {catalogState.status === 'error' && (
        <div className="catalog-alert" role="alert">
          <AlertTriangle size={17} />
          <span>{catalogState.message}</span>
        </div>
      )}

      {catalogState.status === 'ready' && catalogState.factions.length > 0 && (
        <FactionCategories factions={catalogState.factions} onSelect={onSelectFaction} />
      )}

      {showAddModal && (
        <AddFactionModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { setShowAddModal(false); catalogState.refresh() }}
        />
      )}
    </section>
  )
}

interface FactionData {
  id: string
  slug: string
  name: string
  category?: string
  icon?: string
  unitCount: number
}

function FactionCategories({
  factions,
  onSelect,
}: {
  factions: FactionData[]
  onSelect: (faction: { slug: string; name: string }) => void
}) {
  const categories = Array.from(new Set(factions.map((f) => f.category ?? 'Facciones')))

  return (
    <>
      {categories.map((category) => (
        <section key={category} className="faction-category">
          <h2>{category.toUpperCase()}</h2>
          <div className="faction-grid">
            {factions
              .filter((f) => (f.category ?? 'Facciones') === category)
              .map((faction) => (
                <FactionCard
                  key={faction.id}
                  faction={faction}
                  onSelect={() => onSelect({ slug: faction.slug, name: faction.name })}
                />
              ))}
          </div>
        </section>
      ))}
    </>
  )
}

function FactionCard({ faction, onSelect }: { faction: FactionData; onSelect: () => void }) {
  const [baseCount, setBaseCount] = useState(0)
  const [unitDataCount, setUnitDataCount] = useState(0)
  const [iconError, setIconError] = useState(false)

  useEffect(() => {
    getBaseDataCount(faction.slug).then(setBaseCount)
    getConfirmedUnitDataCount(faction.slug).then(setUnitDataCount)
  }, [faction.slug])

  return (
    <button type="button" className="faction-card" onClick={onSelect}>
      {faction.icon && !iconError && (
        <img
          className="faction-icon"
          src={faction.icon}
          alt=""
          onError={() => setIconError(true)}
        />
      )}
      <span className="faction-name">{faction.name}</span>
      <span className="faction-counts">{baseCount} base / {unitDataCount} processed</span>
    </button>
  )
}

interface ParsedUnitsFile {
  units: Array<{ name: string; slug: string; category?: string; points?: string }>
}

function AddFactionModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [availableFactions, setAvailableFactions] = useState<FactionData[]>([])
  const [selectedSlug, setSelectedSlug] = useState('')
  const [unitsFile, setUnitsFile] = useState<ParsedUnitsFile | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    getFactionsWithoutUnits().then(setAvailableFactions)
  }, [])

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.json')) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as ParsedUnitsFile
      if (Array.isArray(data.units)) {
        setUnitsFile(data)
        setFileName(file.name)
      }
    } catch { /* ignore invalid files */ }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleConfirm = async () => {
    if (!selectedSlug || !unitsFile) return
    setConfirming(true)
    try {
      const faction = availableFactions.find(f => f.slug === selectedSlug)
      if (faction) {
        await upsertFaction({
          slug: faction.slug,
          name: faction.name,
          category: faction.category ?? null,
          icon: faction.icon ?? null,
          unit_count: unitsFile.units.length,
          army_rules: null,
        })
      }
      const catalogUnits = unitsFile.units.map(u => ({
        slug: u.slug,
        name: u.name,
        category: u.category,
        points: u.points ? parseInt(u.points, 10) : undefined,
      }))
      await syncUnitCatalog(selectedSlug, catalogUnits)
      onAdded()
    } catch (err) {
      console.error('Error adding faction:', err)
      setConfirming(false)
    }
  }

  const canConfirm = !!selectedSlug && !!unitsFile && !confirming

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Añadir facción</h2>
        </div>
        <div className="modal-body">
          <label className="form-label">
            Facción
            <select value={selectedSlug} onChange={e => setSelectedSlug(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {availableFactions.map(f => (
                <option key={f.slug} value={f.slug}>{f.name}</option>
              ))}
            </select>
          </label>

          <label className="form-label">Unidades (units.json)</label>
          <div
            className={`drop-zone${dragging ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.json'
              input.onchange = () => { if (input.files?.[0]) handleFile(input.files[0]) }
              input.click()
            }}
          >
            {fileName
              ? <span>{fileName} — {unitsFile?.units.length} unidades</span>
              : <span>Arrastra el archivo units.json aquí</span>
            }
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="button" className="confirm-btn" disabled={!canConfirm} onClick={handleConfirm}>
            {confirming ? 'Subiendo...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
