import { useEffect, useState } from 'react'
import { ArrowLeft, Download, Eye, Pencil } from 'lucide-react'
import { JobLog } from './JobLog'
import { useJobPolling } from './useJobPolling'
import './factionDetail.css'

interface UnitSummary {
  name: string
  slug: string
  category: string
  points: string | null
  hasDatasheet: boolean
  hasUnitData: boolean
}

interface FactionDetailProps {
  slug: string
  name: string
  onBack: () => void
}

type UnitStatus = 'red' | 'yellow' | 'green'

function unitStatus(unit: UnitSummary): UnitStatus {
  if (!unit.hasDatasheet) return 'red'
  if (!unit.hasUnitData) return 'yellow'
  return 'green'
}

export function FactionDetail({ slug, name, onBack }: FactionDetailProps) {
  const [units, setUnits] = useState<UnitSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const { job, start } = useJobPolling()

  const reload = () => {
    fetch(`/api/admin/factions/${slug}/units`)
      .then((res) => res.json())
      .then((data: UnitSummary[]) => setUnits(data))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error al cargar unidades')
      })
  }

  useEffect(() => {
    reload()
  }, [slug])

  useEffect(() => {
    if (job?.status === 'done') reload()
  }, [job?.status])

  const toggle = (unitName: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(unitName)) next.delete(unitName)
      else next.add(unitName)
      return next
    })
  }

  const toggleEditMode = () => {
    setEditMode((prev) => !prev)
    setSelected(new Set())
  }

  const busy = job?.status === 'running'

  const download = () => {
    start({ scope: 'units', factionSlug: slug, unitNames: Array.from(selected) })
    setSelected(new Set())
  }

  const categories = units ? Array.from(new Set(units.map((unit) => unit.category))) : []

  return (
    <div className="unit-board">
      <div className="unit-board-topbar">
        <button type="button" className="back-link" onClick={onBack}>
          <ArrowLeft size={14} /> Facciones
        </button>
        <h1>{name}</h1>
        <button
          type="button"
          className="edit-toggle"
          aria-label={editMode ? 'Salir del modo edición' : 'Entrar en modo edición'}
          onClick={toggleEditMode}
        >
          {editMode ? <Eye size={18} /> : <Pencil size={18} />}
        </button>
      </div>

      {error && <p className="board-alert">{error}</p>}
      {job && <JobLog job={job} />}

      <div className="unit-columns">
        {categories.map((category) => (
          <div key={category} className="unit-category">
            <h2>{category.toUpperCase()}</h2>
            <ul className="unit-rows">
              {units!
                .filter((unit) => unit.category === category)
                .map((unit) => (
                  <li key={unit.name} className="unit-row">
                    {editMode && (
                      <input
                        type="checkbox"
                        checked={selected.has(unit.name)}
                        disabled={busy}
                        onChange={() => toggle(unit.name)}
                      />
                    )}
                    <span className="unit-row-name">{unit.name}</span>
                    <span className="unit-row-points">{unit.points ?? '—'}</span>
                    {editMode ? (
                      <button
                        type="button"
                        className="unit-data-btn"
                        onClick={(event) => event.preventDefault()}
                      >
                        Unit Data
                        <span className={`status-light is-${unitStatus(unit)}`} aria-hidden="true" />
                      </button>
                    ) : (
                      <span className={`status-light is-${unitStatus(unit)}`} aria-hidden="true" />
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      {editMode && (
        <div className="unit-board-actionbar">
          <span>{selected.size} seleccionadas</span>
          <button type="button" disabled={busy || selected.size === 0} onClick={download}>
            <Download size={14} /> {busy ? 'Descargando…' : 'Descargar'}
          </button>
        </div>
      )}
    </div>
  )
}
