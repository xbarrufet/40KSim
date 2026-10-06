import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { deleteList, getAllFactions, getAllLists } from '../data/db'
import { ImportListModal } from './ImportListModal'
import { ListDetailView } from './ListDetailView'
import type { ArmyList } from '../data/schema'

export function ListView() {
  const [lists, setLists] = useState<ArmyList[]>([])
  const [factionNames, setFactionNames] = useState<Map<string, string>>(new Map())
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openList, setOpenList] = useState<ArmyList | null>(null)

  const loadLists = useCallback(() => {
    Promise.all([getAllLists(), getAllFactions()])
      .then(([allLists, factions]) => {
        setLists(allLists)
        setFactionNames(new Map(factions.map((faction) => [faction.slug, faction.name])))
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error al cargar las listas')
      })
  }, [])

  useEffect(() => {
    loadLists()
  }, [loadLists])

  const handleDelete = async (id: string) => {
    await deleteList(id)
    loadLists()
  }

  const sortedLists = [...lists].sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''))

  if (openList) {
    return <ListDetailView list={openList} onBack={() => setOpenList(null)} />
  }

  return (
    <section className="workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">40KSIM <span>·</span> LISTAS</p>
          <h1>Army <span>lists</span></h1>
        </div>
      </div>

      {error && <p className="board-alert">{error}</p>}

      <div className="saved-lists-panel">
        <div className="saved-lists-toolbar">
          <button type="button" className="add-list-btn" onClick={() => setImporting(true)} aria-label="Subir lista">
            <Plus size={16} />
          </button>
        </div>

        {sortedLists.length === 0 ? (
          <p className="saved-lists-empty">Todavía no has subido ninguna lista.</p>
        ) : (
          <div className="saved-lists-table-wrap">
            <table className="saved-lists-table">
              <thead>
                <tr>
                  <th className="saved-lists-date-col">Fecha</th>
                  <th>Nombre</th>
                  <th>Facción</th>
                  <th>Destacamento</th>
                  <th>Puntos</th>
                  <th aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {sortedLists.map((list) => (
                  <SavedListRow
                    key={list.id}
                    list={list}
                    factionName={list.factionSlug ? factionNames.get(list.factionSlug) : undefined}
                    onOpen={() => setOpenList(list)}
                    onDelete={() => handleDelete(list.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {importing && (
        <ImportListModal onClose={() => setImporting(false)} onImported={loadLists} />
      )}
    </section>
  )
}

function SavedListRow({
  list,
  factionName,
  onOpen,
  onDelete,
}: {
  list: ArmyList
  factionName: string | undefined
  onOpen: () => void
  onDelete: () => void
}) {
  return (
    <tr className="saved-list-row" onClick={onOpen}>
      <td className="saved-lists-date-col">{formatUploadedAt(list.uploadedAt)}</td>
      <td>{list.armyName ?? list.title}</td>
      <td>{factionName ?? 'Facción desconocida'}</td>
      <td>{list.detachment ?? '—'}</td>
      <td>{list.declaredPoints ? `${list.declaredPoints} pts` : '—'}</td>
      <td className="saved-lists-actions-col">
        <button
          type="button"
          className="delete-list-btn"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label="Borrar lista"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  )
}

function formatUploadedAt(uploadedAt: string | undefined): string {
  if (!uploadedAt) return '—'
  const date = new Date(uploadedAt)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
}
