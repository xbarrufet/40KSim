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

export type Phase = 'ANY' | 'MOVEMENT' | 'SHOOTING' | 'CHARGE' | 'FIGHT' | 'COMMAND'

export type AppliesTo = 'SelfModel' | 'SelfUnit' | 'Enemy' | 'Ally'

export type UnitStat = 'Movement' | 'Toughness' | 'Save' | 'Invulnerable' | 'Wounds' | 'ObjectiveControl' | 'Leadership'

export type WeaponTarget = 'ALL' | 'RANGE' | 'MELEE' | (string & {})

export type WeaponStat = 'Strength' | 'Damage' | 'Range' | 'Attacks' | 'AP' | 'Skill'

export interface StatModifierEffect {
  category: 'statModifier'
  appliedTo: AppliesTo
  weaponTarget?: WeaponTarget
  stat: UnitStat | WeaponStat
  mode: 'add' | 'subtract' | 'setValue' | 'halve'
  value?: number
  targetCondition?: TargetCondition
}

export interface DiceModifierEffect {
  category: 'diceModifier'
  appliedTo: AppliesTo
  roll: 'toHit' | 'toWound' | 'savingThrow' | 'damage' | 'hazard' | 'charge' | 'battleshock'
  action: 'rerollOnes' | 'rerollFailed' | 'rerollAll' | 'addToRoll' | 'subtractFromRoll' | 'autoSuccess' | 'ignoreModifiers'
  attackType?: WeaponTarget
  targetCondition?: TargetCondition
}

export interface WeaponKeywordEffect {
  category: 'weaponKeyword'
  appliedTo: AppliesTo
  weaponTarget: WeaponTarget
  keyword: KnownAttribute
  value: string | null
  targetCondition?: TargetCondition
}

export interface DamageMitigationEffect {
  category: 'damageMitigation'
  appliedTo: AppliesTo
  kind: 'fnp' | 'damageReduction' | 'damageHalved' | 'fightOnDeath'
  value?: number
  condition?: 'any' | 'vsMortalWounds' | 'vsPsychic'
}

export type TargetConditionKeyword = 'VEHICLE' | 'INFANTRY' | 'MONSTER' | 'CHARACTER' | 'MOUNTED' | 'FLY' | 'WALKER' | 'TITANIC'

export const TARGET_CONDITION_KEYWORDS: TargetConditionKeyword[] = ['VEHICLE', 'INFANTRY', 'MONSTER', 'CHARACTER', 'MOUNTED', 'FLY', 'WALKER', 'TITANIC']

export interface TargetCondition {
  keywords: TargetConditionKeyword[]
  mode: 'includes' | 'excludes'
}

export type MortalWoundsUnitType = 'ALL' | 'VEHICLE' | 'INFANTRY' | 'MONSTER' | 'CHARACTER' | 'MOUNTED' | 'FLY' | 'WALKER' | 'TITANIC'

export type MortalWoundsHits =
  | { kind: 'notation'; value: string }
  | { kind: 'byStat'; stat: string }

export type MortalWoundsResolution =
  | { kind: 'always' }
  | { kind: 'roll'; threshold: number }

export interface MortalWoundsEffect {
  category: 'mortalWounds'
  appliedTo: AppliesTo
  unitType: MortalWoundsUnitType
  hits: MortalWoundsHits
  resolution: MortalWoundsResolution
  damagePerSuccess: string
}

export type KnownUnitKeyword = 'BENEFIT OF COVER' | 'STEALTH' | 'SCOUTS' | 'DEEP STRIKE' | 'LONE OPERATIVE' | 'FIGHTS FIRST'

export const KNOWN_UNIT_KEYWORDS: KnownUnitKeyword[] = ['BENEFIT OF COVER', 'STEALTH', 'SCOUTS', 'DEEP STRIKE', 'LONE OPERATIVE', 'FIGHTS FIRST']

export interface UnitKeywordEffect {
  category: 'unitKeyword'
  appliedTo: AppliesTo
  keyword: KnownUnitKeyword
  value: string | null
}

export interface HealEffect {
  category: 'heal'
  appliedTo: AppliesTo
  amount?: string
}

export type Effect = StatModifierEffect | DiceModifierEffect | WeaponKeywordEffect | UnitKeywordEffect | DamageMitigationEffect | MortalWoundsEffect | HealEffect

export type Frequency = 'always' | 'perPhase' | 'perRound' | 'perBattle'

export interface StructuredAbility {
  name: string
  phase: Phase
  trigger: string
  autoApply?: boolean
  frequency?: Frequency
  groupId?: string
  groupOperator?: 'AND' | 'OR'
  effectsOperator?: 'AND' | 'OR'
  effects: Effect[]
  originalText?: string
}

export interface OtherAbility {
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

export interface WargearRef {
  name: string
  wargearItemId: number
}

export interface WargearScope {
  type: 'model' | 'allModels' | 'anyNumber' | 'ratio'
  role?: string
  ratio?: { per: number; count: number }
}

export interface WargearChoice {
  items: { count: number; name: string; wargearItemId: number }[]
  grants?: WargearRef[]
  locks?: number[]
}

export interface WargearOption {
  scope: WargearScope
  replaces: WargearRef[]
  choices: WargearChoice[]
  isAdditional: boolean
  originalRuleId: number
  originalText: string
}

export interface StructuredLoadoutData {
  tag: UnitDataTag
  options: WargearOption[]
}

export interface FactionBackupUnit {
  slug: string
  name: string
  category?: string
  points?: number
  keywords: string[]
}

export interface FactionBackupBaseData {
  unitSlug: string
  data: unknown
}

export interface FactionBackupUnitData {
  unitSlug: string
  tag: string
  abilities: unknown[]
  rawAbilities: unknown[]
  baseDataHash?: string
}

export interface FactionBackupLoadoutData {
  unitSlug: string
  tag: string
  options: unknown[]
}

export interface EnhancementEligibility {
  keywords: string[]
  excludedKeywords: string[]
  isEquipableByEpicHero: boolean
  isEquipableByNonCharacterUnit: boolean
}

export interface ConditionalEffects {
  condition: string
  effects: Effect[]
}

export interface StructuredEnhancement {
  slug: string
  name: string
  points: number
  enhancementType: 'upgrade' | 'miniature'
  limit: number
  eligibility: EnhancementEligibility
  effects: Effect[]
  conditionalEffects: ConditionalEffects[]
  originalText: string
}

export interface DetachmentData {
  tag: UnitDataTag | 'SCRAPED'
  data: unknown
  enhancements: StructuredEnhancement[] | null
}

export interface FactionBackupDetachmentData {
  detachmentSlug: string
  tag: string
  data: unknown
  enhancements: unknown[] | null
}

export interface FactionBackup {
  format: '40ksim-faction-backup'
  version: 1
  factionSlug: string
  exportedAt: string
  units: FactionBackupUnit[]
  baseData: FactionBackupBaseData[]
  unitData: FactionBackupUnitData[]
  loadoutData: FactionBackupLoadoutData[]
  detachmentData: FactionBackupDetachmentData[]
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