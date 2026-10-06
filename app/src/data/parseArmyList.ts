import { getAllFactions, getListByUrl, getUnitData, getUnitsByFaction, putList } from './db'
import type { ArmyList, ArmyListEntry, ArmyListWargearToken, MatchStatus } from './schema'

export interface ParsedEntry {
  category: string
  unitName: string
  points?: number
  modelCount?: number
  rawWargearText: string
  attachmentText?: string
  enhancementText?: string
}

export interface ParsedArmyList {
  title: string
  factionName: string | null
  armyName?: string
  detachment?: string
  mission?: string
  declaredPoints?: string
  listUrl?: string
  entries: ParsedEntry[]
}

const HEADER_RE = /^(.+?)\s*·\s*(.+?)\s*·\s*(.+)$/
const MISSION_RE = /^Mission:\s*(.+)$/
const DECLARED_POINTS_RE = /^(\d+\/\d+)\s*pts$/
const CATEGORY_RE = /^(.+?)\s*\[\d+\s*pts\]$/
const ENTRY_RE = /^(.+?)\s*\[(\d+)\s*pts\]/
const MODEL_COUNT_RE = /\((\d+)\s*models?\)/
const ATTACHMENT_PREFIXES = ['Attached to ', 'Led by ', 'Supported by ']
const ENHANCEMENT_RE = /^Enhancement:/
const LIST_URL_RE = /(https:\/\/(?:www\.)?40k\.app\/lists\/[A-Za-z0-9]+)/
const COUNT_PREFIX_RE = /^\d+\s*[×x]\s*/i

/**
 * Parses a 40k.app army list TEXT export into its structural pieces, with no catalogue matching.
 * The export has no markdown decoration — hierarchy is conveyed by indentation depth alone:
 * category headers are unindented, a unit entry's own line is indented one level deeper, and its
 * sub-lines (Attached to/Led by/Supported by/Enhancement/wargear) are indented deeper still.
 */
export function parseArmyListText(text: string): ParsedArmyList {
  const rawLines = text.split('\n')

  let title = ''
  let factionName: string | null = null
  let armyName: string | undefined
  let detachment: string | undefined
  let mission: string | undefined
  let declaredPoints: string | undefined
  let listUrl: string | undefined
  let headerParsed = false
  let currentCategory = ''
  let currentEntry: ParsedEntry | null = null
  let currentEntryIndent = 0
  const entries: ParsedEntry[] = []

  const flushEntry = () => {
    if (currentEntry) entries.push(currentEntry)
    currentEntry = null
  }

  for (const rawLine of rawLines) {
    const indent = rawLine.length - rawLine.trimStart().length
    const line = rawLine.trim()
    if (!line) continue

    if (!listUrl) {
      const urlMatch = line.match(LIST_URL_RE)
      if (urlMatch) listUrl = urlMatch[1]
    }

    if (indent === 0) {
      if (!title) {
        title = line
        continue
      }

      if (!headerParsed) {
        const headerMatch = line.match(HEADER_RE)
        if (headerMatch) {
          factionName = headerMatch[1].trim()
          armyName = headerMatch[2].trim()
          detachment = headerMatch[3].trim()
          headerParsed = true
          continue
        }
      }

      const missionMatch = line.match(MISSION_RE)
      if (missionMatch) {
        mission = missionMatch[1].trim()
        continue
      }

      const pointsMatch = line.match(DECLARED_POINTS_RE)
      if (pointsMatch) {
        declaredPoints = pointsMatch[1]
        continue
      }

      const categoryMatch = line.match(CATEGORY_RE)
      if (categoryMatch) {
        flushEntry()
        currentCategory = categoryMatch[1].trim()
      }

      // Any other unindented line (footer text, etc.) is not structurally meaningful - ignore it.
      continue
    }

    if (currentEntry && indent > currentEntryIndent) {
      const content = line
      const attachmentPrefix = ATTACHMENT_PREFIXES.find((prefix) => content.startsWith(prefix))
      if (attachmentPrefix) {
        currentEntry.attachmentText = content
      } else if (ENHANCEMENT_RE.test(content)) {
        currentEntry.enhancementText = content
      } else {
        currentEntry.rawWargearText = currentEntry.rawWargearText
          ? `${currentEntry.rawWargearText} / ${content}`
          : content
      }
      continue
    }

    const entryMatch = line.match(ENTRY_RE)
    if (entryMatch) {
      flushEntry()
      const modelCountMatch = line.match(MODEL_COUNT_RE)
      currentEntry = {
        category: currentCategory,
        unitName: entryMatch[1].trim(),
        points: Number(entryMatch[2]),
        modelCount: modelCountMatch ? Number(modelCountMatch[1]) : undefined,
        rawWargearText: '',
      }
      currentEntryIndent = indent
    }
  }

  flushEntry()

  return { title, factionName, armyName, detachment, mission, declaredPoints, listUrl, entries }
}

/** Splits a wargear line into individual weapon/wargear names, stripping any leading "N×" count. */
export function tokenizeWargearLine(line: string): string[] {
  if (!line) return []
  return line
    .split('/')
    .flatMap((slot) =>
      slot
        .split('+')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part, index) => (index === 0 ? part.replace(COUNT_PREFIX_RE, '').trim() : part)),
    )
    .filter(Boolean)
}

/**
 * Resolves a faction's parent: the other faction sharing its `category` whose own `name` equals
 * that category (e.g. category "Space Marines" contains a faction literally named "Space Marines").
 * Returns `null` when the faction has no category, or no other faction's name matches it.
 */
