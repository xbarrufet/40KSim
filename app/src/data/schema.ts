export type AttributeId = string

export interface UnitCatalog {
  schemaVersion: 1
  generatedAt?: string
  factions: Faction[]
}

export interface Faction {
  id: string
  slug: string
  name: string
  category?: string
  units: UnitProfile[]
}

export interface UnitProfile {
  id: string
  slug: string
  name: string
  points?: number
  keywords: string[]
  models: ModelProfile[]
  weapons: WeaponProfile[]
  abilities: AbilityProfile[]
}

export interface ModelProfile {
  name: string
  movement: string
  toughness: number
  save: number
  invulnerableSave?: number
  wounds: number
  leadership: number
  objectiveControl: number
  count: number
}

export interface WeaponProfile {
  id: string
  name: string
  range: string
  attacks: string
  skill: number
  strength: number
  armourPenetration: number
  damage: string
  attributes: AttributeId[]
}

export interface AbilityProfile {
  id: string
  name: string
  description?: string
  attributes: AttributeId[]
}