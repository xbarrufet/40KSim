import { getAllFactions } from './db'

export async function initCatalog(): Promise<void> {
  await getAllFactions()
}

export { getAllFactions }
