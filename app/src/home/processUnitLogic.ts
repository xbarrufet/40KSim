import type {
  ArmyListEntry,
  Effect,
  Frequency,
  MortalWoundsHits,
  OtherAbility,
  Phase,
  RawAbility,
  StructuredAbility,
  TargetCondition,
  UnitDataAbility,
  WargearEntry,
  WargearOption,
  WeaponProfileData,
} from '../data/schema'

const ATTACHED_CHARACTER_PREFIXES = ['Led by ', 'Supported by ']

/**
 * Finds the list entry for the character a squad entry's `attachmentText` names as its leader or
 * support (e.g. "Led by Tor Garadon"), by case-insensitive name match against the other entries in
 * the same list. Returns undefined when the entry has no such attachment, or the named character
 * isn't itself a separate entry in the list.
 */
export function resolveAttachedEntry(entry: ArmyListEntry, allEntries: ArmyListEntry[]): ArmyListEntry | undefined {
  const text = entry.attachmentText
  if (!text) return undefined
  const prefix = ATTACHED_CHARACTER_PREFIXES.find((candidate) => text.startsWith(candidate))
  if (!prefix) return undefined
  const name = text.slice(prefix.length).trim().toLowerCase()
  return allEntries.find((candidate) => candidate.unitName.toLowerCase() === name)
}

export interface StructuringRow {
  name: string
  phase: Phase
  trigger: string
  autoApply?: boolean
  frequency?: Frequency
  groupId?: string
  groupOperator?: 'AND' | 'OR'
  effectsOperator?: 'AND' | 'OR'
  effects: Effect[]
}

export function buildStructuredAbilities(rows: StructuringRow[]): StructuredAbility[] {
  return rows.map((row) => ({
    name: row.name,
    phase: row.phase,
    trigger: row.trigger,
    autoApply: row.autoApply,
    frequency: row.frequency,
    groupId: row.groupId,
    groupOperator: row.groupOperator,
    effectsOperator: row.effectsOperator,
    effects: row.effects,
  }))
}

export function buildOtherAbility(raw: RawAbility): OtherAbility {
  return { name: raw.name, category: 'OTHER', text: raw.text }
}

/**
 * Reconciles the pending raw-ability queue against a unit's current BaseData abilities: any
 * live ability not already present (by name) among the reviewed `abilities` or the pending
 * `rawAbilities` is appended to the queue. Already-reviewed or already-queued abilities are
 * left untouched, so prior structuring/removal/OTHER decisions are never discarded.
 */
export function reconcileRawAbilities(
  currentAbilities: UnitDataAbility[],
  currentRawAbilities: RawAbility[],
  liveRawAbilities: RawAbility[],
): RawAbility[] {
  const knownNames = new Set([
    ...currentAbilities.map((ability) => ability.name),
    ...currentRawAbilities.map((ability) => ability.name),
  ])
  const newAbilities = liveRawAbilities.filter((ability) => !knownNames.has(ability.name))
  return [...currentRawAbilities, ...newAbilities]
}

/** Removes later abilities sharing a name with an earlier one, keeping the first occurrence — used when merging raw abilities from multiple attached units for display. */
export function dedupeAbilitiesByName(abilities: RawAbility[]): RawAbility[] {
  const seen = new Set<string>()
  return abilities.filter((ability) => {
    if (seen.has(ability.name)) return false
    seen.add(ability.name)
    return true
  })
}

export interface LoadoutToken {
  name: string
  count: number
}

export interface LoadoutWargearMatch {
  matched: WargearEntry[]
  unmatchedTokenNames: string[]
  /** Model count per matched wargear item (keyed by `wargearItem.id`), read from whichever token matched it. */
  modelCounts: Map<number, number>
}

/**
 * Filters a unit's full wargear catalogue down to only the items/profiles an army list entry's
 * loadout text actually names (case-insensitive, matched against either the wargear item's own
 * name or any of its weapon profile names). Tokens that match nothing are returned separately so
 * callers can still surface them instead of silently dropping what the entry declared.
 */
