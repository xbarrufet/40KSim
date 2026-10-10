export const DICE_NOTATION_REGEX = /^(?:[1-9]\d*|(?:[1-6])?D[36](?:\+[1-9]\d*)?)$/

export interface ParsedDiceNotation {
  count: number
  dice: 'D3' | 'D6' | null
  modifier: number
}

export function parseDiceNotation(s: string): ParsedDiceNotation | null {
  if (!DICE_NOTATION_REGEX.test(s)) return null
  const dIndex = s.indexOf('D')
  if (dIndex === -1) {
    return { count: 1, dice: null, modifier: Number(s) }
  }
  const count = dIndex > 0 ? Number(s.slice(0, dIndex)) : 1
  const plusIndex = s.indexOf('+', dIndex)
  const dice = (plusIndex === -1 ? s.slice(dIndex) : s.slice(dIndex, plusIndex)) as 'D3' | 'D6'
  const modifier = plusIndex === -1 ? 0 : Number(s.slice(plusIndex + 1))
  return { count, dice, modifier }
}

export function serializeDiceNotation(parsed: ParsedDiceNotation): string {
  if (!parsed.dice) return String(parsed.modifier)
  const countStr = parsed.count > 1 ? String(parsed.count) : ''
  const modStr = parsed.modifier > 0 ? `+${parsed.modifier}` : ''
  return `${countStr}${parsed.dice}${modStr}`
}

export function isValidDiceNotation(s: string): boolean {
  return DICE_NOTATION_REGEX.test(s)
}
