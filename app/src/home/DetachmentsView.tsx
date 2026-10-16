import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { fetchDetachmentsByFaction } from '../data/supabase'
import { getParentFaction } from '../data/factions'
import { DetachmentDetailView } from './DetachmentDetailView'
import styles from './DetachmentsView.module.css'

interface DetachmentsViewProps {
  faction: { slug: string; name: string }
  onBack?: () => void
  inline?: boolean
}

interface DetachmentRow {
  detachmentSlug: string
  ownerFactionSlug: string
  name: string
  pointsCost: number
  enhancementCount: number
  stratagemCount: number
  tag: string
  inherited: boolean
}

function toRow(r: { detachment_slug: string; faction_slug: string; data: unknown; tag: string }, inherited: boolean): DetachmentRow {
  const data = r.data as Record<string, unknown> | null
  return {
    detachmentSlug: r.detachment_slug,
    ownerFactionSlug: r.faction_slug,
    name: (data?.name as string) ?? r.detachment_slug,
    pointsCost: (data?.pointsCost as number) ?? 0,
    enhancementCount: Array.isArray(data?.enhancements) ? (data.enhancements as unknown[]).length : 0,
    stratagemCount: Array.isArray(data?.stratagems) ? (data.stratagems as unknown[]).length : 0,
    tag: r.tag,
    inherited,
  }
}

export function DetachmentsView({ faction, onBack, inline }: DetachmentsViewProps) {
  const [detachments, setDetachments] = useState<DetachmentRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedDetachment, setSelectedDetachment] = useState<{ slug: string; ownerFaction: string } | null>(null)

  const loadDetachments = useCallback(async () => {
    try {
      const ownRows = await fetchDetachmentsByFaction(faction.slug)
      const ownDetachments = ownRows.map((r) => toRow(r, false))

      const parent = getParentFaction(faction.slug)
      let parentDetachments: DetachmentRow[] = []
      if (parent) {
        const parentRows = await fetchDetachmentsByFaction(parent)
        const ownSlugs = new Set(ownDetachments.map((d) => d.detachmentSlug))
        parentDetachments = parentRows
          .filter((r) => !ownSlugs.has(r.detachment_slug))
          .map((r) => toRow(r, true))
      }

      const all = [...parentDetachments, ...ownDetachments].sort((a, b) => a.name.localeCompare(b.name))
      setDetachments(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar detachments')
    }
  }, [faction.slug])

  useEffect(() => {
    loadDetachments()
  }, [loadDetachments])

  if (selectedDetachment) {
    return (
      <DetachmentDetailView
        faction={faction}
        ownerFactionSlug={selectedDetachment.ownerFaction}
        detachmentSlug={selectedDetachment.slug}
        onBack={() => setSelectedDetachment(null)}
        onSaved={() => {
          setSelectedDetachment(null)
          loadDetachments()
        }}
      />
    )
  }

  const tagColor = (tag: string) => {
    switch (tag) {
      case 'CONFIRMED': return 'green'
      case 'AI_PROPOSED': return 'amber'
      default: return 'red'
    }
  }

  const Wrapper = inline ? 'div' : 'section'

  return (
    <Wrapper className={inline ? undefined : 'workspace'}>
      {!inline && onBack && (
        <div className="unit-board-topbar">
          <button type="button" className="back-link" onClick={onBack}>
            <ArrowLeft size={14} /> {faction.name}
          </button>
          <h1>Detachments</h1>
        </div>
      )}

      {error && <p className="board-alert">{error}</p>}

      {detachments && detachments.length === 0 && (
        <p className={styles.emptyMessage}>
          No hay datos de detachments para esta facción. Ejecuta <code>fetch_faction_data.py</code> y <code>seed_supabase.py</code>.
        </p>
      )}

      {detachments && detachments.length > 0 && (
        <div className={styles.content}>
          {detachments.map((det) => (
            <div key={det.detachmentSlug} className="unit-row">
              <button
                type="button"
                className="unit-row-name unit-link"
                onClick={() => setSelectedDetachment({ slug: det.detachmentSlug, ownerFaction: det.ownerFactionSlug })}
              >
                {det.name}
              </button>
              {det.inherited && <span className={styles.inherited}>heredado</span>}
              <span className={`status-light is-${tagColor(det.tag)}`} aria-hidden="true" />
              <span className="unit-row-spacer" />
              <span className={styles.detMeta}>
                {det.enhancementCount} enh / {det.stratagemCount} strat
              </span>
              <span className="unit-row-points">{det.pointsCost} CP</span>
            </div>
          ))}
        </div>
      )}
    </Wrapper>
  )
}