export function resolveParentFactionSlug(
  factionSlug: string,
  factions: { slug: string; name: string; category?: string }[],
): string | null {
  const faction = factions.find((candidate) => candidate.slug === factionSlug)
  if (!faction?.category) return null

  const parent = factions.find((candidate) => candidate.slug !== factionSlug && candidate.name === faction.category)
  return parent?.slug ?? null
}

/**
 * Resolves each parsed entry's unit name against a faction's known units, by case-insensitive exact
 * match, recording `factionSlug` as the entry's `matchedFactionSlug` when it matches.
 */
export function matchUnitNames(
  entries: ParsedEntry[],
  knownUnits: { slug: string; name: string }[],
  factionSlug: string | null,
): ArmyListEntry[] {
  const slugByName = new Map(knownUnits.map((unit) => [unit.name.toLowerCase(), unit.slug]))

  return entries.map((entry) => {
    const matchedUnitSlug = slugByName.get(entry.unitName.toLowerCase()) ?? null
    const unitStatus: MatchStatus = matchedUnitSlug ? 'matched' : 'unmatched'
    return {
      category: entry.category,
      unitName: entry.unitName,
      matchedUnitSlug,
      matchedFactionSlug: matchedUnitSlug ? factionSlug : null,
      unitStatus,
      points: entry.points,
      modelCount: entry.modelCount,
      rawWargearText: entry.rawWargearText,
      wargearTokens: [],
      attachmentText: entry.attachmentText,
      enhancementText: entry.enhancementText,
    }
  })
}

/**
 * Re-attempts matching for still-unmatched entries against a parent faction's known units,
 * leaving already-matched entries untouched. Entries that still don't match stay unmatched.
 */
export function applyParentFallback(
  entries: ArmyListEntry[],
  parentUnits: { slug: string; name: string }[],
  parentFactionSlug: string,
): ArmyListEntry[] {
  const slugByName = new Map(parentUnits.map((unit) => [unit.name.toLowerCase(), unit.slug]))

  return entries.map((entry) => {
    if (entry.unitStatus === 'matched') return entry

    const matchedUnitSlug = slugByName.get(entry.unitName.toLowerCase()) ?? null
    if (!matchedUnitSlug) return entry

    return { ...entry, matchedUnitSlug, matchedFactionSlug: parentFactionSlug, unitStatus: 'matched' as MatchStatus }
  })
}

/**
 * Resolves wargear tokens by case-insensitive exact match against known wargear names.
 * `knownNames: null` means the unit has no `unitData` to check against — every token is unverified.
 */
export function matchWargearTokens(tokenNames: string[], knownNames: string[] | null): ArmyListWargearToken[] {
  if (knownNames === null) {
    return tokenNames.map((name) => ({ name, status: 'unverified' }))
  }
  const known = new Set(knownNames.map((name) => name.toLowerCase()))
  return tokenNames.map((name) => ({
    name,
    status: known.has(name.toLowerCase()) ? 'matched' : 'unmatched',
  }))
}

/** Parses pasted list text and validates it against the catalogue already stored in IndexedDB. */
export async function parseAndValidateArmyList(text: string): Promise<ArmyList> {
  const parsed = parseArmyListText(text)

  const factions = await getAllFactions()
  const faction = parsed.factionName
    ? factions.find((candidate) => candidate.name.toLowerCase() === parsed.factionName?.toLowerCase())
    : undefined
  const factionSlug = faction?.slug ?? null

  const knownUnits = factionSlug ? await getUnitsByFaction(factionSlug) : []
  let matchedEntries = matchUnitNames(parsed.entries, knownUnits, factionSlug)

  const parentFactionSlug = factionSlug ? resolveParentFactionSlug(factionSlug, factions) : null
  if (parentFactionSlug && matchedEntries.some((entry) => entry.unitStatus === 'unmatched')) {
    const parentUnits = await getUnitsByFaction(parentFactionSlug)
    matchedEntries = applyParentFallback(matchedEntries, parentUnits, parentFactionSlug)
  }

  const entries: ArmyListEntry[] = await Promise.all(
    matchedEntries.map(async (entry) => {
      const tokenNames = tokenizeWargearLine(entry.rawWargearText)
      let knownWargearNames: string[] | null = null

      if (entry.unitStatus === 'matched' && entry.matchedUnitSlug && entry.matchedFactionSlug) {
        const unitData = await getUnitData(entry.matchedFactionSlug, entry.matchedUnitSlug)
        if (unitData) {
          knownWargearNames = unitData.wargear.flatMap((entryData) => [
            entryData.wargearItem.name,
            ...entryData.wargearItem.profiles.map((profile) => profile.name),
          ])
        }
      }

      return { ...entry, wargearTokens: matchWargearTokens(tokenNames, knownWargearNames) }
    }),
  )

  return {
    id: crypto.randomUUID(),
    title: parsed.title,
    factionSlug,
    armyName: parsed.armyName,
    detachment: parsed.detachment,
    mission: parsed.mission,
    declaredPoints: parsed.declaredPoints,
    listUrl: parsed.listUrl,
    entries,
  }
}

/** Stores a parsed list, updating the existing stored list in place when its `listUrl` already matches one. */
export async function saveParsedList(list: ArmyList): Promise<ArmyList> {
  const uploadedAt = new Date().toISOString()

  if (list.listUrl) {
    const existing = await getListByUrl(list.listUrl)
    if (existing) {
      const updated: ArmyList = { ...list, id: existing.id, uploadedAt }
      await putList(updated)
      return updated
    }
  }
  const created: ArmyList = { ...list, uploadedAt }
  await putList(created)
  return created
}
