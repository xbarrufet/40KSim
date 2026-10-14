import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { fetchDetachmentData, upsertDetachmentData } from '../data/supabase'
import type {
  Effect,
  StructuredEnhancement,
} from '../data/schema'
import { FormattedAbilityText } from './FormattedAbilityText'
import { CategorySelect, EffectFields, defaultEffectForCategory } from './EffectEditor'

interface DetachmentDetailViewProps {
  faction: { slug: string; name: string }
  ownerFactionSlug: string
  detachmentSlug: string
  onBack: () => void
  onSaved: () => void
}

interface RawDetachment {
  name?: string
  slug?: string
  pointsCost?: number
  rules?: { id: number; name: string; components: { type: string; textContent?: string }[] }[]
  enhancements?: RawEnhancement[]
  stratagems?: RawStratagem[]
  forceDispositions?: string[]
}

interface RawEnhancement {
  id: number
  name: string
  points: number
  rules: string
  enhancementType: string
  limit: number
  isEquipableByNonCharacterUnit: boolean
  isEquipableByEpicHero: boolean
  excludedKeywords: string[]
  keywordGroups: { datasheetId: number | null; keywords: string[] }[]
}

interface RawStratagem {
  id: number
  name: string
  cpCost: number
  turn: string
  phases: string[]
  whenRules: string
  targetRules: string
  effectRules: string
}


