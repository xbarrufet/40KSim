import { useEffect, useState } from 'react'
import { fetchArmyRules } from '../data/supabase'
import { FormattedAbilityText } from './FormattedAbilityText'
import styles from './ArmyRulesView.module.css'

interface ArmyRulesViewProps {
  factionSlug: string
}

interface ArmyRule {
  id?: number
  name: string
  components: { type: string; textContent?: string }[]
}

export function ArmyRulesView({ factionSlug }: ArmyRulesViewProps) {
  const [rules, setRules] = useState<ArmyRule[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchArmyRules(factionSlug)
      .then((data) => setRules((data as ArmyRule[] | null) ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar army rules'))
  }, [factionSlug])

  if (error) return <p className="board-alert">{error}</p>
  if (!rules) return <p className={styles.loading}>Cargando…</p>
  if (rules.length === 0) {
    return (
      <p className={styles.emptyMessage}>
        No hay army rules para esta facción. Ejecuta <code>fetch_faction_data.py</code> y <code>seed_supabase.py</code>.
      </p>
    )
  }

  return (
    <div className={styles.content}>
      {rules.map((rule, idx) => (
        <div key={rule.id ?? idx} className={styles.ruleBlock}>
          <h2 className="unit-cat-header">{rule.name.toUpperCase()}</h2>
          {rule.components
            .filter((c) => c.type === 'text' && c.textContent)
            .map((c, i) => (
              <div key={i} className={styles.abilityTextBlock}>
                <FormattedAbilityText text={c.textContent!} />
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}
