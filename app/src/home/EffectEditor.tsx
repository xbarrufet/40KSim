import type {
  AppliesTo,
  DamageMitigationEffect,
  DiceModifierEffect,
  Effect,
  MortalWoundsHits,
  MortalWoundsResolution,
  MortalWoundsUnitType,
  StatModifierEffect,
  TargetCondition,
  TargetConditionKeyword,
  UnitKeywordEffect,
  UnitStat,
  WeaponKeywordEffect,
  WeaponStat,
  WeaponTarget,
} from '../data/schema'
import { KNOWN_UNIT_KEYWORDS, TARGET_CONDITION_KEYWORDS, type KnownUnitKeyword } from '../data/schema'
import { KNOWN_WEAPON_KEYWORDS, type KnownAttribute } from '../data/weaponKeywords'
import type { WeaponNameEntry } from '../data/preprocessBaseData'

export const WEAPON_STATS = new Set<string>(['Strength', 'Damage', 'Range', 'Attacks', 'AP', 'Skill'])
export function isWeaponStat(s: string): boolean { return WEAPON_STATS.has(s) }

export const EFFECT_CATEGORY_LABELS: Record<string, string> = {
  statModifier: 'Stats',
  diceModifier: 'Tirada',
  weaponKeyword: 'Palabra Clave',
  unitKeyword: 'Keyword Unidad',
  damageMitigation: 'Mitigación Daño',
  mortalWounds: 'Heridas Mortales',
  heal: 'Curar',
}

const EFFECT_CATEGORY_LABELS_SHORT: Record<string, string> = {
  statModifier: 'stat',
  diceModifier: 'tirada',
  weaponKeyword: 'wkw',
  unitKeyword: 'ukw',
  damageMitigation: 'dmgMit',
  mortalWounds: 'MW',
  heal: 'heal',
}

export function defaultEffectForCategory(category: Effect['category']): Effect {
  switch (category) {
    case 'statModifier':
      return { category, appliedTo: 'SelfModel', stat: 'ObjectiveControl', mode: 'add', value: 1 }
    case 'diceModifier':
      return { category, appliedTo: 'SelfModel', roll: 'toHit', action: 'rerollOnes' }
    case 'weaponKeyword':
      return { category, appliedTo: 'SelfModel', weaponTarget: 'ALL', keyword: KNOWN_WEAPON_KEYWORDS[0], value: null }
    case 'damageMitigation':
      return { category, appliedTo: 'SelfModel', kind: 'fnp', value: 5, condition: 'any' }
    case 'mortalWounds':
      return { category, appliedTo: 'Enemy', unitType: 'ALL', hits: { kind: 'notation', value: '1' }, resolution: { kind: 'always' }, damagePerSuccess: '1' }
    case 'unitKeyword':
      return { category, appliedTo: 'SelfUnit', keyword: 'BENEFIT OF COVER' as const, value: null }
    case 'heal':
      return { category, appliedTo: 'SelfUnit', amount: '1' }
  }
}

