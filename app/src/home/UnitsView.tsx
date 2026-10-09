import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw, Upload } from 'lucide-react'
import { getUnitsByFaction, getUnitStatuses, syncUnitCatalog, type UnitStatus } from '../data/db'
import type { UnitCatalog } from '../data/schema'
import { ProcessUnitView } from './ProcessUnitView'
import { UploadModal } from './UploadModal'
import { ProposalsImportModal } from './ProposalsImportModal'

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

type GridItem = { type: 'category'; label: string } | { type: 'unit'; unit: UnitRow }

function distributeToColumns(items: GridItem[]): [GridItem[], GridItem[], GridItem[], GridItem[]] {
  const total = items.length
  const target = total / 4
  const cols: [GridItem[], GridItem[], GridItem[], GridItem[]] = [[], [], [], []]
  let col = 0
  let accumulated = 0

  for (const item of items) {
    cols[col].push(item)
    accumulated++
    if (col < 3 && accumulated >= Math.ceil(target * (col + 1))) {
      col++
    }
  }

  return cols
}

export function UnitsView({ faction, onBack }: UnitsViewProps) {
  const [units, setUnits] = useState<UnitRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showProposalsImport, setShowProposalsImport] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

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

  const handleSync = useCallback(async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/data/units.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const catalog = (await res.json()) as UnitCatalog
      const factionData = catalog.factions.find((f) => f.slug === faction.slug)
      if (!factionData?.units?.length) {
        setSyncResult('No hay datos de catálogo para esta facción.')
        return
      }
      const { added, updated } = await syncUnitCatalog(faction.slug, factionData.units)
      setSyncResult(`${added} añadidas, ${updated} actualizadas`)
      loadUnits()
    } catch (err) {
      setSyncResult(err instanceof Error ? err.message : 'Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }, [faction.slug, loadUnits])

  const categories = units ? Array.from(new Set(units.map((u) => u.category ?? 'Unidades'))) : []

  if (selectedUnit) {
    return (
      <ProcessUnitView
        faction={faction}
        unitSlug={selectedUnit}
        onBack={() => setSelectedUnit(null)}
        onSaved={() => {
          setSelectedUnit(null)
          loadUnits()
        }}
      />
    )
  }

  const gridItems: GridItem[] = []
  if (units) {
    for (const category of categories) {
      gridItems.push({ type: 'category', label: category })
      for (const unit of units.filter((u) => (u.category ?? 'Unidades') === category)) {
        gridItems.push({ type: 'unit', unit })
      }
    }
  }
  const columns = distributeToColumns(gridItems)

  return (
    <section className="workspace">
      <div className="unit-board-topbar">
        <button type="button" className="back-link" onClick={onBack}>
          <ArrowLeft size={14} /> Facciones
        </button>
        <h1>{faction.name}</h1>
        <button
          type="button"
          className="upload-btn"
          onClick={handleSync}
          disabled={syncing}
          title="Sincronizar catálogo"
        >
          <RefreshCw size={16} />
        </button>
        <button type="button" className="upload-btn" onClick={() => setShowUpload(true)} title="Subir BaseData">
          <Upload size={16} />
        </button>
        <button type="button" className="upload-btn" onClick={() => setShowProposalsImport(true)} title="Importar propuestas IA">
          IA
        </button>
      </div>

      {error && <p className="board-alert">{error}</p>}
      {syncResult && (
        <p className={syncResult.startsWith('No hay') || syncResult.startsWith('Error') || syncResult.startsWith('HTTP') ? 'board-alert' : 'board-success'}>
          {syncResult}
        </p>
      )}

      <div className="unit-columns">
        {columns.map((col, colIdx) => (
          <div key={colIdx}>
            {col.map((item, itemIdx) =>
              item.type === 'category' ? (
                <h2 key={`cat-${itemIdx}`} className="unit-cat-header">
                  {item.label.toUpperCase()}
                </h2>
              ) : (
                <div key={item.unit.slug} className="unit-row">
                  <button
                    type="button"
                    className="unit-row-name unit-link"
                    onClick={() => setSelectedUnit(item.unit.slug)}
                  >
                    {item.unit.name}
                  </button>
                  <span className={`status-light is-${item.unit.status}`} aria-hidden="true" />
                  <span className="unit-row-spacer" />
                  <span className="unit-row-points">{item.unit.points ?? 0}</span>
                </div>
              ),
            )}
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
      {showProposalsImport && (
        <ProposalsImportModal
          factionSlug={faction.slug}
          onClose={() => setShowProposalsImport(false)}
          onImported={loadUnits}
        />
      )}
    </section>
  )
}
