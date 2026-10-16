import { useCallback, useEffect, useState } from 'react'
import { getAllLists } from '../data/db'
import { ListDetailView } from '../list/ListDetailView'
import type { ArmyList } from '../data/schema'
import styles from './GameView.module.css'

export function GameView() {
  const [lists, setLists] = useState<ArmyList[]>([])
  const [error, setError] = useState<string | null>(null)
  const [openList, setOpenList] = useState<ArmyList | null>(null)

  const loadLists = useCallback(() => {
    getAllLists()
      .then(setLists)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error al cargar las listas')
      })
  }, [])

  useEffect(() => {
    loadLists()
  }, [loadLists])

  if (openList) {
    return <ListDetailView list={openList} onBack={() => setOpenList(null)} />
  }

  const sortedLists = [...lists].sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''))

  return (
    <section className="workspace" aria-labelledby="page-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">40KSIM <span>·</span> GAME</p>
          <h1 id="page-title">Choose your <span>list</span></h1>
        </div>
      </div>

      {error && <p className="board-alert">{error}</p>}

      {sortedLists.length === 0 ? (
        <p className="home-empty">Todavía no has subido ninguna lista. Súbela desde la pestaña LIST.</p>
      ) : (
        <ul className={styles.list}>
          {sortedLists.map((list) => (
            <li key={list.id}>
              <button type="button" className={styles.row} onClick={() => setOpenList(list)}>
                <span className={styles.rowName}>{list.armyName ?? list.title}</span>
                <span className="profile-meta">{list.declaredPoints ? `${list.declaredPoints} pts` : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
