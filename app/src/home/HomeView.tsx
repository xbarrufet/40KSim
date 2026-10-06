import { AlertTriangle } from 'lucide-react'
import { useCatalog } from '../data/useCatalog'

export function HomeView() {
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

      {catalogState.status === 'ready' && catalogState.catalog.factions.length === 0 && (
        <p className="home-empty">
          Todavía no hay facciones generadas. Usa el panel de administración (<code>/admin</code>) para descargarlas.
        </p>
      )}

      {catalogState.status === 'ready' && catalogState.catalog.factions.length > 0 && (
        <FactionCategories factions={catalogState.catalog.factions} />
      )}
    </section>
  )
}

function FactionCategories({
  factions,
}: {
  factions: { id: string; name: string; category?: string; units: unknown[] }[]
}) {
  const categories = Array.from(new Set(factions.map((faction) => faction.category ?? 'Facciones')))

  return (
    <>
      {categories.map((category) => (
        <section key={category} className="faction-category">
          <h2>{category.toUpperCase()}</h2>
          <div className="faction-grid">
            {factions
              .filter((faction) => (faction.category ?? 'Facciones') === category)
              .map((faction) => (
                <div key={faction.id} className="faction-card">
                  <span className="faction-name">{faction.name}</span>
                  <span className="faction-counts">{faction.units.length} unidades</span>
                </div>
              ))}
          </div>
        </section>
      ))}
    </>
  )
}
