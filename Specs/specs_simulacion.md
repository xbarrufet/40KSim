# Especificació de Simulació de Combat (MVP)

## Arquitectura

Paquet TypeScript independent dins el monorepo (`sim/`), sense dependències de React/UI/IndexedDB. Debuggable i testejable apart de la PWA.

```
40KSim/
  app/                  ← PWA existent (Vite + React), importa sim/ com a dependència local
  sim/                  ← llibreria de simulació (paquet independent)
    package.json
    tsconfig.json
    src/
      types.ts          ← SimUnit, SimulationInput, SimulationResult, MetricSummary
      engine.ts         ← simulate(), pipeline hit→wound→save→damage
      dice.ts           ← tirades D6, dice notation resolver
      keywords.ts       ← aplicació de weapon keywords
      strategies/       ← round-robin.ts (pluggable)
    tests/
      engine.test.ts
    index.ts            ← exports públics
```

**Integració amb la PWA:** `app/package.json` → `"sim": "file:../sim"`. Comparteixen tipus, builds separades.

**Debug independent:**
- Tests: `cd sim && npm test`
- Script de prova: `npx tsx sim/src/scratch.ts`

---

## API

### SimWeapon

```ts
type SimWeapon = {
  name: string
  type: 'melee' | 'ranged'
  range: number              // polzades (0 per melee)
  attacks: string            // dice notation: "3", "D6", "2D3+1"
  skill: number              // BS o WS (2-6), 0 si auto-hit (TORRENT)
  strength: number
  armourPenetration: number
  damage: string             // dice notation: "1", "D3", "D6+2"
  keywords: SimWeaponKeyword[]
}

type UnitCategory = 'VEHICLE' | 'MONSTER' | 'INFANTRY' | 'CHARACTER' | 'MOUNTED' | 'FLY' | 'WALKER' | 'TITANIC'

type SimWeaponKeyword =
  | { name: 'RAPID FIRE'; value: number }
  | { name: 'BLAST'; value: number }
  | { name: 'SUSTAINED HITS'; value: number }
  | { name: 'MELTA'; value: number }
  | { name: 'ANTI'; category: UnitCategory; value: number }
  | { name: 'LETHAL HITS' }
  | { name: 'TORRENT' },
  | { name: 'TWIN-LINKED' }
  | { name: 'HEAVY' }

type SimUnitKeyword =
  | { name: 'IGNORE COVER'}
  | { name: 'IN COVER' }
  | { name: 'IN OBJECTIVE' }
  | { name: 'HAS MOVED' }
  | { name: 'HAS CHARGED' }
  | { name: 'HAS SHOTTED' }
  | { name: 'HAS ADVANCED' }
  | { name: 'IS IMPACTED' }
  
```

### SimModel

```ts
type SimModel = {
  name: string
  count: number              // quants models amb aquest perfil
  toughness: number
  save: number
  invulnerableSave: number | null
  wounds: number
  weapons: SimWeapon[]       // armes d'aquest model (loadout resolt)
}
```

### SimUnit

```ts
type SimUnit = {
  name: string
  points: number
  keywords: string[]         // INFANTRY, VEHICLE, etc. (per targetCondition futur)
  models: SimModel[]  
  unitKeywords:SimUnitKeyword[]     // inclou leader si n'hi ha
}
```

Llista plana de models — el leader és un model més dins `models[]` amb les seves stats i armes pròpies.

### Simulation Input/Output

```ts
type SimulationInput = {
  attacker: SimUnit
  defender: SimUnit
  range: number              // distància de l'escenari en polzades
  iterations: number         // default 1000
  strategy: TargetStrategy   // 'round-robin' (pluggable)
}

type TargetStrategy = 'round-robin'

type SimulationResult = {
  woundsInflicted: MetricSummary
  modelsKilled: MetricSummary
  pointsDestroyed: MetricSummary
}

type MetricSummary = {
  topResults: { value: number; percentage: number }[]  // top 5 més freqüents
}

function simulate(input: SimulationInput): SimulationResult
```

**La llibreria rep unitats ja resoltes** — no sap res de BaseData, wargearRules, ni Supabase. El generador de variants (secció apart) s'encarrega de convertir BaseData → SimUnit[].

