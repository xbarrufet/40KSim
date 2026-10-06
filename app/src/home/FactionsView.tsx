import { AlertTriangle } from 'lucide-react'
import { useCatalog } from '../data/useCatalog'

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

function FactionCategories({
  factions,
  onSelect,
}: {
  factions: { id: string; slug: string; name: string; category?: string; unitCount: number }[]
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
                <button
                  key={faction.id}
                  type="button"
                  className="faction-card"
                  onClick={() => onSelect({ slug: faction.slug, name: faction.name })}
                >
                  <span className="faction-name">{faction.name}</span>
                  <span className="faction-counts">{faction.unitCount} unidades</span>
                </button>
              ))}
          </div>
        </section>
      ))}
    </>
  )
}
