import { useEffect, useState } from 'react'
import { loadCatalog } from './loadCatalog'
import type { UnitCatalog } from './schema'

export type CatalogState =
  | { status: 'loading' }
  | { status: 'ready'; catalog: UnitCatalog }
  | { status: 'error'; message: string }

export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    loadCatalog()
      .then((catalog) => {
        if (active) setState({ status: 'ready', catalog })
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
  }, [])

  return state
}
