import { useState } from 'react'
import type { Effect, OtherAbility } from '../../data/schema'
import { buildOtherAbility, buildStructuredAbilities, type StructuringRow } from '../processUnitLogic'
import { defaultEffectForCategory } from '../EffectEditor'
import type { Draft } from './useProcessUnitData'

export function useStructuringForm(
  draft: Draft | null,
  setDraft: React.Dispatch<React.SetStateAction<Draft | null>>,
  baseDataAbilitiesMap: Record<string, string>,
) {
  const [structuringIndex, setStructuringIndex] = useState<number | null>(null)
  const [structuringRows, setStructuringRows] = useState<StructuringRow[]>([])
  const [editingAbilityIndex, setEditingAbilityIndex] = useState<number | null>(null)
  const [editingAbilityText, setEditingAbilityText] = useState<string | null>(null)
  const [editingOtherIndex, setEditingOtherIndex] = useState<number | null>(null)
  const [editingOtherText, setEditingOtherText] = useState<string>('')

  const startStructuring = (index: number) => {
    if (!draft) return
    const raw = draft.rawAbilities[index]
    setStructuringIndex(index)
    setStructuringRows([
      { name: raw.name, phase: 'ANY', trigger: 'ALWAYS', effects: [defaultEffectForCategory('statModifier')] },
    ])
  }

  const cancelStructuring = () => {
    setStructuringIndex(null)
    setEditingAbilityIndex(null)
    setStructuringRows([])
    setEditingAbilityText(null)
  }

  const startEditingOther = (index: number) => {
    if (!draft) return
    const ability = draft.abilities[index]
    if (!('category' in ability) || ability.category !== 'OTHER') return
    setEditingOtherIndex(index)
    setEditingOtherText(ability.text)
  }

  const cancelEditingOther = () => {
    setEditingOtherIndex(null)
    setEditingOtherText('')
  }

  const saveOther = () => {
    if (editingOtherIndex === null || !draft) return
    const ability = draft.abilities[editingOtherIndex] as OtherAbility
    setDraft((current) => {
      if (!current) return current
      const updated = [...current.abilities]
      updated[editingOtherIndex] = { ...ability, text: editingOtherText }
      return { ...current, abilities: updated }
    })
    cancelEditingOther()
  }

  const structureFromOther = () => {
    if (editingOtherIndex === null || !draft) return
    const ability = draft.abilities[editingOtherIndex] as OtherAbility
    setEditingAbilityIndex(editingOtherIndex)
    setEditingAbilityText(editingOtherText)
    setStructuringRows([{ name: ability.name, phase: 'ANY', trigger: 'ALWAYS', effects: [defaultEffectForCategory('statModifier')] }])
    cancelEditingOther()
  }

  const startEditing = (index: number) => {
    if (!draft) return
    const ability = draft.abilities[index]
    if (!('effects' in ability)) return
    setEditingAbilityIndex(index)
    const baseName = ability.name.replace(/\s+\(efecto \d+\)$/, '')
    const baseDataText = baseDataAbilitiesMap[ability.name]
      ?? baseDataAbilitiesMap[baseName]
      ?? Object.entries(baseDataAbilitiesMap).find(([k]) => k.toLowerCase() === baseName.toLowerCase())?.[1]
    setEditingAbilityText(
      ability.originalText ??
      baseDataText ??
      (draft.rawAbilities.find((r) => r.name === baseName || r.name === ability.name)?.text ?? null)
    )
    setStructuringRows([{ name: ability.name, phase: ability.phase, trigger: ability.trigger, autoApply: ability.autoApply, frequency: ability.frequency, groupId: ability.groupId, groupOperator: ability.groupOperator, effectsOperator: ability.effectsOperator, effects: [...ability.effects] }])
  }

  const commitEdit = () => {
    if (editingAbilityIndex === null || !draft) return
    const existingAbility = draft.abilities[editingAbilityIndex]
    const newAbilities = buildStructuredAbilities(structuringRows)
    newAbilities[0].originalText =
      ('originalText' in existingAbility ? existingAbility.originalText : undefined) ??
      editingAbilityText ??
      undefined
    setDraft((current) => {
      if (!current) return current
      const updated = [...current.abilities]
      updated.splice(editingAbilityIndex, 1, ...newAbilities)
      return { ...current, abilities: updated }
    })
    cancelStructuring()
  }

  const markEditingAbilityAsOther = () => {
    if (editingAbilityIndex === null || !draft) return
    const ability = draft.abilities[editingAbilityIndex]
    const otherAbility: OtherAbility = {
      name: ability.name,
      category: 'OTHER',
      text: editingAbilityText ?? '',
    }
    setDraft((current) => {
      if (!current) return current
      const updated = [...current.abilities]
      updated.splice(editingAbilityIndex, 1, otherAbility)
      return { ...current, abilities: updated }
    })
    cancelStructuring()
  }

  const addStructuringRow = () => {
    if (!draft) return
    const baseName =
      structuringIndex !== null
        ? draft.rawAbilities[structuringIndex].name
        : structuringRows[0]?.name ?? ''
    setStructuringRows((rows) => [
      ...rows,
      { name: `${baseName} (efecto ${rows.length + 1})`, phase: 'ANY', trigger: 'ALWAYS', effects: [defaultEffectForCategory('statModifier')] },
    ])
  }

  const updateStructuringRow = (rowIndex: number, patch: Partial<StructuringRow>) => {
    setStructuringRows((rows) => rows.map((row, i) => (i === rowIndex ? { ...row, ...patch } : row)))
  }

  const addEffectToRow = (rowIndex: number) => {
    setStructuringRows((rows) =>
      rows.map((row, i) => i === rowIndex ? { ...row, effects: [...row.effects, defaultEffectForCategory('statModifier')] } : row)
    )
  }

  const removeEffectFromRow = (rowIndex: number, effectIndex: number) => {
    setStructuringRows((rows) =>
      rows.map((row, i) => {
        if (i !== rowIndex) return row
        const effects = row.effects.filter((_, ei) => ei !== effectIndex)
        return { ...row, effects, effectsOperator: effects.length < 2 ? undefined : row.effectsOperator }
      })
    )
  }

  const updateEffectInRow = (rowIndex: number, effectIndex: number, effect: Effect) => {
    setStructuringRows((rows) =>
      rows.map((row, i) => i === rowIndex ? { ...row, effects: row.effects.map((e, ei) => ei === effectIndex ? effect : e) } : row)
    )
  }

  const commitStructuring = () => {
    if (structuringIndex === null || !draft) return
    const newAbilities = buildStructuredAbilities(structuringRows)
    newAbilities[0].originalText = draft.rawAbilities[structuringIndex]?.text
    setDraft((current) => {
      if (!current) return current
      return {
        ...current,
        abilities: [...current.abilities, ...newAbilities],
        rawAbilities: current.rawAbilities.filter((_, i) => i !== structuringIndex),
      }
    })
    cancelStructuring()
  }

  const markAsOther = (index: number) => {
    if (!draft) return
    const raw = draft.rawAbilities[index]
    const otherAbility = buildOtherAbility(raw)
    setDraft((current) => {
      if (!current) return current
      return {
        ...current,
        abilities: [...current.abilities, otherAbility],
        rawAbilities: current.rawAbilities.filter((_, i) => i !== index),
      }
    })
  }

  const removeReviewedAbility = (index: number) => {
    setDraft((current) => {
      if (!current) return current
      return { ...current, abilities: current.abilities.filter((_, i) => i !== index) }
    })
  }

  return {
    structuringIndex,
    structuringRows,
    editingAbilityIndex,
    editingAbilityText,
    editingOtherIndex,
    editingOtherText,
    setEditingOtherText,
    startStructuring,
    cancelStructuring,
    commitStructuring,
    startEditing,
    commitEdit,
    startEditingOther,
    cancelEditingOther,
    saveOther,
    structureFromOther,
    markAsOther,
    markEditingAbilityAsOther,
    removeReviewedAbility,
    addStructuringRow,
    updateStructuringRow,
    addEffectToRow,
    removeEffectFromRow,
    updateEffectInRow,
  }
}
