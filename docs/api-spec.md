# 40KSim Query API — Interface Specification

Base URL: `https://<project>.supabase.co/functions/v1`

All endpoints return `application/json`. Authentication via `Authorization: Bearer <anon_key>` header.

---

## Endpoints

All endpoints are served by a single Edge Function `factions` with path-based routing.

### `GET /factions`

Returns the list of all factions with unit counts.

### `GET /factions/:factionSlug`

Returns all data for a faction: units, base data, structured abilities, loadout, and detachments.

### `GET /factions/:factionSlug/units/:unitSlug`

Returns all data for a single unit within a faction.

---

## Response Bodies

### `GET /factions`

```json
{
  "factions": [FactionSummary]
}
```

#### FactionSummary

| Field       | Type              | Description                    |
|-------------|-------------------|--------------------------------|
| slug        | `string`          | Unique faction identifier      |
| name        | `string`          | Display name                   |
| category    | `string \| null`  | Faction category (e.g. "Imperium") |
| icon        | `string \| null`  | Icon identifier                |
| unitCount   | `number`          | Number of units in the faction |

```json
{
  "slug": "space-marines",
  "name": "Space Marines",
  "category": "Imperium",
  "icon": null,
  "unitCount": 98
}
```

---

### `GET /factions/:factionSlug`

```json
{
  "factionSlug": "space-marines",
  "units": [UnitFull],
  "detachments": [DetachmentData]
}
```

---

### `GET /factions/:factionSlug/units/:unitSlug`

Returns a single `UnitFull` directly:

```json
{
  "factionSlug": "space-marines",
  "unit": UnitFull
}
```

---

## Core Type: UnitFull

All unit data grouped in a single object. Both `/faction` and `/unit` use this type.

| Field     | Type                        | Description                              |
|-----------|-----------------------------|------------------------------------------|
| slug      | `string`                    | Unit identifier within the faction       |
| name      | `string`                    | Display name                             |
| category  | `string \| null`            | E.g. "Battleline", "Character"           |
| points    | `number \| null`            | Point cost                               |
| keywords  | `string[]`                  | Unit keywords (INFANTRY, etc.)           |
| baseData  | `Record<string, unknown> \| null` | Raw scraped datasheet (see below)  |
| abilities | `AbilitiesData \| null`     | Structured abilities                     |
| loadout   | `LoadoutData \| null`       | Structured loadout options               |

```json
{
  "slug": "intercessor-squad",
  "name": "Intercessor Squad",
  "category": "Battleline",
  "points": 80,
  "keywords": ["INFANTRY", "BATTLELINE", "IMPERIUM", "TACTICUS", "INTERCESSOR SQUAD"],
  "baseData": { "...raw datasheet..." },
  "abilities": {
    "tag": "CONFIRMED",
    "abilities": ["..."],
    "rawAbilities": ["..."],
    "baseDataHash": "abc123"
  },
  "loadout": {
    "tag": "CONFIRMED",
    "options": ["..."]
  }
}
```

### BaseData

Raw scraped datasheet embedded directly in `UnitFull.baseData`. Structure varies per unit — this is the unprocessed source data as a JSON blob. `null` if not yet scraped.

### AbilitiesData

| Field        | Type                  | Description                                      |
|--------------|-----------------------|--------------------------------------------------|
| tag          | `UnitDataTag`         | Processing status                                |
| abilities    | `UnitDataAbility[]`   | Structured abilities (see below)                 |
| rawAbilities | `RawAbility[]`        | Original ability text from datasheet             |
| baseDataHash | `string \| null`      | Hash of the base data used to generate abilities |

#### UnitDataTag

```
"PENDING" | "AI_PROPOSED" | "CONFIRMED"
```

#### UnitDataAbility (union)

Either a `StructuredAbility` or an `OtherAbility`:

**StructuredAbility:**

| Field           | Type              | Description                                 |
|-----------------|-------------------|---------------------------------------------|
| name            | `string`          | Ability name                                |
| phase           | `Phase`           | When the ability applies                    |
| trigger         | `string`          | Activation condition (e.g. "ALWAYS")        |
| autoApply       | `boolean?`        | Whether it applies automatically            |
| frequency       | `Frequency?`      | How often it can be used                    |
| groupId         | `string?`         | Groups related abilities                    |
| groupOperator   | `"AND" \| "OR"?`  | How grouped abilities combine               |
| effectsOperator | `"AND" \| "OR"?`  | How multiple effects combine                |
| effects         | `Effect[]`        | List of mechanical effects                  |
| originalText    | `string?`         | Original rules text                         |

**OtherAbility:**

| Field    | Type       | Description                  |
|----------|------------|------------------------------|
| name     | `string`   | Ability name                 |
| category | `"OTHER"`  | Literal discriminator        |
| text     | `string`   | Unstructured rules text      |

#### Phase

```
"ANY" | "MOVEMENT" | "SHOOTING" | "CHARGE" | "FIGHT" | "COMMAND"
```

#### Frequency

```
"always" | "perPhase" | "perRound" | "perBattle"
```

#### RawAbility

