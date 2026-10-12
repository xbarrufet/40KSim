import { useCallback, useEffect, useState } from 'react'
import { initCatalog, getAllFactions } from './loadCatalog'

interface FactionSummary {
  id: string
  slug: string
  name: string
  category?: string
  icon?: string
  unitCount: number
}

export type CatalogState =
  | { status: 'loading' }
  | { status: 'ready'; factions: FactionSummary[] }
  | { status: 'error'; message: string }

export function useCatalog(): CatalogState & { refresh: () => void } {
  const [state, setState] = useState<CatalogState>({ status: 'loading' })
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  useEffect(() => {
    let active = true

    initCatalog()
      .then(() => getAllFactions())
      .then((factions) => {
        if (active) setState({ status: 'ready', factions })
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Error al cargar los datos.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [refreshKey])

  return { ...state, refresh }
}
