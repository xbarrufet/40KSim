import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { fetchDetachmentData, upsertDetachmentData } from '../data/supabase'
import type {
  Effect,
  StructuredEnhancement,
} from '../data/schema'
import { FormattedAbilityText } from './FormattedAbilityText'
import { CategorySelect, EffectFields, defaultEffectForCategory } from './EffectEditor'
import styles from './DetachmentDetailView.module.css'

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
        data: rawData as unknown as Record<string, unknown>,
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
        {ownerFactionSlug !== faction.slug && <span className={styles.inherited}>heredado</span>}
        <span className={styles.cpLabel}>{rawData.pointsCost ?? 0} CP</span>
      </div>

      {error && <p className="board-alert">{error}</p>}

      {/* Detachment Rule */}
      <div className={styles.content}>
        <h2 className="unit-cat-header">REGLA DE DETACHMENT</h2>
        {rules.map((rule) => (
          <div key={rule.id} className={styles.ruleBlock}>
            <h3 className={styles.ruleTitle}>{rule.name}</h3>
            {rule.components
              .filter((c) => c.type === 'text' && c.textContent)
              .map((c, i) => (
                <div key={i} className={styles.abilityTextBlock}>
                  <FormattedAbilityText text={c.textContent!} />
                </div>
              ))}
          </div>
        ))}

        {/* Stratagems */}
        <h2 className={`unit-cat-header ${styles.sectionGap}`}>STRATAGEMS ({stratagems.length})</h2>
        {stratagems.map((strat) => (
          <div key={strat.id} className={styles.stratagemBlock}>
            <div className={styles.stratagemHeader}>
              <strong className={styles.stratagemName}>{strat.name}</strong>
              <span className={styles.stratagemMeta}>{strat.cpCost} CP · {strat.phases.join(', ')}</span>
            </div>
            <div className={styles.stratagemBody}>
              <div><strong>When:</strong> <FormattedAbilityText text={strat.whenRules} /></div>
              <div><strong>Target:</strong> <FormattedAbilityText text={strat.targetRules} /></div>
              <div><strong>Effect:</strong> <FormattedAbilityText text={strat.effectRules} /></div>
            </div>
          </div>
        ))}

        {/* Enhancements */}
        <h2 className={`unit-cat-header ${styles.sectionGap}`}>ENHANCEMENTS ({rawEnhancements.length})</h2>
        {rawEnhancements.map((rawEnh, rawIdx) => {
          const structured = enhancements?.[rawIdx] ?? null
          const isExpanded = expandedEnh === rawIdx

          return (
            <div key={rawEnh.id} className={styles.enhancementBlock}>
              <div
                className={styles.enhancementHeader}
                onClick={() => setExpandedEnh(isExpanded ? null : rawIdx)}
              >
                <strong className={styles.enhancementName}>{rawEnh.name}</strong>
                <span className={styles.enhancementMeta}>{rawEnh.points} pts · {rawEnh.enhancementType} · limit {rawEnh.limit}</span>
                <span className={styles.enhancementToggle}>{isExpanded ? '▼' : '▶'}</span>
              </div>

              {/* Raw text always visible */}
              <div className={styles.enhancementRawText}>
                <FormattedAbilityText text={rawEnh.rules} />
              </div>

              {isExpanded && structured && (
                <div className={styles.enhancementStructured}>
                  <div className={styles.eligibility}>
                    Eligibilidad: {structured.eligibility.keywords.length > 0 ? structured.eligibility.keywords.join(', ') : 'Cualquiera'}
                    {structured.eligibility.excludedKeywords.length > 0 && ` (excluye: ${structured.eligibility.excludedKeywords.join(', ')})`}
                  </div>

                  {/* Base effects */}
                  <div>
                    <strong className={styles.effectsLabel}>Efectos base:</strong>
                    {structured.effects.map((effect, effIdx) => (
                      <div key={effIdx} className={styles.effectRowInline}>
                        <CategorySelect compact value={effect.category} onChange={(cat) => updateEffect(rawIdx, effIdx, defaultEffectForCategory(cat))} />
                        <EffectFields effect={effect} onChange={(e) => updateEffect(rawIdx, effIdx, e)} compact />
                        <button type="button" className={styles.removeEffectBtn} onClick={() => removeEffect(rawIdx, effIdx)}>×</button>
                      </div>
                    ))}
                    <button type="button" className={styles.addEffectBtn} onClick={() => addEffect(rawIdx)}>+ Efecto</button>
                  </div>

                </div>
              )}

              {isExpanded && !structured && (
                <p className={styles.noStructured}>
                  Sin datos estructurados. Ejecuta <code>auto_structure_enhancements.py</code> y vuelve a subir.
                </p>
              )}
            </div>
          )
        })}

        {/* Save button */}
        <div className={styles.saveBar}>
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