| Field       | Type     | Description                  |
|-------------|----------|------------------------------|
| name        | `string` | Ability name                 |
| text        | `string` | Full rules text              |
| abilityType | `string` | Category from the datasheet  |

---

### Effect (union)

Discriminated by `category`:

#### StatModifierEffect

| Field           | Type               | Description                              |
|-----------------|--------------------|------------------------------------------|
| category        | `"statModifier"`   | Discriminator                            |
| appliedTo       | `AppliesTo`        | Who is affected                          |
| weaponTarget    | `WeaponTarget?`    | Which weapons (if weapon stat)           |
| stat            | `UnitStat \| WeaponStat` | The stat being modified            |
| mode            | `"add" \| "subtract" \| "setValue" \| "halve"` | Modification type |
| value           | `number?`          | Modification amount                      |
| targetCondition | `TargetCondition?` | Conditional on enemy keywords            |

#### DiceModifierEffect

| Field           | Type               | Description                              |
|-----------------|--------------------|------------------------------------------|
| category        | `"diceModifier"`   | Discriminator                            |
| appliedTo       | `AppliesTo`        | Who is affected                          |
| roll            | `DiceRoll`         | Which roll is modified                   |
| action          | `DiceAction`       | Type of modification                     |
| attackType      | `WeaponTarget?`    | Filter by weapon type                    |
| targetCondition | `TargetCondition?` | Conditional on enemy keywords            |

#### WeaponKeywordEffect

| Field           | Type               | Description                              |
|-----------------|--------------------|------------------------------------------|
| category        | `"weaponKeyword"`  | Discriminator                            |
| appliedTo       | `AppliesTo`        | Who is affected                          |
| weaponTarget    | `WeaponTarget`     | Which weapons                            |
| keyword         | `KnownAttribute`   | The keyword granted                      |
| value           | `string \| null`   | Keyword value (e.g. "D3" for MELTA)     |
| targetCondition | `TargetCondition?` | Conditional on enemy keywords            |

#### UnitKeywordEffect

| Field     | Type               | Description                              |
|-----------|--------------------|------------------------------------------|
| category  | `"unitKeyword"`    | Discriminator                            |
| appliedTo | `AppliesTo`        | Who is affected                          |
| keyword   | `KnownUnitKeyword` | The keyword granted                     |
| value     | `string \| null`   | Keyword value if applicable              |

#### DamageMitigationEffect

| Field     | Type                  | Description                           |
|-----------|-----------------------|---------------------------------------|
| category  | `"damageMitigation"`  | Discriminator                         |
| appliedTo | `AppliesTo`           | Who is affected                       |
| kind      | `"fnp" \| "damageReduction" \| "damageHalved" \| "fightOnDeath"` | Type |
| value     | `number?`             | Threshold / amount                    |
| condition | `"any" \| "vsMortalWounds" \| "vsPsychic"?` | When it applies     |

#### MortalWoundsEffect

| Field            | Type                   | Description                        |
|------------------|------------------------|------------------------------------|
| category         | `"mortalWounds"`       | Discriminator                      |
| appliedTo        | `AppliesTo`            | Who is affected                    |
| unitType         | `MortalWoundsUnitType` | Target unit type filter            |
| hits             | `MortalWoundsHits`     | How many hits                      |
| resolution       | `MortalWoundsResolution` | How to resolve                   |
| damagePerSuccess | `string`               | Damage notation per success        |

#### HealEffect

| Field     | Type       | Description                 |
|-----------|------------|-----------------------------|
| category  | `"heal"`   | Discriminator               |
| appliedTo | `AppliesTo`| Who is healed               |
| amount    | `string?`  | Heal amount notation        |

---

### Enums and Supporting Types

#### AppliesTo

```
"SelfModel" | "SelfUnit" | "Enemy" | "Ally"
```

#### UnitStat

```
"Movement" | "Toughness" | "Save" | "Invulnerable" | "Wounds" | "ObjectiveControl" | "Leadership"
```

#### WeaponStat

```
"Strength" | "Damage" | "Range" | "Attacks" | "AP" | "Skill"
```

#### WeaponTarget

```
"ALL" | "RANGE" | "MELEE" | string
```

The `string` variant allows targeting a specific weapon by name.

#### DiceRoll

```
"toHit" | "toWound" | "savingThrow" | "damage" | "hazard" | "charge" | "battleshock"
```

#### DiceAction

```
"rerollOnes" | "rerollFailed" | "rerollAll" | "addToRoll" | "subtractFromRoll" | "autoSuccess" | "ignoreModifiers"
```

#### KnownAttribute (Weapon Keywords)

```
"ANTI-FLY" | "ANTI-VEHICLE" | "ASSAULT" | "BLAST" | "CLEAVE" | "CLOSE-QUARTERS"
| "DEVASTATING WOUNDS" | "EXTRA ATTACKS" | "HAZARDOUS" | "HEAVY" | "IGNORES COVER"
| "INDIRECT FIRE" | "LANCE" | "LETHAL HITS" | "MELTA" | "ONE SHOT" | "PRECISION"
| "PSYCHIC" | "RAPID FIRE" | "SUSTAINED HITS" | "TORRENT" | "TWIN-LINKED"
```

