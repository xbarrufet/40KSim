import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Download, RefreshCw, Upload } from 'lucide-react'
import { getUnitsByFaction, getUnitStatuses, syncUnitCatalog, type UnitStatus } from '../data/db'
import type { FactionBackup, UnitCatalog } from '../data/schema'
import { exportFactionBackup, importFactionBackup, validateBackupFile } from '../data/backup'
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
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [backupToConfirm, setBackupToConfirm] = useState<FactionBackup | null>(null)
  const [backupError, setBackupError] = useState<string | null>(null)

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

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      await exportFactionBackup(faction.slug)
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Error al exportar')
    } finally {
      setExporting(false)
    }
  }, [faction.slug])

  const handleRestoreFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupError(null)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = validateBackupFile(reader.result as string, faction.slug)
      if (!result.ok) {
        setBackupError(result.error)
      } else {
        setBackupToConfirm(result.backup)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [faction.slug])

  const confirmImport = useCallback(async () => {
    if (!backupToConfirm) return
    setImporting(true)
    setBackupToConfirm(null)
    try {
      await importFactionBackup(faction.slug, backupToConfirm)
      loadUnits()
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Error al importar')
    } finally {
      setImporting(false)
    }
  }, [faction.slug, backupToConfirm, loadUnits])

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
        <button type="button" className="upload-btn" onClick={handleExport} disabled={exporting} title="Descargar backup">
          <Download size={16} />
        </button>
        <label className="upload-btn" title="Restaurar backup" style={{ cursor: importing ? 'not-allowed' : 'pointer' }}>
          <Upload size={16} />
          <input type="file" accept=".json" onChange={handleRestoreFile} disabled={importing} hidden />
        </label>
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
      {backupError && <p className="board-alert">{backupError}</p>}
      {importing && <p>Importando backup…</p>}
      {backupToConfirm && (
        <div className="modal-overlay" onClick={() => setBackupToConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Restaurar backup</h2>
            <p>Facción: <strong>{backupToConfirm.factionSlug}</strong></p>
            <p>Exportado: {new Date(backupToConfirm.exportedAt).toLocaleString()}</p>
            <ul style={{ margin: '1rem 0', paddingLeft: '1.2rem' }}>
              <li>{backupToConfirm.units.length} unidades</li>
              <li>{backupToConfirm.baseData.length} base data</li>
              <li>{backupToConfirm.unitData.length} habilidades estructuradas</li>
              <li>{backupToConfirm.loadoutData.length} loadout</li>
            </ul>
            <p>Los registros existentes serán sobreescritos.</p>
            <div className="modal-actions">
              <button type="button" onClick={() => setBackupToConfirm(null)}>Cancelar</button>
              <button type="button" className="confirm-btn" onClick={confirmImport}>Importar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
