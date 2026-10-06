import type { ReactNode } from 'react'
import type { DatasheetContext } from '../data/preprocessBaseData'
import type { WargearEntry } from '../data/schema'
import { splitWeaponProfiles, type WeaponRow } from './processUnitLogic'

interface UnitDatasheetProps {
  datasheet: DatasheetContext | null
  wargear: WargearEntry[]
  keywords?: string[]
  /** Costs/Unit Composition/Led by/Supported by are admin-review context, not needed during list browsing/gameplay. Defaults to true (Process Unit's current behavior). */
  showExtendedContext?: boolean
  /** Model count per wargear item (keyed by `wargearItem.id`), from the list's own loadout text. When provided, a "Modelos" column is shown on the weapon tables. */
  modelCounts?: Map<number, number>
  /** Owning unit/character name per wargear item (keyed by `wargearItem.id`) — distinguishes a squad's own weapons from an attached leader/support's. When provided, a "Modelo" column is shown on the weapon tables. */
  modelNames?: Map<number, string>
}

/** Read-only datasheet rendering (models, costs, composition, led-by, weapon tables) shared between Process Unit review and the list-view screen. */
export function UnitDatasheet({ datasheet, wargear, keywords, showExtendedContext = true, modelCounts, modelNames }: UnitDatasheetProps) {
  const { ranged, melee } = splitWeaponProfiles(wargear)
  const extraColumns = (modelCounts ? 1 : 0) + (modelNames ? 1 : 0)
  const rangedColumnCount = 7 + extraColumns
  const meleeColumnCount = 6 + extraColumns

  return (
    <>
      {datasheet && datasheet.miniatures.length > 0 && (
        <section className="process-unit-section">
          <h2>Models</h2>
          <table className="datasheet-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>M</th>
                <th>T</th>
                <th>SV</th>
                <th>W</th>
                <th>LD</th>
                <th>OC</th>
              </tr>
            </thead>
            <tbody>
              {datasheet.miniatures.map((miniature) => (
                <tr key={miniature.name}>
                  <td>
                    {miniature.name}
                    {miniature.baseSize && <span className="base-size-tag"> base: {miniature.baseSize}</span>}
                  </td>
                  <td>{miniature.stats.movement}"</td>
                  <td>{miniature.stats.toughness}</td>
                  <td>{miniature.stats.save}+</td>
                  <td>{miniature.stats.wounds}</td>
                  <td>{miniature.stats.leadership}+</td>
                  <td>{miniature.stats.objectiveControl}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {keywords && keywords.length > 0 && <p className="profile-meta">{keywords.join(', ')}</p>}
        </section>
      )}

      {showExtendedContext && datasheet && datasheet.costs.length > 0 && (
        <section className="process-unit-section">
          <h2>Costs</h2>
          <ul className="costs-list">
            {datasheet.costs.map((cost, index) => (
              <li key={index}>
                {cost.models} models <span className="points-tag">{cost.points} pts</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showExtendedContext && datasheet?.unitComposition && (
        <section className="process-unit-section">
          <h2>Unit Composition</h2>
          <p className="composition-text">{datasheet.unitComposition}</p>
        </section>
      )}

      {showExtendedContext && datasheet && (datasheet.ledBy.length > 0 || datasheet.supportedBy.length > 0) && (
        <section className="process-unit-section">
          {datasheet.ledBy.length > 0 && (
            <>
              <h2>Led by</h2>
              <div className="tag-chip-row">
                {datasheet.ledBy.map((name) => (
                  <span key={name} className="tag-chip">{name.toUpperCase()}</span>
                ))}
              </div>
            </>
          )}
          {datasheet.supportedBy.length > 0 && (
            <>
              <h2>Supported by</h2>
              <div className="tag-chip-row">
                {datasheet.supportedBy.map((name) => (
                  <span key={name} className="tag-chip">{name.toUpperCase()}</span>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {ranged.length > 0 && (
        <section className="process-unit-section">
          <h2>Ranged Weapons</h2>
          <table className="datasheet-table">
            <thead>
              <tr>
                {modelNames && <th>Modelo</th>}
                <th>Nombre</th>
                {modelCounts && <th>Modelos</th>}
                <th>RNG</th>
                <th>A</th>
                <th>BS</th>
                <th>S</th>
                <th>AP</th>
                <th>D</th>
              </tr>
            </thead>
            <tbody>
              {ranged.map((row) => (
                <WeaponRowGroup key={row.key} row={row} modelCounts={modelCounts} modelNames={modelNames} columnCount={rangedColumnCount}>
                  <td>{row.profile.range}</td>
                  <td>{row.profile.attacks}</td>
                  <td>{row.profile.ballisticSkill ?? '-'}</td>
                  <td>{row.profile.strength}</td>
                  <td>{row.profile.armourPenetration}</td>
                  <td>{row.profile.damage}</td>
                </WeaponRowGroup>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {melee.length > 0 && (
        <section className="process-unit-section">
          <h2>Melee Weapons</h2>
          <table className="datasheet-table">
            <thead>
              <tr>
                {modelNames && <th>Modelo</th>}
                <th>Nombre</th>
                {modelCounts && <th>Modelos</th>}
                <th>A</th>
                <th>WS</th>
                <th>S</th>
                <th>AP</th>
                <th>D</th>
              </tr>
            </thead>
            <tbody>
              {melee.map((row) => (
                <WeaponRowGroup key={row.key} row={row} modelCounts={modelCounts} modelNames={modelNames} columnCount={meleeColumnCount}>
                  <td>{row.profile.attacks}</td>
                  <td>{row.profile.weaponSkill ?? '-'}</td>
                  <td>{row.profile.strength}</td>
                  <td>{row.profile.armourPenetration}</td>
                  <td>{row.profile.damage}</td>
                </WeaponRowGroup>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  )
}

function WeaponRowGroup({
  row,
  children,
  modelCounts,
  modelNames,
  columnCount,
}: {
  row: WeaponRow
  children: ReactNode
  modelCounts?: Map<number, number>
  modelNames?: Map<number, string>
  columnCount: number
}) {
  return (
    <>
      <tr>
        {modelNames && <td>{modelNames.get(row.wargearItemId) ?? '—'}</td>}
        <td>{row.label}</td>
        {modelCounts && <td>×{modelCounts.get(row.wargearItemId) ?? '—'}</td>}
        {children}
      </tr>
      {row.profile.abilities.length > 0 && (
        <tr className="ability-chip-row">
          <td colSpan={columnCount}>
            {row.profile.abilities.map((ability) => (
              <span key={ability.id} className="tag-chip">
                {ability.name}
                {ability.value ? ` ${ability.value}` : ''}
              </span>
            ))}
          </td>
        </tr>
      )}
    </>
  )
}