---

## Motor de disparo

**Pipeline per arma:** hit → wound → save → damage

1. **Hit roll:** D6 vs BS (auto-hit si TORRENT)
2. **Wound roll:** D6, taula S vs T (salta si LETHAL HIT)
3. **Save roll:** D6 vs Save - AP (invulnerable si és millor)
4. **Damage allocation:** dany per ferida, model mor → dany sobrant es perd

**Sense habilitats d'unitat al MVP.** Només pipeline base + weapon keywords.

### Weapon keywords inclosos

| Keyword | Efecte |
|---------|--------|
| TORRENT | Auto-hit |
| RAPID FIRE X | +X atacs a mig rang |
| BLAST X | +X atacs per cada 5 models del target |
| SUSTAINED HITS X | Crític genera X hits extra |
| LETHAL HITS | Crític auto-fereix |
| MELTA X | +X dany a mig rang |
| TWIN-LINKED | Reroll wounds fallits |
| HEAVY | +1 to hit (sempre actiu al MVP) |

### Assignació de targets

Round-robin amb reassignació si el target mor. Estratègia dissenyada com a pluggable per futures iteracions (focus fire, aleatori, etc.).

**Unidireccional:** Només l'atacant dispara. El defensor no respon.

---

## Resultats

**En memòria, no persistits.** L'usuari pot re-córrer la simulació.

**Per cada combinació (variant atacant × defensor × rang), 3 mètriques:**
- Ferides infligides
- Models eliminats
- Punts eliminats

**Estadístiques per mètrica:** top 5 valors més freqüents amb percentatge (la resta es descarta). Permet visualitzar la distribució com una campana simplificada.

**1000 iteracions Monte Carlo per combinació.**

---

## Generador de variants (unitat + loadout)

**Servei combinatòri:** donada una unitat (BaseData), genera totes les configuracions possibles: leader × support × loadout. Produeix `SimUnit[]` consumibles per la llibreria de simulació.

### Parsing de wargearRules (AI)

Les regles de loadout a BaseData són text lliure (`wargearRules[].rulesText`). Cal parsejar-les amb AI per extreure:

```ts
type LoadoutRule = {
  who: 'sergeant' | 'any' | 'per'
  replaces: string          // nom de l'arma substituïda
  options: string[]         // noms de les armes alternatives
  every?: number            // per patró "per X models"
  count?: number            // quants poden canviar
}
```

### Combinatòria de loadout

| Patró | Combinatòria |
|-------|-------------|
| Sergeant swap | 1 combinació per opció |
| Any number | Homogeni: tota la unitat porta la mateixa (1 per opció) |
| Per X models | S'aplica sempre |

### Combinatòria de leaders/supports

Itera per tots els leaders i supports possibles (de `ledBy[]` a la BaseData).
Ex: 1 unitat amb 2 leaders i 3 supports → 6 combinacions base × variants de loadout.

**Unitat atacant:** composició mínima + totes les variants
**Unitats defensores:** composició mínima, loadout per defecte

---

## UI de simulació (Game tab)

**Integració de la llibreria amb la PWA:**

- L'usuari selecciona 1 unitat atacant d'una facció
- El sistema genera variants (generador de variants) i les simula contra totes les unitats d'una facció defensora
- Itera per 6 rangs predefinits:

| Escenari | Distància |
|----------|-----------|
| Curt | 3" |
| Curt-Mig | 9" |
| Mig | 12" |
| Llarg-Mig | 18" |
| Llarg | 24" |
| Extra-Llarg | 30" |

**Matriu de resultats:** variant atacant × unitat defensora × rang
**En memòria, no persistits.** L'usuari pot re-córrer.

---

## Evolució futura (post-MVP)

- Disparo bidireccional (A i B disparen)
- Fase de combat cos a cos (càrrega + fight)
- Habilitats d'unitat (`StructuredAbility` + `Effect[]`)
- Terreny i posicions (mapa 2D, cobertura, objectius)
- Fases configurables per escenari
- Assignació manual de targets
- Combinatòries per tipus d'unitat (horda, elite, vehicle...)
- Resultats persistits
- Mortal wounds, FNP, damage mitigation
