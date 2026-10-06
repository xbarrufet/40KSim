import { useState } from 'react'
import { FactionDetail } from './FactionDetail'
import { FactionList } from './FactionList'
import { PointsPanel } from './PointsPanel'
import './admin.css'

type Tab = 'factions' | 'points'

interface SelectedFaction {
  slug: string
  name: string
}

export function AdminApp() {
  const [tab, setTab] = useState<Tab>('factions')
  const [selectedFaction, setSelectedFaction] = useState<SelectedFaction | null>(null)

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <h1>40K<span>SIM · ADMIN</span></h1>
        <nav className="admin-tabs">
          <button
            type="button"
            className={tab === 'factions' ? 'active' : ''}
            onClick={() => {
              setTab('factions')
              setSelectedFaction(null)
            }}
          >
            Facciones
          </button>
          <button
            type="button"
            className={tab === 'points' ? 'active' : ''}
            onClick={() => setTab('points')}
          >
            Puntos
          </button>
        </nav>
      </header>

      <section className="admin-body">
        {tab === 'factions' &&
          (selectedFaction ? (
            <FactionDetail
              slug={selectedFaction.slug}
              name={selectedFaction.name}
              onBack={() => setSelectedFaction(null)}
            />
          ) : (
            <FactionList onSelectFaction={setSelectedFaction} />
          ))}
        {tab === 'points' && <PointsPanel />}
      </section>
    </main>
  )
}