#### KnownUnitKeyword

```
"BENEFIT OF COVER" | "STEALTH" | "SCOUTS" | "DEEP STRIKE" | "LONE OPERATIVE" | "FIGHTS FIRST"
```

#### TargetCondition

| Field    | Type                       | Description                           |
|----------|----------------------------|---------------------------------------|
| keywords | `TargetConditionKeyword[]` | Keywords to check                     |
| mode     | `"includes" \| "excludes"` | Match or exclude                      |

#### TargetConditionKeyword

```
"VEHICLE" | "INFANTRY" | "MONSTER" | "CHARACTER" | "MOUNTED" | "FLY" | "WALKER" | "TITANIC"
```

#### MortalWoundsUnitType

```
"ALL" | "VEHICLE" | "INFANTRY" | "MONSTER" | "CHARACTER" | "MOUNTED" | "FLY" | "WALKER" | "TITANIC"
```

#### MortalWoundsHits (union)

```json
{ "kind": "notation", "value": "D3" }
{ "kind": "byStat", "stat": "Attacks" }
```

#### MortalWoundsResolution (union)

```json
{ "kind": "always" }
{ "kind": "roll", "threshold": 4 }
```

---

### LoadoutData

Embedded in `UnitFull.loadout`.

| Field   | Type              | Description                |
|---------|-------------------|----------------------------|
| tag     | `UnitDataTag`     | Processing status          |
| options | `WargearOption[]`  | Structured loadout options |

#### WargearOption

| Field          | Type             | Description                              |
|----------------|------------------|------------------------------------------|
| scope          | `WargearScope`   | Who can take this option                 |
| replaces       | `WargearRef[]`   | Items this replaces                      |
| choices        | `WargearChoice[]`| Available choices                        |
| isAdditional   | `boolean`        | Whether it's an extra item (not replace) |
| originalRuleId | `number`         | Source rule ID                           |
| originalText   | `string`         | Original wargear text                    |

#### WargearScope

| Field | Type                                                | Description                 |
|-------|-----------------------------------------------------|-----------------------------|
| type  | `"model" \| "allModels" \| "anyNumber" \| "ratio"` | Scope type                  |
| role  | `string?`                                           | Model role (e.g. "Sergeant")|
| ratio | `{ per: number, count: number }?`                   | For ratio scopes            |

#### WargearRef

| Field        | Type     | Description              |
|--------------|----------|--------------------------|
| name         | `string` | Wargear item name        |
| wargearItemId| `number` | Wargear item ID          |

#### WargearChoice

| Field  | Type                                                   | Description                     |
|--------|--------------------------------------------------------|---------------------------------|
| items  | `{ count: number, name: string, wargearItemId: number }[]` | Items in this choice       |
| grants | `WargearRef[]?`                                        | Additional items granted        |
| locks  | `number[]?`                                            | IDs of options this locks out   |

---

### DetachmentData

Part of the faction response (`detachments` array). Not embedded in `UnitFull` — detachments are faction-level.

| Field          | Type                       | Description                    |
|----------------|----------------------------|--------------------------------|
| detachmentSlug | `string`                   | Detachment identifier          |
| tag            | `DetachmentTag`            | Processing status              |
| data           | `Record<string, unknown>`  | Detachment rules data          |
| enhancements   | `StructuredEnhancement[] \| null` | Structured enhancements |

#### DetachmentTag

```
"SCRAPED" | "PENDING" | "AI_PROPOSED" | "CONFIRMED"
```

#### StructuredEnhancement

| Field              | Type                     | Description                         |
|--------------------|--------------------------|-------------------------------------|
| slug               | `string`                 | Enhancement identifier              |
| name               | `string`                 | Display name                        |
| points             | `number`                 | Point cost                          |
| enhancementType    | `"upgrade" \| "miniature"` | Type of enhancement               |
| limit              | `number`                 | Max instances in an army            |
| eligibility        | `EnhancementEligibility` | Who can take it                     |
| effects            | `Effect[]`               | Mechanical effects                  |
| conditionalEffects | `ConditionalEffects[]`   | Effects with extra conditions       |
| originalText       | `string`                 | Original rules text                 |

#### EnhancementEligibility

| Field                          | Type       | Description                          |
|--------------------------------|------------|--------------------------------------|
| keywords                       | `string[]` | Required keywords                    |
| excludedKeywords               | `string[]` | Excluded keywords                    |
| isEquipableByEpicHero          | `boolean`  | Can Epic Heroes take it              |
| isEquipableByNonCharacterUnit  | `boolean`  | Can non-CHARACTER units take it      |

#### ConditionalEffects

| Field     | Type       | Description                  |
|-----------|------------|------------------------------|
| condition | `string`   | Condition description        |
| effects   | `Effect[]` | Effects when condition is met|

---

## Error Responses

```json
{
  "error": "string describing the error"
}
```

| Status | Meaning                                     |
|--------|---------------------------------------------|
| 400    | Missing or invalid query parameters         |
| 404    | Faction or unit not found                   |
| 500    | Internal server error                       |
