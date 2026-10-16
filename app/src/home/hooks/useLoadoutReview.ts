import { useEffect, useState } from 'react'
import { getLoadoutData, putLoadoutData } from '../../data/db'
import type { StructuredLoadoutData } from '../../data/schema'

export function useLoadoutReview(faction: { slug: string; name: string }, unitSlug: string) {
  const [loadoutData, setLoadoutData] = useState<StructuredLoadoutData | null>(null)
  const [loadoutDecisions, setLoadoutDecisions] = useState<Map<number, 'approved' | 'rejected'>>(new Map())
  const [savingLoadout, setSavingLoadout] = useState(false)
  const [resolvedLoadoutFaction, setResolvedLoadoutFaction] = useState(faction.slug)

  useEffect(() => {
    const load = async () => {
      const loadoutResult = await getLoadoutData(faction.slug, unitSlug)
      if (loadoutResult) {
        setLoadoutData(loadoutResult.data)
        setResolvedLoadoutFaction(loadoutResult.resolvedFaction)
        if (loadoutResult.data.tag === 'CONFIRMED') {
          const decisions = new Map<number, 'approved' | 'rejected'>()
          loadoutResult.data.options.forEach((_, i) => decisions.set(i, 'approved'))
          setLoadoutDecisions(decisions)
        }
      }
    }
    void load()
  }, [faction.slug, unitSlug])

  const setLoadoutDecision = (index: number, value: 'approved' | 'rejected') => {
    setLoadoutDecisions(prev => {
      const next = new Map(prev)
      const current = next.get(index)
      if (current === value) next.delete(index)
      else next.set(index, value)
      return next
    })
  }

  const allLoadoutDecided = loadoutData != null && loadoutData.options.length > 0 && loadoutDecisions.size === loadoutData.options.length

  const saveLoadout = async () => {
    if (!loadoutData || !allLoadoutDecided) return
    setSavingLoadout(true)
    try {
      const approvedOptions = loadoutData.options.filter((_, i) => loadoutDecisions.get(i) === 'approved')
      const confirmed: StructuredLoadoutData = {
        tag: 'CONFIRMED',
        options: approvedOptions,
      }
      await putLoadoutData(resolvedLoadoutFaction, unitSlug, confirmed)
      setLoadoutData(confirmed)
      const decisions = new Map<number, 'approved' | 'rejected'>()
      confirmed.options.forEach((_, i) => decisions.set(i, 'approved'))
      setLoadoutDecisions(decisions)
    } finally {
      setSavingLoadout(false)
    }
  }

  return {
    loadoutData,
    loadoutDecisions,
    setLoadoutDecision,
    allLoadoutDecided,
    saveLoadout,
    savingLoadout,
  }
}