export function DetachmentDetailView({ faction, ownerFactionSlug, detachmentSlug, onBack, onSaved }: DetachmentDetailViewProps) {
  const [rawData, setRawData] = useState<RawDetachment | null>(null)
  const [tag, setTag] = useState<string>('SCRAPED')
  const [enhancements, setEnhancements] = useState<StructuredEnhancement[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedEnh, setExpandedEnh] = useState<number | null>(null)

  useEffect(() => {
    fetchDetachmentData(ownerFactionSlug, detachmentSlug)
      .then((row) => {
        if (!row) {
          setError('Detachment no encontrado')
          return
        }
        setRawData(row.data as RawDetachment)
        setTag(row.tag)
        setEnhancements((row.enhancements as StructuredEnhancement[] | null) ?? null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
  }, [ownerFactionSlug, detachmentSlug])

  const handleSave = useCallback(async () => {
    if (!rawData) return
    setSaving(true)
    try {
      await upsertDetachmentData(ownerFactionSlug, detachmentSlug, {
        tag: 'CONFIRMED',
        data: rawData,
        enhancements,
      })
      setTag('CONFIRMED')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }, [ownerFactionSlug, detachmentSlug, rawData, enhancements, onSaved])

  const updateEnhancement = (index: number, updated: StructuredEnhancement) => {
    if (!enhancements) return
    const next = [...enhancements]
    next[index] = updated
    setEnhancements(next)
  }

  const updateEffect = (enhIndex: number, effectIndex: number, updated: Effect) => {
    if (!enhancements) return
    const enh = enhancements[enhIndex]
    const effects = [...enh.effects]
    effects[effectIndex] = updated
    updateEnhancement(enhIndex, { ...enh, effects })
  }

  const addEffect = (enhIndex: number) => {
    if (!enhancements) return
    const enh = enhancements[enhIndex]
    updateEnhancement(enhIndex, { ...enh, effects: [...enh.effects, defaultEffectForCategory('statModifier')] })
  }

  const removeEffect = (enhIndex: number, effectIndex: number) => {
    if (!enhancements) return
    const enh = enhancements[enhIndex]
    updateEnhancement(enhIndex, { ...enh, effects: enh.effects.filter((_, i) => i !== effectIndex) })
  }


  if (!rawData) {
    return (
      <section className="workspace">
        <div className="unit-board-topbar">
          <button type="button" className="back-link" onClick={onBack}>
            <ArrowLeft size={14} /> Detachments
          </button>
        </div>
        {error ? <p className="board-alert">{error}</p> : <p>Cargando…</p>}
      </section>
    )
  }

  const detachmentName = rawData.name ?? detachmentSlug
  const rules = rawData.rules ?? []
  const stratagems = rawData.stratagems ?? []
  const rawEnhancements = rawData.enhancements ?? []

  return (
    <section className="workspace">
      <div className="unit-board-topbar">
        <button type="button" className="back-link" onClick={onBack}>
          <ArrowLeft size={14} /> Detachments
        </button>
        <h1>{detachmentName}</h1>
        <span className={`status-light is-${tag === 'CONFIRMED' ? 'green' : tag === 'AI_PROPOSED' ? 'amber' : 'red'}`} />
        {ownerFactionSlug !== faction.slug && <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>heredado</span>}
        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{rawData.pointsCost ?? 0} CP</span>
      </div>

      {error && <p className="board-alert">{error}</p>}

      {/* Detachment Rule */}
      <div style={{ padding: '0 1rem' }}>
        <h2 className="unit-cat-header">REGLA DE DETACHMENT</h2>
        {rules.map((rule) => (
          <div key={rule.id} style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{rule.name}</h3>
            {rule.components
              .filter((c) => c.type === 'text' && c.textContent)
              .map((c, i) => (
                <div key={i} className="ability-text-block">
                  <FormattedAbilityText text={c.textContent!} />
                </div>
              ))}
          </div>
        ))}

        {/* Stratagems */}
        <h2 className="unit-cat-header" style={{ marginTop: '1.5rem' }}>STRATAGEMS ({stratagems.length})</h2>
        {stratagems.map((strat) => (
          <div key={strat.id} style={{ marginBottom: '1rem', borderLeft: '3px solid var(--border)', paddingLeft: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', marginBottom: '0.25rem' }}>
              <strong style={{ fontSize: '0.85rem' }}>{strat.name}</strong>
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{strat.cpCost} CP · {strat.phases.join(', ')}</span>
            </div>
            <div style={{ fontSize: '0.8rem' }}>
              <div><strong>When:</strong> <FormattedAbilityText text={strat.whenRules} /></div>
              <div><strong>Target:</strong> <FormattedAbilityText text={strat.targetRules} /></div>
              <div><strong>Effect:</strong> <FormattedAbilityText text={strat.effectRules} /></div>
            </div>
          </div>
        ))}

        {/* Enhancements */}
        <h2 className="unit-cat-header" style={{ marginTop: '1.5rem' }}>ENHANCEMENTS ({rawEnhancements.length})</h2>
        {rawEnhancements.map((rawEnh, rawIdx) => {
          const structured = enhancements?.[rawIdx] ?? null
          const isExpanded = expandedEnh === rawIdx

          return (
            <div key={rawEnh.id} style={{ marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.75rem' }}>
              <div
                style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', cursor: 'pointer' }}
                onClick={() => setExpandedEnh(isExpanded ? null : rawIdx)}
              >
                <strong style={{ fontSize: '0.85rem' }}>{rawEnh.name}</strong>
                <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{rawEnh.points} pts · {rawEnh.enhancementType} · limit {rawEnh.limit}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>{isExpanded ? '▼' : '▶'}</span>
              </div>

              {/* Raw text always visible */}
              <div className="ability-text-block" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                <FormattedAbilityText text={rawEnh.rules} />
              </div>

              {isExpanded && structured && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.5rem' }}>
                    Eligibilidad: {structured.eligibility.keywords.length > 0 ? structured.eligibility.keywords.join(', ') : 'Cualquiera'}
                    {structured.eligibility.excludedKeywords.length > 0 && ` (excluye: ${structured.eligibility.excludedKeywords.join(', ')})`}
                  </div>

                  {/* Base effects */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.8rem' }}>Efectos base:</strong>
                    {structured.effects.map((effect, effIdx) => (
                      <div key={effIdx} className="structuring-effect-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                        <CategorySelect compact value={effect.category} onChange={(cat) => updateEffect(rawIdx, effIdx, defaultEffectForCategory(cat))} />
                        <EffectFields effect={effect} onChange={(e) => updateEffect(rawIdx, effIdx, e)} compact />
                        <button type="button" onClick={() => removeEffect(rawIdx, effIdx)} style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>×</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addEffect(rawIdx)} style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>+ Efecto</button>
                  </div>

                </div>
              )}

              {isExpanded && !structured && (
                <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem' }}>
                  Sin datos estructurados. Ejecuta <code>auto_structure_enhancements.py</code> y vuelve a subir.
                </p>
              )}
            </div>
          )
        })}

        {/* Save button */}
        <div style={{ marginTop: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="confirm-btn"
            disabled={saving || !enhancements}
            onClick={handleSave}
          >
            {saving ? 'Guardando…' : 'Confirmar detachment'}
          </button>
        </div>
      </div>
    </section>
  )
}