export function matchLoadoutWargear(tokens: LoadoutToken[], wargear: WargearEntry[]): LoadoutWargearMatch {
  const matchedTokenNames = new Set<string>()
  const modelCounts = new Map<number, number>()
  const matched = wargear.filter((entry) => {
    const names = [entry.wargearItem.name, ...entry.wargearItem.profiles.map((profile) => profile.name)].map((name) =>
      name.toLowerCase(),
    )
    const matchingToken = tokens.find((token) => names.includes(token.name.toLowerCase()))
    if (!matchingToken) return false
    matchedTokenNames.add(matchingToken.name.toLowerCase())
    // Tokens from a list saved before counts were tracked lack `count` at runtime even though the
    // type says it's required — fall back to 1 rather than showing a blank/undefined count.
    modelCounts.set(entry.wargearItem.id, typeof matchingToken.count === 'number' ? matchingToken.count : 1)
    return true
  })

  const unmatchedTokenNames = tokens.filter((token) => !matchedTokenNames.has(token.name.toLowerCase())).map((token) => token.name)
  return { matched, unmatchedTokenNames, modelCounts }
}

export interface WeaponRow {
  key: string
  label: string
  profile: WeaponProfileData
  wargearItemId: number
}

export function splitWeaponProfiles(wargear: WargearEntry[]): { ranged: WeaponRow[]; melee: WeaponRow[] } {
  const ranged: WeaponRow[] = []
  const melee: WeaponRow[] = []

  for (const entry of wargear) {
    for (const profile of entry.wargearItem.profiles) {
      const label =
        profile.name && profile.name !== entry.wargearItem.name
          ? `${entry.wargearItem.name} (${profile.name})`
          : entry.wargearItem.name
      const row: WeaponRow = { key: `${entry.wargearItem.id}-${profile.id}`, label, profile, wargearItemId: entry.wargearItem.id }
      ;(profile.type === 'ranged' ? ranged : melee).push(row)
    }
  }

  return { ranged, melee }
}

export async function computeBaseDataHash(baseData: unknown): Promise<string> {
  const encoded = new TextEncoder().encode(JSON.stringify(baseData))
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const FREQUENCY_LABELS: Record<string, string> = { perPhase: '1/fase', perRound: '1/ronda', perBattle: '1/partida' }

export const PHASE_SHORT_LABELS: Record<string, string> = { ANY: 'Cualq.', MOVEMENT: 'Mov.', SHOOTING: 'Disp.', CHARGE: 'Carga', FIGHT: 'Comb.', COMMAND: 'Mando' }

export const EFFECT_CATEGORY_SHORT_LABELS: Record<string, string> = { statModifier: 'stat', diceModifier: 'tirada', weaponKeyword: 'wkw', unitKeyword: 'ukw', damageMitigation: 'dmgMit', mortalWounds: 'MW', heal: 'heal' }

function describeHits(hits: MortalWoundsHits): string {
  switch (hits.kind) {
    case 'notation': return hits.value
    case 'byStat': return hits.stat
  }
}

function describeTargetCondition(tc?: TargetCondition): string {
  if (!tc || tc.keywords.length === 0) return ''
  const label = tc.mode === 'excludes' ? 'non-' : 'vs '
  return ` [${label}${tc.keywords.join('/')}]`
}

export function describeEffect(effect: Effect): string {
  switch (effect.category) {
    case 'statModifier':
      return `${effect.mode} ${effect.stat}${effect.value !== undefined ? ` ${effect.value}` : ''}${describeTargetCondition(effect.targetCondition)}`
    case 'diceModifier':
      return `${effect.action} ${effect.roll}${describeTargetCondition(effect.targetCondition)}`
    case 'weaponKeyword':
      return `${effect.keyword}${effect.value ? ` ${effect.value}` : ''} (${effect.weaponTarget})${describeTargetCondition(effect.targetCondition)}`
    case 'damageMitigation':
      return `${effect.kind}${effect.value !== undefined ? ` ${effect.value}` : ''}${effect.condition ? ` vs ${effect.condition}` : ''}`
    case 'mortalWounds': {
      const res = effect.resolution.kind === 'always' ? '' : ` ${effect.resolution.threshold}+`
      const unitStr = effect.unitType !== 'ALL' ? ` vs${effect.unitType}` : ''
      return `MW ${describeHits(effect.hits)}imp${res} →${effect.damagePerSuccess}MW${unitStr}`
    }
    case 'unitKeyword':
      return `${effect.keyword}${effect.value ? ` ${effect.value}` : ''}`
    case 'heal':
      return `Curar ${effect.amount ?? '1'}`
  }
}

export function formatScope(option: WargearOption): string {
  const { scope } = option
  if (scope.role) return scope.role
  switch (scope.type) {
    case 'model': return 'Modelo'
    case 'allModels': return 'Todos los modelos'
    case 'anyNumber': return 'Cualquier número'
    case 'ratio': return `${scope.ratio?.count ?? 1} por cada ${scope.ratio?.per ?? 5} modelos`
  }
}
