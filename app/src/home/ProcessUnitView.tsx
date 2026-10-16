import { RefreshCw } from 'lucide-react'
import { UnitDatasheet } from './UnitDatasheet'
import { TopBar } from './TopBar'
import { LoadoutSection } from './LoadoutSection'
import { ReviewedAbilitiesTable } from './ReviewedAbilitiesTable'
import { RawAbilitiesList } from './RawAbilitiesList'
import { useProcessUnitData } from './hooks/useProcessUnitData'
import { useStructuringForm } from './hooks/useStructuringForm'
import { useLoadoutReview } from './hooks/useLoadoutReview'
import styles from './ProcessUnitView.module.css'

interface ProcessUnitViewProps {
  faction: { slug: string; name: string }
  unitSlug: string
  onBack: () => void
  onSaved: () => void
}

export function ProcessUnitView({ faction, unitSlug, onBack, onSaved }: ProcessUnitViewProps) {
  const data = useProcessUnitData(faction, unitSlug, onSaved)
  const structuring = useStructuringForm(data.draft, data.setDraft, data.baseDataAbilitiesMap)
  const loadout = useLoadoutReview(faction, unitSlug)

  if (data.error) {
    return (
      <section className="workspace">
        <TopBar name={unitSlug} onBack={onBack} />
        <p className="board-alert">{data.error}</p>
      </section>
    )
  }

  if (!data.structuredAbilitiesData || !data.draft) {
    return (
      <section className="workspace">
        <TopBar name={unitSlug} onBack={onBack} />
        <p>Cargando…</p>
      </section>
    )
  }

  return (
    <section className="workspace">
      <TopBar name={data.unitName} onBack={onBack} tag={data.structuredAbilitiesData.tag} />

      {data.baseDataChanged && (
        <div className={styles.basedataChangedBanner}>
          El BaseData de esta unidad ha cambiado desde la última confirmación.
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.resyncBtn} onClick={data.resync}>
          <RefreshCw size={14} /> Re-sincronizar desde BaseData
        </button>
        {data.baseDataChanged && (
          <button type="button" className={styles.resyncBtn} onClick={data.resyncNoChanges}>
            Re-sincronizar sin cambios
          </button>
        )}
      </div>

      <UnitDatasheet datasheet={data.datasheet} wargear={data.wargear} keywords={data.keywords} />

      <ReviewedAbilitiesTable
        abilities={data.draft.abilities}
        editingAbilityIndex={structuring.editingAbilityIndex}
        editingAbilityText={structuring.editingAbilityText}
        editingOtherIndex={structuring.editingOtherIndex}
        editingOtherText={structuring.editingOtherText}
        setEditingOtherText={structuring.setEditingOtherText}
        structuringRows={structuring.structuringRows}
        weaponNames={data.weaponNames}
        baseDataAbilitiesMap={data.baseDataAbilitiesMap}
        updateStructuringRow={structuring.updateStructuringRow}
        addStructuringRow={structuring.addStructuringRow}
        addEffectToRow={structuring.addEffectToRow}
        removeEffectFromRow={structuring.removeEffectFromRow}
        updateEffectInRow={structuring.updateEffectInRow}
        cancelStructuring={structuring.cancelStructuring}
        commitEdit={structuring.commitEdit}
        markEditingAbilityAsOther={structuring.markEditingAbilityAsOther}
        startEditing={structuring.startEditing}
        startEditingOther={structuring.startEditingOther}
        removeReviewedAbility={structuring.removeReviewedAbility}
        structureFromOther={structuring.structureFromOther}
        cancelEditingOther={structuring.cancelEditingOther}
        saveOther={structuring.saveOther}
      />

      <RawAbilitiesList
        rawAbilities={data.draft.rawAbilities}
        structuringIndex={structuring.structuringIndex}
        structuringRows={structuring.structuringRows}
        weaponNames={data.weaponNames}
        updateStructuringRow={structuring.updateStructuringRow}
        addStructuringRow={structuring.addStructuringRow}
        addEffectToRow={structuring.addEffectToRow}
        removeEffectFromRow={structuring.removeEffectFromRow}
        updateEffectInRow={structuring.updateEffectInRow}
        cancelStructuring={structuring.cancelStructuring}
        commitStructuring={structuring.commitStructuring}
        startStructuring={structuring.startStructuring}
        markAsOther={structuring.markAsOther}
      />

      {loadout.loadoutData && loadout.loadoutData.options.length > 0 && (
        <LoadoutSection
          loadoutData={loadout.loadoutData}
          decisions={loadout.loadoutDecisions}
          onDecide={loadout.setLoadoutDecision}
          onSave={loadout.saveLoadout}
          saving={loadout.savingLoadout}
          allDecided={loadout.allLoadoutDecided}
        />
      )}

      {data.validationError && (
        <div className="board-alert">{data.validationError}</div>
      )}
      <div className="modal-actions">
        <button type="button" onClick={onBack}>Cancelar</button>
        <button type="button" className="confirm-btn" disabled={data.saving} onClick={data.save}>
          {data.saving ? 'Guardando…' : 'Guardar y confirmar'}
        </button>
      </div>
    </section>
  )
}
