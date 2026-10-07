import { Fragment, type ReactNode } from 'react'
import { parseAbilityText, type FormattedNode } from '../data/formatAbilityText'

interface FormattedAbilityTextProps {
  text: string
}

/** Renders BaseData-sourced ability/composition text, parsing its small set of inline tags
 * (b/u/i/k/ul/li) and \n/\r escape sequences into real formatting instead of literal text. */
export function FormattedAbilityText({ text }: FormattedAbilityTextProps) {
  const paragraphs = parseAbilityText(text)
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <Fragment key={index}>{renderParagraph(paragraph.nodes, index)}</Fragment>
      ))}
    </>
  )
}

/** A `<ul>` is block-level and can't be nested inside a `<p>` (invalid HTML, React warns). Each
 * paragraph's top-level nodes are grouped into runs of inline content (wrapped in a `<p>`) and
 * runs of `<ul>` blocks (rendered directly, not wrapped), rather than wrapping everything in one `<p>`. */
function renderParagraph(nodes: FormattedNode[], keyPrefix: number): ReactNode {
  const groups: { block: boolean; nodes: FormattedNode[] }[] = []
  for (const node of nodes) {
    const isBlock = node.type === 'ul'
    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup.block === isBlock) lastGroup.nodes.push(node)
    else groups.push({ block: isBlock, nodes: [node] })
  }
  return groups.map((group, index) =>
    group.block ? (
      <Fragment key={`${keyPrefix}-${index}`}>{renderNodes(group.nodes)}</Fragment>
    ) : (
      <p key={`${keyPrefix}-${index}`}>{renderNodes(group.nodes)}</p>
    ),
  )
}

function renderNodes(nodes: FormattedNode[]): ReactNode {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.type === 'text') return node.text
        if (node.type === 'break') return <br key={index} />
        if (node.type === 'b') return <strong key={index}>{renderNodes(node.children)}</strong>
        if (node.type === 'u') return <u key={index}>{renderNodes(node.children)}</u>
        if (node.type === 'i') return <em key={index}>{renderNodes(node.children)}</em>
        if (node.type === 'k') return <span key={index} className="ability-keyword">{renderNodes(node.children)}</span>
        if (node.type === 'ul') return <ul key={index}>{renderNodes(node.children)}</ul>
        return <li key={index}>{renderNodes(node.children)}</li>
      })}
    </>
  )
}
