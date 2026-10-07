import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { getBaseData } from '../data/db'
import { extractDatasheetContext, getUnitWargear, toRawAbilities, type BaseData, type DatasheetContext } from '../data/preprocessBaseData'
import type { ArmyList, ArmyListEntry, RawAbility, WargearEntry } from '../data/schema'
import { FormattedAbilityText } from '../home/FormattedAbilityText'
import { dedupeAbilitiesByName, matchLoadoutWargear, resolveAttachedEntry } from '../home/processUnitLogic'
import { UnitDatasheet } from '../home/UnitDatasheet'

interface ListDetailViewProps {
  list: ArmyList
  onBack: () => void
}

interface EntryDatasheet {
  datasheet: DatasheetContext
  wargear: WargearEntry[]
  unmatchedTokenNames: string[]
  rawAbilities: RawAbility[]
  modelCounts: Map<number, number>
  modelNames: Map<number, string>
}

type EntryDatasheetState = { status: 'loading' } | { status: 'unavailable' } | { status: 'ready'; data: EntryDatasheet }

export function ListDetailView({ list, onBack }: ListDetailViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loaded, setLoaded] = useState<{ index: number; data: EntryDatasheet | null } | null>(null)

  const selectedEntry: ArmyListEntry | undefined = list.entries[selectedIndex]
  const canLookUpBaseData = Boolean(selectedEntry?.matchedFactionSlug && selectedEntry?.matchedUnitSlug)

  useEffect(() => {
    if (!selectedEntry?.matchedFactionSlug || !selectedEntry?.matchedUnitSlug) return

    let cancelled = false
    const { matchedFactionSlug, matchedUnitSlug, wargearTokens } = selectedEntry
    const attachedEntry = resolveAttachedEntry(selectedEntry, list.entries)
    const attachedLookup =
      attachedEntry?.matchedFactionSlug && attachedEntry.matchedUnitSlug
        ? getBaseData(attachedEntry.matchedFactionSlug, attachedEntry.matchedUnitSlug)
        : Promise.resolve(undefined)

    Promise.all([getBaseData(matchedFactionSlug, matchedUnitSlug), attachedLookup])
      .then(([baseData, attachedBaseData]) => {
        if (cancelled) return
        if (!baseData) {
          setLoaded({ index: selectedIndex, data: null })
          return
        }
        const mainData = baseData as BaseData
        const wargear = getUnitWargear(mainData)
        const { matched, unmatchedTokenNames, modelCounts } = matchLoadoutWargear(wargearTokens, wargear)
        const mainDatasheet = extractDatasheetContext(mainData)

        let miniatures = mainDatasheet.miniatures
        let combinedWargear = matched
        let combinedUnmatched = unmatchedTokenNames
        let combinedModelCounts = modelCounts
        let combinedRawAbilities = toRawAbilities(mainData)
        let combinedModelNames = new Map(matched.map((entry) => [entry.wargearItem.id, selectedEntry.unitName]))

        if (attachedBaseData && attachedEntry) {
          const attachedData = attachedBaseData as BaseData
          const attachedWargear = getUnitWargear(attachedData)
          const attachedMatch = matchLoadoutWargear(attachedEntry.wargearTokens, attachedWargear)
          miniatures = [...miniatures, ...extractDatasheetContext(attachedData).miniatures]
          combinedWargear = [...combinedWargear, ...attachedMatch.matched]
          combinedUnmatched = [...combinedUnmatched, ...attachedMatch.unmatchedTokenNames]
          combinedModelCounts = new Map([...combinedModelCounts, ...attachedMatch.modelCounts])
          combinedRawAbilities = dedupeAbilitiesByName([...combinedRawAbilities, ...toRawAbilities(attachedData)])
          combinedModelNames = new Map([
            ...combinedModelNames,
            ...attachedMatch.matched.map((entry): [number, string] => [entry.wargearItem.id, attachedEntry.unitName]),
          ])
        }

        setLoaded({
          index: selectedIndex,
          data: {
            datasheet: { ...mainDatasheet, miniatures },
            wargear: combinedWargear,
            unmatchedTokenNames: combinedUnmatched,
            rawAbilities: combinedRawAbilities,
            modelCounts: combinedModelCounts,
            modelNames: combinedModelNames,
          },
        })
      })
      .catch((err: unknown) => {
        console.error('ListDetailView: failed to load unit datasheet', err)
        if (!cancelled) setLoaded({ index: selectedIndex, data: null })
      })

    return () => {
      cancelled = true
    }
  }, [selectedIndex, selectedEntry, list.entries])

  const entryDatasheet: EntryDatasheetState = !canLookUpBaseData
    ? { status: 'unavailable' }
    : loaded?.index !== selectedIndex
      ? { status: 'loading' }
      : loaded.data === null
        ? { status: 'unavailable' }
        : { status: 'ready', data: loaded.data }

  const categories: { name: string; entries: { entry: ArmyListEntry; index: number }[] }[] = []
  list.entries.forEach((entry, index) => {
    let group = categories.find((c) => c.name === entry.category)
    if (!group) {
      group = { name: entry.category, entries: [] }
      categories.push(group)
    }
    group.entries.push({ entry, index })
  })

  return (
    <section className="workspace list-detail-workspace">
      <div className="unit-board-topbar">
        <button type="button" className="back-link" onClick={onBack}>
          <ArrowLeft size={14} /> Listas
        </button>
        <h1>{list.armyName ?? list.title}</h1>
      </div>

      <div className="list-detail-grid">
        <aside className="list-detail-roster">
          {categories.map((category) => (
            <div key={category.name} className="roster-category">
              <h2>{category.name}</h2>
              <ul className="roster-rows">
                {category.entries.map(({ entry, index }) => (
                  <li key={index}>
                    <button
                      type="button"
                      className={`roster-row${index === selectedIndex ? ' is-selected' : ''}`}
                      onClick={() => setSelectedIndex(index)}
                    >
                      <div className="roster-row-main">
                        <span className="roster-row-name">{entry.unitName}</span>
                        <span className="roster-row-points">{entry.points !== undefined ? `${entry.points} pts` : '—'}</span>
                      </div>
                      <div className="roster-row-meta">
                        {entry.modelCount !== undefined && <span>{entry.modelCount} models</span>}
                        {entry.attachmentText && <span className="roster-row-attachment">{entry.attachmentText}</span>}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        <section className="list-detail-panel">
          {selectedEntry && <EntryPanel entry={selectedEntry} state={entryDatasheet} />}
        </section>
      </div>
    </section>
  )
}

function EntryPanel({ entry, state }: { entry: ArmyListEntry; state: EntryDatasheetState }) {
  return (
    <>
      <div className="process-unit-section">
        <h1 className="entry-panel-title">{entry.unitName}</h1>
        <p className="profile-meta">
          {entry.points !== undefined ? `${entry.points} pts` : '—'}
          {entry.modelCount !== undefined && <> <span>·</span> {entry.modelCount} models</>}
        </p>
        {(entry.attachmentText || entry.enhancementText) && (
          <div className="tag-chip-row">
            {entry.attachmentText && <span className="tag-chip">{entry.attachmentText}</span>}
            {entry.enhancementText && <span className="tag-chip">{entry.enhancementText}</span>}
          </div>
        )}
      </div>

      {state.status === 'loading' && <p className="profile-meta">Cargando…</p>}

      {state.status === 'unavailable' && (
        <div className="process-unit-section">
          <p className="no-datasheet-notice">No hay datos de esta unidad todavía.</p>
          {entry.rawWargearText && <p className="composition-text">{entry.rawWargearText}</p>}
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <UnitDatasheet
            datasheet={state.data.datasheet}
            wargear={state.data.wargear}
            showExtendedContext={false}
            modelCounts={state.data.modelCounts}
            modelNames={state.data.modelNames}
          />
          {state.data.unmatchedTokenNames.length > 0 && (
            <section className="process-unit-section">
              <h2>Otro equipo</h2>
              <div className="tag-chip-row">
                {state.data.unmatchedTokenNames.map((name, index) => (
                  <span key={index} className="tag-chip">{name}</span>
                ))}
              </div>
            </section>
          )}
          {state.data.rawAbilities.length > 0 && (
            <section className="process-unit-section">
              <h2>Abilities</h2>
              <ul className="raw-ability-list">
                {state.data.rawAbilities.map((ability, index) => (
                  <li key={index} className="raw-ability-row">
                    <div className="raw-ability-text">
                      <strong>{ability.name}</strong> <span className="ability-type-tag">{ability.abilityType}</span>
                      <FormattedAbilityText text={ability.text} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  )
}
