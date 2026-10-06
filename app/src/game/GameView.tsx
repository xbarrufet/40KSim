import type { ReactNode } from 'react'
import { AlertTriangle, ArrowLeftRight, Crosshair, Shield, Swords } from 'lucide-react'
import { useState } from 'react'
import { useCatalog } from '../data/useCatalog'
import type { UnitProfile } from '../data/schema'

export function GameView() {
  const catalogState = useCatalog()
  const [attackerId, setAttackerId] = useState('')
  const [defenderId, setDefenderId] = useState('')

  const units = catalogState.status === 'ready'
    ? catalogState.catalog.factions.flatMap((faction) =>
        faction.units.map((unit) => ({
          id: `${faction.id}/${unit.id}`,
          factionName: faction.name,
          unit,
        })),
      )
    : []
  const catalogReady = catalogState.status === 'ready' && units.length > 0
  const attacker = units.find((entry) => entry.id === attackerId)?.unit
  const defender = units.find((entry) => entry.id === defenderId)?.unit

  return (
    <section className="workspace" aria-labelledby="page-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">COMBAT SIMULATOR <span>·</span> 10TH EDITION</p>
          <h1 id="page-title">Engagement <span>setup</span></h1>
        </div>
        <div className="round-marker"><span>01</span><span>NEW SIMULATION</span></div>
      </div>

      {catalogState.status === 'error' && (
        <div className="catalog-alert" role="alert">
          <AlertTriangle size={17} />
          <span>{catalogState.message}</span>
        </div>
      )}

      <div className="combat-grid">
        <UnitPanel
          side="attacker"
          title="Attacking unit"
          icon={<Crosshair size={18} />}
          units={units}
          selectedId={attackerId}
          selectedUnit={attacker}
          disabled={!catalogReady}
          onSelect={setAttackerId}
        />

        <div className="versus-column" aria-hidden="true">
          <span className="versus-line" />
          <span className="versus-mark"><ArrowLeftRight size={17} /></span>
          <span className="versus-line" />
        </div>

        <UnitPanel
          side="defender"
          title="Defending unit"
          icon={<Shield size={18} />}
          units={units}
          selectedId={defenderId}
          selectedUnit={defender}
          disabled={!catalogReady}
          onSelect={setDefenderId}
        />
      </div>

      <section className="resolution-bar" aria-label="Estado de la simulación">
        <div className="resolution-copy">
          <span className="resolution-indicator" />
          <div>
            <p className="resolution-title">Combat resolution</p>
            <p className="resolution-note">
              {catalogState.status === 'loading'
                ? 'Loading local catalogue'
                : catalogReady
                  ? 'Select both units to prepare the engagement'
                  : 'Catalogue not generated'}
            </p>
          </div>
        </div>
        <button className="simulate-button" type="button" disabled>
          <Swords size={16} />
          SIMULATE
        </button>
      </section>
    </section>
  )
}

interface UnitPanelProps {
  side: 'attacker' | 'defender'
  title: string
  icon: ReactNode
  units: { id: string; factionName: string; unit: UnitProfile }[]
  selectedId: string
  selectedUnit?: UnitProfile
  disabled: boolean
  onSelect: (id: string) => void
}

function UnitPanel({
  side,
  title,
  icon,
  units,
  selectedId,
  selectedUnit,
  disabled,
  onSelect,
}: UnitPanelProps) {
  return (
    <section className={`unit-panel ${side}`} aria-label={title}>
      <div className="panel-heading">
        <span className="panel-icon">{icon}</span>
        <div>
          <p className="panel-kicker">{side === 'attacker' ? '01 / OFFENCE' : '02 / DEFENCE'}</p>
          <h2>{title}</h2>
        </div>
        <span className="panel-index">{side === 'attacker' ? 'A' : 'D'}</span>
      </div>

      <label className="field-label" htmlFor={`${side}-unit`}>UNIT PROFILE</label>
      <select
        id={`${side}-unit`}
        value={selectedId}
        disabled={disabled}
        onChange={(event) => onSelect(event.target.value)}
      >
        <option value="">{disabled ? 'Catalogue unavailable' : 'Choose a unit'}</option>
        {units.map(({ id, factionName, unit }) => (
          <option key={id} value={id}>{unit.name} · {factionName}</option>
        ))}
      </select>

      <div className="profile-readout" aria-live="polite">
        {selectedUnit ? (
          <>
            <div className="profile-name-row">
              <h3>{selectedUnit.name}</h3>
              {selectedUnit.points !== undefined && <span>{selectedUnit.points} PTS</span>}
            </div>
            <div className="profile-stats">
              {selectedUnit.models[0] && (
                <>
                  <Stat label="T" value={selectedUnit.models[0].toughness} />
                  <Stat label="SV" value={`${selectedUnit.models[0].save}+`} />
                  <Stat label="W" value={selectedUnit.models[0].wounds} />
                  <Stat label="OC" value={selectedUnit.models[0].objectiveControl} />
                </>
              )}
            </div>
            <p className="profile-meta">
              {selectedUnit.weapons.length} WEAPON PROFILES <span>·</span> {selectedUnit.abilities.length} ABILITIES
            </p>
          </>
        ) : (
          <div className="empty-profile">
            <span className="empty-glyph">{side === 'attacker' ? 'A' : 'D'}</span>
            <span>{disabled ? 'Awaiting compact unit catalogue' : 'Select a unit profile'}</span>
          </div>
        )}
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-cell">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