export function CategorySelect({ value, onChange, compact }: { value: Effect['category']; onChange: (cat: Effect['category']) => void; compact?: boolean }) {
  const labels = compact ? EFFECT_CATEGORY_LABELS_SHORT : EFFECT_CATEGORY_LABELS
  const style = compact ? { fontSize: '0.75rem' } : undefined
  const select = (
    <select value={value} style={style} onChange={(e) => onChange(e.target.value as Effect['category'])}>
      {Object.entries(labels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  )
  if (compact) return select
  return <label>Categoría{select}</label>
}

export function AppliedToSelect({ value, onChange, compact }: { value: AppliesTo; onChange: (v: AppliesTo) => void; compact?: boolean }) {
  const style = compact ? { fontSize: '0.75rem' } : undefined
  const select = (
    <select value={value} style={style} onChange={(e) => onChange(e.target.value as AppliesTo)}>
      <option value="SelfModel">Modelo</option>
      <option value="SelfUnit">Unidad</option>
      <option value="Ally">Aliado</option>
      <option value="Enemy">Enemigo</option>
    </select>
  )
  if (compact) return select
  return <label>Target{select}</label>
}

export function WeaponSelect({ value, weaponNames, onChange, compact }: { value: string; weaponNames?: WeaponNameEntry[]; onChange: (v: string) => void; compact?: boolean }) {
  const ranged = weaponNames?.filter((w) => w.type === 'ranged') ?? []
  const melee = weaponNames?.filter((w) => w.type === 'melee') ?? []
  const style = compact ? { fontSize: '0.75rem' } : undefined
  return (
    <select value={value} style={style} onChange={(e) => onChange(e.target.value)}>
      <option value="ALL">Todas</option>
      <option value="RANGE">{compact ? 'Rango' : 'Distancia'}</option>
      <option value="MELEE">Cuerpo a Cuerpo</option>
      {ranged.length > 0 && (
        <optgroup label="Distancia">
          {ranged.map((w) => <option key={w.name} value={w.name}>{w.name}</option>)}
        </optgroup>
      )}
      {melee.length > 0 && (
        <optgroup label="Cuerpo a Cuerpo">
          {melee.map((w) => <option key={w.name} value={w.name}>{w.name}</option>)}
        </optgroup>
      )}
    </select>
  )
}

export function DiceNotationInput({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: boolean }) {
  return (
    <input
      className={`dice-notation-input${error ? ' dice-notation-error' : ''}`}
      value={value}
      placeholder="ej: 3, D6, 2D3+1"
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function MortalWoundsHitsFields({ hits, onChange, compact }: { hits: MortalWoundsHits; onChange: (h: MortalWoundsHits) => void; compact?: boolean }) {
  const style = compact ? { fontSize: '0.75rem' } : undefined
  const smallInput = compact ? { fontSize: '0.75rem', width: '4rem' } : undefined

  const kindSelect = (
    <select value={hits.kind} style={style} onChange={(e) => {
      const kind = e.target.value as MortalWoundsHits['kind']
      if (kind === 'notation') onChange({ kind, value: '1' })
      else onChange({ kind, stat: 'models' })
    }}>
      <option value="notation">Notación</option>
      <option value="byStat">Por Stats</option>
    </select>
  )

  const valueField = hits.kind === 'notation'
    ? compact
      ? <input value={hits.value} style={smallInput} onChange={(e) => onChange({ ...hits, value: e.target.value })} />
      : <label>Valor<DiceNotationInput value={hits.value} onChange={(value) => onChange({ ...hits, value })} /></label>
    : null

  const statField = hits.kind === 'byStat'
    ? (
        <select value={hits.stat} style={style} onChange={(e) => onChange({ ...hits, stat: e.target.value })}>
          <option value="models">Nº Modelos</option>
          <option value="Movement">Movement</option>
          <option value="Toughness">Toughness</option>
          <option value="Save">Save</option>
          <option value="Invulnerable">Invulnerable</option>
          <option value="Wounds">Wounds</option>
          <option value="ObjectiveControl">ObjectiveControl</option>
          <option value="Leadership">Leadership</option>
        </select>
      )
    : null

  if (compact) {
    return <>{kindSelect}{valueField}{statField && <>{statField}</>}</>
  }

  return (
    <>
      <label>Tipo{kindSelect}</label>
      {valueField}
      {statField && <label>Stat{statField}</label>}
    </>
  )
}

export function MortalWoundsResolutionFields({ resolution, onChange, compact }: { resolution: MortalWoundsResolution; onChange: (r: MortalWoundsResolution) => void; compact?: boolean }) {
  const style = compact ? { fontSize: '0.75rem' } : undefined

  const kindSelect = (
    <select value={resolution.kind} style={style} onChange={(e) => {
      const kind = e.target.value as MortalWoundsResolution['kind']
      if (kind === 'always') onChange({ kind })
      else onChange({ kind, threshold: 4 })
    }}>
      <option value="always">Siempre</option>
      <option value="roll">Tirada</option>
    </select>
  )

  const thresholdSelect = resolution.kind === 'roll'
    ? (
        <select value={resolution.threshold} style={style} onChange={(e) => onChange({ ...resolution, threshold: Number(e.target.value) })}>
          {[2, 3, 4, 5, 6].map((v) => <option key={v} value={v}>{v}+</option>)}
        </select>
      )
    : null

  if (compact) {
    return <>{kindSelect}{thresholdSelect}</>
  }

  return (
    <>
      <label>Tipo{kindSelect}</label>
      {thresholdSelect && <label>Umbral (N+) en 1D6{thresholdSelect}</label>}
    </>
  )
}

export function TargetConditionFields({ condition, onChange, compact }: { condition: TargetCondition | undefined; onChange: (tc: TargetCondition | undefined) => void; compact?: boolean }) {
  const active = condition !== undefined

  if (compact) {
    return (
      <>
        <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <input type="checkbox" checked={active} onChange={(e) => {
            if (e.target.checked) onChange({ keywords: [], mode: 'excludes' })
            else onChange(undefined)
          }} />
          TC
        </label>
        {active && condition && (
          <>
            <select value={condition.mode} style={{ fontSize: '0.7rem' }} onChange={(e) => onChange({ ...condition, mode: e.target.value as TargetCondition['mode'] })}>
              <option value="excludes">non-</option>
              <option value="includes">vs</option>
            </select>
            {TARGET_CONDITION_KEYWORDS.map((kw) => (
              <label key={kw} style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                <input
                  type="checkbox"
                  checked={condition.keywords.includes(kw)}
                  onChange={() => {
                    const next = condition.keywords.includes(kw)
                      ? condition.keywords.filter((k: TargetConditionKeyword) => k !== kw)
                      : [...condition.keywords, kw]
                    onChange({ ...condition, keywords: next })
                  }}
                />
                {kw}
              </label>
            ))}
          </>
        )}
      </>
    )
  }

  return (
    <div className="target-condition-block">
      <label className="target-condition-toggle">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => {
            if (e.target.checked) {
              onChange({ keywords: [], mode: 'excludes' })
            } else {
              onChange(undefined)
            }
          }}
        />
        Condición objetivo
      </label>
      {active && condition && (
        <div className="target-condition-fields">
          <select
            value={condition.mode}
            onChange={(e) => onChange({ ...condition, mode: e.target.value as TargetCondition['mode'] })}
          >
            <option value="excludes">Excepto contra</option>
            <option value="includes">Solo contra</option>
          </select>
          <div className="target-condition-chips">
            {TARGET_CONDITION_KEYWORDS.map((kw) => {
              const selected = condition.keywords.includes(kw)
              return (
                <button
                  key={kw}
                  type="button"
                  className={`target-condition-chip${selected ? ' selected' : ''}`}
                  onClick={() => {
                    const next = selected
                      ? condition.keywords.filter((k: TargetConditionKeyword) => k !== kw)
                      : [...condition.keywords, kw]
                    onChange({ ...condition, keywords: next })
                  }}
                >
                  {kw}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function EffectFields({ effect, weaponNames, onChange, compact }: { effect: Effect; weaponNames?: WeaponNameEntry[]; onChange: (e: Effect) => void; compact?: boolean }) {
  const smallSelect = compact ? { fontSize: '0.75rem' } : undefined
  const smallInput = compact ? { fontSize: '0.75rem', width: '4rem' } : undefined

  const weaponSelect = (value: string, onWChange: (v: string) => void) => (
    <WeaponSelect value={value} weaponNames={weaponNames} onChange={onWChange} compact={compact} />
  )

  switch (effect.category) {
    case 'statModifier': {
      const showWeapon = isWeaponStat(effect.stat)
      return (
        <>
          {showWeapon && (
            compact
              ? weaponSelect(effect.weaponTarget ?? 'ALL', (v) => onChange({ ...effect, weaponTarget: v as WeaponTarget }))
              : <label>Arma{weaponSelect(effect.weaponTarget ?? 'ALL', (v) => onChange({ ...effect, weaponTarget: v as WeaponTarget }))}</label>
          )}
          {compact ? (
            <select value={effect.stat} style={smallSelect} onChange={(e) => onChange({ ...effect, stat: e.target.value as UnitStat | WeaponStat })}>
              <optgroup label="Unidad">
                <option value="Movement">Movement</option>
                <option value="Toughness">Toughness</option>
                <option value="Save">Save</option>
                <option value="Invulnerable">Invulnerable</option>
                <option value="Wounds">Wounds</option>
                <option value="ObjectiveControl">OC</option>
                <option value="Leadership">Leadership</option>
              </optgroup>
              <optgroup label="Arma">
                <option value="Strength">Strength</option>
                <option value="Damage">Damage</option>
                <option value="Range">Range</option>
                <option value="Attacks">Attacks</option>
                <option value="AP">AP</option>
                <option value="Skill">Skill</option>
              </optgroup>
            </select>
          ) : (
            <label>
              Stat
              <select value={effect.stat} onChange={(e) => onChange({ ...effect, stat: e.target.value as UnitStat | WeaponStat })}>
                <optgroup label="Unidad">
                  <option value="Movement">Movement</option>
                  <option value="Toughness">Toughness</option>
                  <option value="Save">Save</option>
                  <option value="Invulnerable">Invulnerable</option>
                  <option value="Wounds">Wounds</option>
                  <option value="ObjectiveControl">ObjectiveControl</option>
                  <option value="Leadership">Leadership</option>
                </optgroup>
                <optgroup label="Arma">
                  <option value="Strength">Strength</option>
                  <option value="Damage">Damage</option>
                  <option value="Range">Range</option>
                  <option value="Attacks">Attacks</option>
                  <option value="AP">AP</option>
                  <option value="Skill">Skill</option>
                </optgroup>
              </select>
            </label>
          )}
          {compact ? (
            <select value={effect.mode} style={smallSelect} onChange={(e) => onChange({ ...effect, mode: e.target.value as StatModifierEffect['mode'] })}>
              <option value="add">+</option>
              <option value="subtract">−</option>
              <option value="setValue">=</option>
              <option value="halve">÷2</option>
            </select>
          ) : (
            <label>
              Modo
              <select value={effect.mode} onChange={(e) => onChange({ ...effect, mode: e.target.value as StatModifierEffect['mode'] })}>
                <option value="add">Sumar</option>
                <option value="subtract">Restar</option>
                <option value="setValue">Fijar valor</option>
                <option value="halve">Dividir 2</option>
              </select>
            </label>
          )}
          {effect.mode !== 'halve' && (
            compact
              ? <input type="number" value={effect.value ?? ''} style={smallInput} onChange={(e) => onChange({ ...effect, value: e.target.value ? Number(e.target.value) : undefined })} />
              : <label>Valor<input type="number" value={effect.value ?? ''} onChange={(e) => onChange({ ...effect, value: e.target.value ? Number(e.target.value) : undefined })} /></label>
          )}
          <TargetConditionFields condition={effect.targetCondition} onChange={(tc) => onChange({ ...effect, targetCondition: tc })} compact={compact} />
        </>
      )
    }
    case 'diceModifier':
      return (
        <>
          {compact ? (
            <select value={effect.roll} style={smallSelect} onChange={(e) => onChange({ ...effect, roll: e.target.value as DiceModifierEffect['roll'] })}>
              <option value="toHit">Impactar</option>
              <option value="toWound">Herir</option>
              <option value="savingThrow">Salvación</option>
              <option value="damage">Daño</option>
              <option value="hazard">Hazard</option>
              <option value="charge">Carga</option>
              <option value="battleshock">Battleshock</option>
            </select>
          ) : (
            <label>
              Tirada
              <select value={effect.roll} onChange={(e) => onChange({ ...effect, roll: e.target.value as DiceModifierEffect['roll'] })}>
                <option value="toHit">Impactar</option>
                <option value="toWound">Herir</option>
                <option value="savingThrow">Salvación</option>
                <option value="damage">Daño</option>
                <option value="hazard">Hazard</option>
                <option value="charge">Carga</option>
                <option value="battleshock">Battleshock</option>
              </select>
            </label>
          )}
          {compact ? (
            <select value={effect.action} style={smallSelect} onChange={(e) => onChange({ ...effect, action: e.target.value as DiceModifierEffect['action'] })}>
              <option value="rerollOnes">Reroll 1s</option>
              <option value="rerollFailed">Reroll fallos</option>
              <option value="rerollAll">Reroll todos</option>
              <option value="addToRoll">+1</option>
              <option value="subtractFromRoll">-1</option>
              <option value="autoSuccess">Auto</option>
              <option value="ignoreModifiers">Ign. mod.</option>
            </select>
          ) : (
            <label>
              Acción
              <select value={effect.action} onChange={(e) => onChange({ ...effect, action: e.target.value as DiceModifierEffect['action'] })}>
                <option value="rerollOnes">Reroll 1s</option>
                <option value="rerollFailed">Reroll fallos</option>
                <option value="rerollAll">Reroll todos</option>
                <option value="addToRoll">+1 a la tirada</option>
                <option value="subtractFromRoll">-1 a la tirada</option>
                <option value="autoSuccess">Éxito automático</option>
                <option value="ignoreModifiers">Ignorar modificadores</option>
              </select>
            </label>
          )}
          {compact
            ? weaponSelect(effect.attackType ?? 'ALL', (v) => onChange({ ...effect, attackType: v as DiceModifierEffect['attackType'] }))
            : <label>Arma{weaponSelect(effect.attackType ?? 'ALL', (v) => onChange({ ...effect, attackType: v as DiceModifierEffect['attackType'] }))}</label>
          }
          <TargetConditionFields condition={effect.targetCondition} onChange={(tc) => onChange({ ...effect, targetCondition: tc })} compact={compact} />
        </>
      )
    case 'weaponKeyword':
      return (
        <>
          {compact
            ? weaponSelect(effect.weaponTarget, (v) => onChange({ ...effect, weaponTarget: v as WeaponTarget }))
            : <label>Arma{weaponSelect(effect.weaponTarget, (v) => onChange({ ...effect, weaponTarget: v as WeaponTarget }))}</label>
          }
          {compact ? (
            <select value={effect.keyword} style={smallSelect} onChange={(e) => onChange({ ...effect, keyword: e.target.value as KnownAttribute })}>
              {KNOWN_WEAPON_KEYWORDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          ) : (
            <label>
              Keyword
              <select value={effect.keyword} onChange={(e) => onChange({ ...effect, keyword: e.target.value as KnownAttribute })}>
                {KNOWN_WEAPON_KEYWORDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>
          )}
          {compact
            ? <input value={effect.value ?? ''} placeholder="valor" style={smallInput} onChange={(e) => onChange({ ...effect, value: e.target.value || null } as WeaponKeywordEffect)} />
            : <label>Valor (opc.)<input value={effect.value ?? ''} onChange={(e) => onChange({ ...effect, value: e.target.value || null } as WeaponKeywordEffect)} /></label>
          }
          <TargetConditionFields condition={effect.targetCondition} onChange={(tc) => onChange({ ...effect, targetCondition: tc })} compact={compact} />
        </>
      )
    case 'unitKeyword':
      return (
        <>
          {compact ? (
            <select value={effect.keyword} style={smallSelect} onChange={(e) => onChange({ ...effect, keyword: e.target.value as KnownUnitKeyword })}>
              {KNOWN_UNIT_KEYWORDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          ) : (
            <label>
              Keyword
              <select value={effect.keyword} onChange={(e) => onChange({ ...effect, keyword: e.target.value as KnownUnitKeyword })}>
                {KNOWN_UNIT_KEYWORDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>
          )}
          {compact
            ? <input value={effect.value ?? ''} placeholder="valor" style={smallInput} onChange={(e) => onChange({ ...effect, value: e.target.value || null } as UnitKeywordEffect)} />
            : <label>Valor (opc.)<input value={effect.value ?? ''} onChange={(e) => onChange({ ...effect, value: e.target.value || null } as UnitKeywordEffect)} /></label>
          }
        </>
      )
    case 'damageMitigation':
      return (
        <>
          {compact ? (
            <select value={effect.kind} style={smallSelect} onChange={(e) => onChange({ ...effect, kind: e.target.value as DamageMitigationEffect['kind'] })}>
              <option value="fnp">FNP</option>
              <option value="damageReduction">Reducción</option>
              <option value="damageHalved">Mitad</option>
              <option value="fightOnDeath">Pelear al morir</option>
            </select>
          ) : (
            <label>
              Tipo
              <select value={effect.kind} onChange={(e) => onChange({ ...effect, kind: e.target.value as DamageMitigationEffect['kind'] })}>
                <option value="fnp">Feel No Pain</option>
                <option value="damageReduction">Reducción daño</option>
                <option value="damageHalved">Daño a la mitad</option>
                <option value="fightOnDeath">Pelear al morir</option>
              </select>
            </label>
          )}
          {(effect.kind === 'fnp' || effect.kind === 'damageReduction') && (
            compact
              ? <input type="number" value={effect.value ?? ''} style={smallInput} onChange={(e) => onChange({ ...effect, value: e.target.value ? Number(e.target.value) : undefined })} />
              : <label>Valor<input type="number" value={effect.value ?? ''} onChange={(e) => onChange({ ...effect, value: e.target.value ? Number(e.target.value) : undefined })} /></label>
          )}
          {effect.kind === 'fnp' && (
            compact ? (
              <select value={effect.condition ?? 'any'} style={smallSelect} onChange={(e) => onChange({ ...effect, condition: e.target.value as DamageMitigationEffect['condition'] })}>
                <option value="any">Cualquiera</option>
                <option value="vsMortalWounds">vs MW</option>
                <option value="vsPsychic">vs Psychic</option>
              </select>
            ) : (
              <label>
                Condición
                <select value={effect.condition ?? 'any'} onChange={(e) => onChange({ ...effect, condition: e.target.value as DamageMitigationEffect['condition'] })}>
                  <option value="any">Cualquiera</option>
                  <option value="vsMortalWounds">vs Heridas Mortales</option>
                  <option value="vsPsychic">vs Ataques Psíquicos</option>
                </select>
              </label>
            )
          )}
        </>
      )
    case 'mortalWounds':
      return (
        <>
          {compact ? (
            <select value={effect.unitType} style={smallSelect} onChange={(e) => onChange({ ...effect, unitType: e.target.value as MortalWoundsUnitType })}>
              <option value="ALL">Todas</option>
              <option value="VEHICLE">Vehicle</option>
              <option value="INFANTRY">Infantry</option>
              <option value="MONSTER">Monster</option>
              <option value="CHARACTER">Character</option>
              <option value="MOUNTED">Mounted</option>
              <option value="FLY">Fly</option>
              <option value="WALKER">Walker</option>
              <option value="TITANIC">Titanic</option>
            </select>
          ) : (
            <label>
              Tipo Unidad
              <select value={effect.unitType} onChange={(e) => onChange({ ...effect, unitType: e.target.value as MortalWoundsUnitType })}>
                <option value="ALL">Todas</option>
                <option value="VEHICLE">Vehicle</option>
                <option value="INFANTRY">Infantry</option>
                <option value="MONSTER">Monster</option>
                <option value="CHARACTER">Character</option>
                <option value="MOUNTED">Mounted</option>
                <option value="FLY">Fly</option>
                <option value="WALKER">Walker</option>
                <option value="TITANIC">Titanic</option>
              </select>
            </label>
          )}
          {compact ? (
            <>
              <MortalWoundsHitsFields hits={effect.hits} onChange={(hits) => onChange({ ...effect, hits })} compact />
              <MortalWoundsResolutionFields resolution={effect.resolution} onChange={(resolution) => onChange({ ...effect, resolution })} compact />
              <DiceNotationInput value={effect.damagePerSuccess} onChange={(damagePerSuccess) => onChange({ ...effect, damagePerSuccess })} />
            </>
          ) : (
            <>
              <fieldset>
                <legend>Impactos</legend>
                <MortalWoundsHitsFields hits={effect.hits} onChange={(hits) => onChange({ ...effect, hits })} />
              </fieldset>
              <fieldset>
                <legend>Resolución</legend>
                <MortalWoundsResolutionFields resolution={effect.resolution} onChange={(resolution) => onChange({ ...effect, resolution })} />
              </fieldset>
              <label>
                MW por éxito
                <DiceNotationInput value={effect.damagePerSuccess} onChange={(damagePerSuccess) => onChange({ ...effect, damagePerSuccess })} />
              </label>
            </>
          )}
        </>
      )
    case 'heal':
      return compact
        ? <DiceNotationInput value={effect.amount ?? '1'} onChange={(v) => onChange({ ...effect, amount: v })} />
        : <label>Cantidad<DiceNotationInput value={effect.amount ?? '1'} onChange={(v) => onChange({ ...effect, amount: v })} /></label>
  }
}
