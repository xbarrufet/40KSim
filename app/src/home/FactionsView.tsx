import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useCatalog } from '../data/useCatalog'
import { getBaseDataCount, getConfirmedUnitDataCount } from '../data/db'

interface FactionsViewProps {
  onSelectFaction: (faction: { slug: string; name: string }) => void
}

export function FactionsView({ onSelectFaction }: FactionsViewProps) {
  const catalogState = useCatalog()

  return (
    <section className="workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">40KSIM <span>·</span> CATÁLOGO</p>
          <h1>Choose your <span>army</span></h1>
        </div>
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
