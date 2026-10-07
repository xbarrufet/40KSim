import { describe, expect, it } from 'vitest'
import { parseAbilityText, type FormattedNode } from './formatAbilityText'

function flatText(nodes: FormattedNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'text') return node.text
      if (node.type === 'break') return '\n'
      return flatText(node.children)
    })
    .join('')
}

function findAll(nodes: FormattedNode[], type: FormattedNode['type']): FormattedNode[] {
  const found: FormattedNode[] = []
  for (const node of nodes) {
    if (node.type === type) found.push(node)
    if (node.type !== 'text' && node.type !== 'break') found.push(...findAll(node.children, type))
  }
  return found
}

describe('parseAbilityText', () => {
  it('parses a bold tag into a single bold node', () => {
    const [paragraph] = parseAbilityText('<b>leader</b>')
    expect(paragraph.nodes).toEqual([{ type: 'b', children: [{ type: 'text', text: 'leader' }] }])
  })

  it('parses underline and italic tags', () => {
    const [paragraph] = parseAbilityText('<u>all</u> and <i>text</i>')
    const bold = findAll(paragraph.nodes, 'u')
    const italic = findAll(paragraph.nodes, 'i')
    expect(flatText(bold)).toBe('all')
    expect(flatText(italic)).toBe('text')
  })

  it('renders <k> as its own distinct node type, separate from <b>', () => {
    const [paragraph] = parseAbilityText('This unit’s attacks have <k>[Lethal Hits:</k> <b>non-</b><k>Vehicle]</k>.')
    const keywordNodes = findAll(paragraph.nodes, 'k')
    const boldNodes = findAll(paragraph.nodes, 'b')
    expect(flatText(keywordNodes)).toBe('[Lethal Hits:Vehicle]')
    expect(flatText(boldNodes)).toBe('non-')
    expect(flatText(paragraph.nodes)).toBe('This unit’s attacks have [Lethal Hits: non-Vehicle].')
  })

  it('nests <li> items inside a well-formed <ul>', () => {
    const [paragraph] = parseAbilityText('<ul><li>First item</li><li>Second item</li></ul>')
    const [ul] = paragraph.nodes
    expect(ul.type).toBe('ul')
    if (ul.type !== 'ul') throw new Error('expected ul node')
    expect(ul.children.map((li) => flatText([li]))).toEqual(['First item', 'Second item'])
  })

  it('still renders both items when the <ul> is never closed', () => {
    const [paragraph] = parseAbilityText('<ul><li>One</li><li>Two')
    const items = findAll(paragraph.nodes, 'li')
    expect(items.map((li) => flatText([li]))).toEqual(['One', 'Two'])
  })

  it('still renders the content when <b> is opened twice instead of closed', () => {
    expect(() => parseAbilityText('<b>Deep Strike<b>.')).not.toThrow()
    const [paragraph] = parseAbilityText('<b>Deep Strike<b>.')
    expect(flatText(paragraph.nodes)).toBe('Deep Strike.')
    const boldNodes = findAll(paragraph.nodes, 'b')
    expect(flatText(boldNodes)).toBe('Deep Strike.')
  })

  it('splits a double newline escape into two paragraphs', () => {
    const paragraphs = parseAbilityText('First.\\n\\nSecond.')
    expect(paragraphs).toHaveLength(2)
    expect(flatText(paragraphs[0].nodes)).toBe('First.')
    expect(flatText(paragraphs[1].nodes)).toBe('Second.')
  })

  it('renders a single newline escape as a line break within one paragraph', () => {
    const paragraphs = parseAbilityText('First.\\nSecond.')
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].nodes.some((node) => node.type === 'break')).toBe(true)
    expect(flatText(paragraphs[0].nodes)).toBe('First.\nSecond.')
  })

  it('renders a carriage-return escape as a line break too', () => {
    const paragraphs = parseAbilityText('<ul><li>1 model</li></ul>\\r This model is equipped with X.')
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].nodes.some((node) => node.type === 'break')).toBe(true)
  })

  it('strips the stray bell control character scraping artifact', () => {
    const [paragraph] = parseAbilityText('That unit is <b>unengaged</b>.\u0007 Next sentence.')
    expect(flatText(paragraph.nodes)).not.toContain('\u0007')
    expect(flatText(paragraph.nodes)).toBe('That unit is unengaged. Next sentence.')
  })

  it('leaves an unknown tag as literal visible text, not a recognized node type', () => {
    const [paragraph] = parseAbilityText('<script>x</script>')
    expect(findAll(paragraph.nodes, 'b')).toHaveLength(0)
    expect(flatText(paragraph.nodes)).toBe('<script>x</script>')
  })
})
