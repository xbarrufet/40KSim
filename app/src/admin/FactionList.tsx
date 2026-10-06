import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { JobLog } from './JobLog'
import { useJobPolling } from './useJobPolling'

interface FactionSummary {
  name: string
  slug: string
  category: string
  unitsCount: number
  baseDataCount: number
  unitDataCount: number
  updatedAt: string | null
}

interface FactionListProps {
  onSelectFaction: (faction: { slug: string; name: string }) => void
}

type FactionStatus = 'red' | 'yellow' | 'green'

function factionStatus(faction: FactionSummary): FactionStatus {
  if (faction.baseDataCount === 0) return 'red'
  if (faction.baseDataCount === faction.unitsCount && faction.unitDataCount === faction.unitsCount) {
    return 'green'
  }
  return 'yellow'
}

export function FactionList({ onSelectFaction }: FactionListProps) {
  const [factions, setFactions] = useState<FactionSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmingAll, setConfirmingAll] = useState(false)
  const { job, start } = useJobPolling()

  const reload = () => {
    fetch('/api/admin/factions')
      .then((res) => res.json())
      .then((data: FactionSummary[]) => setFactions(data))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error al cargar facciones')
      })
  }

  useEffect(() => {
    reload()
  }, [])

  useEffect(() => {
    if (job?.status === 'done') reload()
  }, [job?.status])

  const categories = factions ? Array.from(new Set(factions.map((f) => f.category))) : []
  const busy = job?.status === 'running'

  const refreshAll = () => {
    setConfirmingAll(false)
    start({ scope: 'all' })
  }

  return (
    <div className="faction-list">
      {error && (
        <div className="admin-alert" role="alert">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="faction-list-toolbar">
        <button type="button" onClick={reload}>
          <RefreshCw size={14} /> Recargar lista
        </button>
        {confirmingAll ? (
          <span className="confirm-all">
            Esto puede tardar 1.5-3+ horas (~36 facciones, ~1700 unidades).
            <button type="button" onClick={refreshAll}>Confirmar</button>
            <button type="button" onClick={() => setConfirmingAll(false)}>Cancelar</button>
          </span>
        ) : (
          <button type="button" disabled={busy} onClick={() => setConfirmingAll(true)}>
            Recargar todo
          </button>
        )}
      </div>

      {job && <JobLog job={job} />}

      {categories.map((category) => (
        <section key={category} className="faction-category">
          <h2>{category.toUpperCase()}</h2>
          <div className="faction-grid">
            {factions!
              .filter((faction) => faction.category === category)
              .map((faction) => (
                <button
                  key={faction.slug}
                  type="button"
                  className="faction-card"
                  onClick={() => onSelectFaction({ slug: faction.slug, name: faction.name })}
                >
                  <span className={`faction-status-light is-${factionStatus(faction)}`} aria-hidden="true" />
                  <span className="faction-name">{faction.name}</span>
                  <span className="faction-counts">
                    {faction.baseDataCount}/{faction.unitDataCount} units
                  </span>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
