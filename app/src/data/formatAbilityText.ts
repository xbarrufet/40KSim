const KNOWN_TAGS = ['b', 'u', 'i', 'k', 'ul', 'li'] as const
type KnownTag = (typeof KNOWN_TAGS)[number]
const KNOWN_TAGS_SET: Set<string> = new Set(KNOWN_TAGS)

export type FormattedNode = { type: 'text'; text: string } | { type: 'break' } | { type: KnownTag; children: FormattedNode[] }

export interface FormattedParagraph {
  nodes: FormattedNode[]
}

interface OpenElement {
  type: KnownTag
  children: FormattedNode[]
}

const TAG_RE = /<\/?([a-zA-Z]+)>/g
/** Stray bell character left behind by the scraper; stripped via split/join rather than a regex
 * literal to avoid matching a raw control character in a regular expression. */
const BELL_CHARACTER = String.fromCharCode(7)
/** Source strings are double-escaped: a real newline became `\n` (backslash+n), two literal
 * characters, not a 0x0A byte. `\\n` below is a JS string/regex literal for that 2-char sequence. */
const LINE_BREAK_RE = /\\n|\\r/
const PARAGRAPH_BREAK = '\\n\\n'

/**
 * Parses the small set of inline tags (b/u/i/k/ul/li) and literal \n/\r escape sequences found in
 * BaseData-sourced ability/unit-composition text into a paragraph/node tree, tolerating the
 * malformed source data already confirmed to exist (an unclosed <ul>, a <b> opened twice instead
 * of closed) by closing any still-open tag at the end of a paragraph or the input. Any tag outside
 * the known vocabulary is left as literal visible text rather than interpreted as markup.
 */
export function parseAbilityText(raw: string): FormattedParagraph[] {
  const text = raw.split(BELL_CHARACTER).join('')

  const paragraphs: FormattedParagraph[] = []
  let root: FormattedNode[] = []
  const stack: OpenElement[] = []

  const currentChildren = (): FormattedNode[] => (stack.length > 0 ? stack[stack.length - 1].children : root)

  const pushText = (chunk: string) => {
    if (chunk.length === 0) return
    currentChildren().push({ type: 'text', text: chunk })
  }

  const closeAllOpen = () => {
    while (stack.length > 0) {
      const el = stack.pop() as OpenElement
      const parent = stack.length > 0 ? stack[stack.length - 1].children : root
      parent.push({ type: el.type, children: el.children })
    }
  }

  const endParagraph = () => {
    closeAllOpen()
    paragraphs.push({ nodes: root })
    root = []
  }

  const emitTextWithBreaks = (chunk: string) => {
    const parts = chunk.split(PARAGRAPH_BREAK)
    parts.forEach((part, i) => {
      if (i > 0) endParagraph()
      const lines = part.split(LINE_BREAK_RE)
      lines.forEach((line, j) => {
        if (j > 0) currentChildren().push({ type: 'break' })
        pushText(line)
      })
    })
  }

  const openTag = (name: KnownTag) => {
    // A tag opened again while the same type is already open (the confirmed doubled-<b> case) is
    // treated as "close the previous one, open a new one" rather than nesting it.
    if (stack.length > 0 && stack[stack.length - 1].type === name) {
      const el = stack.pop() as OpenElement
      const parent = stack.length > 0 ? stack[stack.length - 1].children : root
      parent.push({ type: el.type, children: el.children })
    }
    stack.push({ type: name, children: [] })
  }

  const closeTag = (name: KnownTag) => {
    const idx = stack.map((el) => el.type).lastIndexOf(name)
    if (idx === -1) return
    while (stack.length > idx) {
      const el = stack.pop() as OpenElement
      const parent = stack.length > 0 ? stack[stack.length - 1].children : root
      parent.push({ type: el.type, children: el.children })
    }
  }

  let lastIndex = 0
  TAG_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = TAG_RE.exec(text)) !== null) {
    emitTextWithBreaks(text.slice(lastIndex, match.index))
    lastIndex = TAG_RE.lastIndex

    const [full, tagName] = match
    const lower = tagName.toLowerCase()
    if (KNOWN_TAGS_SET.has(lower)) {
      if (full.startsWith('</')) closeTag(lower as KnownTag)
      else openTag(lower as KnownTag)
    } else {
      // Unknown tag: not interpreted as markup, kept as literal visible text.
      pushText(full)
    }
  }
  emitTextWithBreaks(text.slice(lastIndex))

  endParagraph()
  return paragraphs
}
