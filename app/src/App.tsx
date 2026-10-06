import { useEffect, useState } from 'react'
import { Swords } from 'lucide-react'
import { GameView } from './game/GameView'
import { HomeView } from './home/HomeView'
import { ListView } from './list/ListView'
import './App.css'

type Tab = 'factions' | 'list' | 'game'

interface SelectedFaction {
  slug: string
  name: string
}

function App() {
  const [tab, setTab] = useState<Tab>('factions')
  const [selectedFaction, setSelectedFaction] = useState<SelectedFaction | null>(null)

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="40KSim, inicio">
          <span className="brand-mark"><Swords size={19} strokeWidth={2.2} /></span>
          <span>40K<span className="brand-light">SIM</span></span>
        </a>
        <nav className="main-nav">
          <button
            type="button"
            className={tab === 'factions' ? 'active' : ''}
            onClick={() => {
              setTab('factions')
              setSelectedFaction(null)
            }}
          >
            FACTIONS
          </button>
          <button
            type="button"
            className={tab === 'list' ? 'active' : ''}
            onClick={() => setTab('list')}
          >
            LIST
          </button>
          <button
            type="button"
            className={tab === 'game' ? 'active' : ''}
            onClick={() => setTab('game')}
          >
            GAME
          </button>
        </nav>
        <div className="topbar-meta">
          <ConnectionState />
        </div>
      </header>

      {tab === 'factions' && (
        <HomeView
          selectedFaction={selectedFaction}
          onSelectFaction={setSelectedFaction}
          onBack={() => setSelectedFaction(null)}
        />
      )}
      {tab === 'list' && <ListView />}
      {tab === 'game' && <GameView />}

      <footer className="app-footer">
        <span>40KSIM <span className="footer-divider">/</span> FIELD TOOLS</span>
        <span>RULES ENGINE IN DEVELOPMENT</span>
      </footer>
    </main>
  )
}

function ConnectionState() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return (
    <span className={`connection-state ${online ? 'is-online' : 'is-offline'}`}>
      <span className="state-dot" />
      {online ? 'LOCAL DATA' : 'OFFLINE'}
    </span>
  )
}

export default App
