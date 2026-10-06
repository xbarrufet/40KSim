import type { KnownAttribute } from './weaponKeywords'

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
  icon?: string
  units: UnitProfile[]
}

export interface UnitProfile {
  id: string
  slug: string
  name: string
  points?: number
  keywords?: string[]
  models?: ModelProfile[]
  weapons?: WeaponProfile[]
  abilities?: AbilityProfile[]
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

export type UnitDataTag = 'PENDING' | 'CONFIRMED'

export interface UnitDataStats {
  movement: number
  toughness: number
  save: number
  invulnerableSave: number | null
  wounds: number
  leadership: number
  objectiveControl: number
}

export interface WeaponAbility {
  id: number
  name: string
  value: string | null
}

export interface WeaponProfileData {
  id: number
  name: string
  type: 'melee' | 'ranged'
  range: string
  attacks: string
  ballisticSkill: string | null
  weaponSkill: string | null
  strength: string
  armourPenetration: string
  damage: string
  abilities: WeaponAbility[]
}

export interface WargearEntry {
  wargearItem: {
    id: number
    name: string
    wargearType: string
    count: number
    profiles: WeaponProfileData[]
  }
}

export type AbilityContext = 'Alone' | 'AsLeader' | 'Always'

interface RuleBase {
  trigger: string
  appliedTo: 'SelfModel' | 'SelfUnit' | 'Enemy' | 'Ally'
}

export type UnitStat = 'Movement' | 'Toughness' | 'Save' | 'Invulnerable' | 'Wounds' | 'ObjectiveControl' | 'Leadership'

export type WeaponTarget = 'ALL' | 'RANGE' | 'MELEE'

export type WeaponStat = 'Strength' | 'Damage' | 'Range' | 'Attacks' | 'AP' | 'Skill'

export type DiceThrow = 'Hit' | 'Wound' | 'Save' | 'Damage' | 'Battleshock'

export type RerollTarget = '1' | 'ALL'

export type DiceModifierEffect = { kind: 'adjust'; value: string } | { kind: 'reroll'; reroll: RerollTarget }

export interface UnitStatsModifierRule extends RuleBase {
  type: 'unitStatsModifier'
  stat: UnitStat
  value: string
}

export interface WeaponStatsModifierRule extends RuleBase {
  type: 'weaponStatsModifier'
  weaponTarget: WeaponTarget
  stat: WeaponStat
  value: string
}

export interface DiceModifierRule extends RuleBase {
  type: 'diceModifier'
  throw: DiceThrow
  modifier: DiceModifierEffect
}

export interface AddAttributeRule extends RuleBase {
  type: 'addAttribute'
  weaponTarget: WeaponTarget
  attribute: KnownAttribute
  value: string | null
}

export type Rule = UnitStatsModifierRule | WeaponStatsModifierRule | DiceModifierRule | AddAttributeRule

export interface StructuredAbility {
  type: AbilityContext
  name: string
  rule: Rule
}

export interface OtherAbility {
  type: AbilityContext
  name: string
  category: 'OTHER'
  text: string
}

export type UnitDataAbility = StructuredAbility | OtherAbility

export interface RawAbility {
  name: string
  text: string
  abilityType: string
}

export interface StructuredAbilitiesData {
  tag: UnitDataTag
  abilities: UnitDataAbility[]
  rawAbilities: RawAbility[]
}

export type MatchStatus = 'matched' | 'unmatched'
export type WargearMatchStatus = 'matched' | 'unmatched' | 'unverified'

export interface ArmyListWargearToken {
  name: string
  /** Number of models carrying this item, per the list's own "N×" count (defaults to 1 when unspecified). */
  count: number
  status: WargearMatchStatus
}

export interface ArmyListEntry {
  category: string
  unitName: string
  matchedUnitSlug: string | null
  matchedFactionSlug: string | null
  unitStatus: MatchStatus
  points?: number
  modelCount?: number
  rawWargearText: string
  wargearTokens: ArmyListWargearToken[]
  attachmentText?: string
  enhancementText?: string
}

export interface ArmyList {
  id: string
  title: string
  factionSlug: string | null
  armyName?: string
  detachment?: string
  mission?: string
  declaredPoints?: string
  listUrl?: string
  entries: ArmyListEntry[]
  uploadedAt?: string
}