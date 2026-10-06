import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Upload } from 'lucide-react'
import { getUnitsByFaction, getUnitStatuses, type UnitStatus } from '../data/db'
import { UploadModal } from './UploadModal'

interface UnitsViewProps {
  faction: { slug: string; name: string }
  onBack: () => void
}

interface UnitRow {
  slug: string
  name: string
  category?: string
  points?: number
  status: UnitStatus
}

export function UnitsView({ faction, onBack }: UnitsViewProps) {
  const [units, setUnits] = useState<UnitRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const loadUnits = useCallback(() => {
    getUnitsByFaction(faction.slug)
      .then(async (records) => {
        const slugs = records.map((r) => r.slug)
        const statuses = await getUnitStatuses(faction.slug, slugs)
        const rows: UnitRow[] = records.map((r) => ({
          slug: r.slug,
          name: r.name,
          category: r.category,
          points: r.points,
          status: statuses.get(r.slug) ?? 'red',
        }))
        setUnits(rows)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error al cargar unidades')
      })
  }, [faction.slug])

  useEffect(() => {
    loadUnits()
  }, [loadUnits])

  const categories = units ? Array.from(new Set(units.map((u) => u.category ?? 'Unidades'))) : []

  return (
    <section className="workspace">
      <div className="unit-board-topbar">
        <button type="button" className="back-link" onClick={onBack}>
          <ArrowLeft size={14} /> Facciones
        </button>
        <h1>{faction.name}</h1>
        <button type="button" className="upload-btn" onClick={() => setShowUpload(true)}>
          <Upload size={16} />
        </button>
      </div>

      {error && <p className="board-alert">{error}</p>}

      <div className="unit-columns">
        {categories.map((category) => (
          <div key={category} className="unit-category">
            <h2>{category.toUpperCase()}</h2>
            <ul className="unit-rows">
              {units!
                .filter((u) => (u.category ?? 'Unidades') === category)
                .map((unit) => (
                  <li key={unit.slug} className="unit-row">
                    <span className="unit-row-name unit-link">{unit.name}</span>
                    <span className="unit-row-points">{unit.points ?? '—'}</span>
                    <span className={`status-light is-${unit.status}`} aria-hidden="true" />
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      {showUpload && (
        <UploadModal
          factionSlug={faction.slug}
          units={units ?? []}
          onClose={() => setShowUpload(false)}
          onUploaded={loadUnits}
        />
      )}
    </section>
  )
}
