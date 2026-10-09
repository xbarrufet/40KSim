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
  category?: string
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

export type UnitDataTag = 'PENDING' | 'AI_PROPOSED' | 'CONFIRMED'

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

export type AttackType = 'SHOOTING' | 'FIGHT' | 'ANY'

export type AppliesTo = 'SelfModel' | 'SelfUnit' | 'Enemy' | 'Ally'

export type UnitStat = 'Movement' | 'Toughness' | 'Save' | 'Invulnerable' | 'Wounds' | 'ObjectiveControl' | 'Leadership'

export type WeaponTarget = 'ALL' | 'RANGE' | 'MELEE'

export type WeaponStat = 'Strength' | 'Damage' | 'Range' | 'Attacks' | 'AP' | 'Skill'

export interface StatModifierEffect {
  category: 'statModifier'
  appliedTo: AppliesTo
  weaponTarget?: WeaponTarget
  stat: UnitStat | WeaponStat
  mode: 'add' | 'subtract' | 'setValue' | 'halve'
  value?: number
}

export interface DiceModifierEffect {
  category: 'diceModifier'
  appliedTo: AppliesTo
  roll: 'toHit' | 'toWound' | 'savingThrow'
  action: 'rerollOnes' | 'rerollFailed' | 'rerollAll' | 'addToRoll' | 'subtractFromRoll' | 'autoSuccess' | 'ignoreModifiers'
  attackType?: 'RANGE' | 'MELEE' | 'ALL'
}

export interface WeaponKeywordEffect {
  category: 'weaponKeyword'
  appliedTo: AppliesTo
  weaponTarget: WeaponTarget
  keyword: KnownAttribute
  value: string | null
}

export interface DamageMitigationEffect {
  category: 'damageMitigation'
  appliedTo: AppliesTo
  kind: 'fnp' | 'damageReduction' | 'damageHalved' | 'fightOnDeath'
  value?: number
  condition?: 'any' | 'vsMortalWounds' | 'vsPsychic'
}

export type MortalWoundsGameEvent = 'onCharge' | 'activeAbility' | 'onDestroyed' | 'onMove'

export type MortalWoundsTargetScope = 'engagedUnit' | 'selectedEnemyUnit' | 'allUnitsWithinRange' | 'movedOverUnit'

export type MortalWoundsAmount =
  | { kind: 'fixed'; value: number }
  | { kind: 'roll'; dice: 'D3' | 'D6'; count?: number; modifier?: number }
  | { kind: 'perModelRoll'; threshold: number; onSuccess: number }
  | { kind: 'multiDiceCount'; diceCount: number; threshold: number; onSuccess: number }

export interface MortalWoundsAmountByKeyword {
  targetKeyword: string
  amount: MortalWoundsAmount
}

export interface MortalWoundsPreRoll {
  dice: 'D6' | 'D3'
  threshold: number
}

export interface MortalWoundsEffect {
  category: 'mortalWounds'
  appliedTo: AppliesTo
  gameEvent: MortalWoundsGameEvent
  preRoll?: MortalWoundsPreRoll
  targetScope: MortalWoundsTargetScope
  range?: number
  amount: MortalWoundsAmount
  amountByKeyword?: MortalWoundsAmountByKeyword[]
}

export type Effect = StatModifierEffect | DiceModifierEffect | WeaponKeywordEffect | DamageMitigationEffect | MortalWoundsEffect

export interface StructuredAbility {
  type: AbilityContext
  name: string
  attackType: AttackType
  trigger: string
  autoApply?: boolean
  groupId?: string
  groupOperator?: 'AND' | 'OR'
  effects: Effect[]
  originalText?: string
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
  baseDataHash?: string
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