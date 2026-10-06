export const KNOWN_WEAPON_KEYWORDS = [
  'ANTI-FLY',
  'ANTI-VEHICLE',
  'ASSAULT',
  'BLAST',
  'CLEAVE',
  'CLOSE-QUARTERS',
  'DEVASTATING WOUNDS',
  'EXTRA ATTACKS',
  'HAZARDOUS',
  'HEAVY',
  'IGNORES COVER',
  'INDIRECT FIRE',
  'LETHAL HITS',
  'MELTA',
  'ONE SHOT',
  'PRECISION',
  'PSYCHIC',
  'RAPID FIRE',
  'SUSTAINED HITS',
  'TORRENT',
  'TWIN-LINKED',
] as const

export type KnownAttribute = (typeof KNOWN_WEAPON_KEYWORDS)[number]

const KNOWN_WEAPON_KEYWORDS_SET: Set<string> = new Set(KNOWN_WEAPON_KEYWORDS)

export interface ParsedWeaponAbilityName {
  name: string
  value: string | null
  known: boolean
}

export function parseWeaponAbilityName(rawName: string): ParsedWeaponAbilityName {
  let text = rawName.trim().toUpperCase()
  text = text.replace(/:\s*NON-MONSTER\/VEHICLE$/, '').trim()

  const plusMatch = text.match(/^(.*?)\s+(\d+)\+$/)
  if (plusMatch) {
    return { name: plusMatch[1].trim(), value: `${plusMatch[2]}+`, known: KNOWN_WEAPON_KEYWORDS_SET.has(plusMatch[1].trim()) }
  }

  const numMatch = text.match(/^(.*?)\s+(\d+)$/)
  if (numMatch) {
    return { name: numMatch[1].trim(), value: numMatch[2], known: KNOWN_WEAPON_KEYWORDS_SET.has(numMatch[1].trim()) }
  }

  return { name: text, value: null, known: KNOWN_WEAPON_KEYWORDS_SET.has(text) }
}
