# Spec Delta

## MODIFIED Requirements

### Requirement: Mortal Wounds Category in Structuring Form

The per-ability structuring form SHALL offer a "mortalWounds" (`Heridas Mortales`) effect category. When selected, the form SHALL expose the following fields:

- **Tipo Unidad**: dropdown with values `Todas`, `Vehicle`, `Infantry`, `Monster`, `Character`, `Mounted`, `Fly`, `Walker`, `Titanic`. Default: `Todas`.
- **Impactos** (hits): strategy selector with three options:
  - `Fijo`: dropdown 1–10.
  - `Por Stats`: dropdown of unit stats (`Nº Modelos`, `Movement`, `Toughness`, `Save`, `Invulnerable`, `Wounds`, `ObjectiveControl`, `Leadership`).
  - `Tirada`: count dropdown 1–6 × dice dropdown D3/D6.
- **Resolución**: strategy selector with two options:
  - `Siempre`: no additional fields.
  - `Tirada`: threshold input (2–6) on 1D6.
- **MW por éxito** (damagePerSuccess): strategy selector with two options, default `Fijo 1`:
  - `Fijo`: dropdown 1–10.
  - `Tirada`: count dropdown 1–6 × dice dropdown D3/D6.

The fields `gameEvent`, `preRoll` checkbox, `targetScope`, `range`, amount strategies (`fixed`/`roll`/`perModelRoll`/`multiDiceCount`), and `amountByKeyword` repeatable list are removed from the form.

#### Scenario: Default mortal wounds effect

- **WHEN** the user selects the "Heridas Mortales" category for a new effect
- **THEN** the form shows Tipo Unidad=Todas, Impactos=Fijo 1, Resolución=Siempre, MW por éxito=Fijo 1

#### Scenario: Configuring Hammer of Wrath pattern

- **WHEN** the user configures a charge-phase mortal wound ability for Assault Intercessors with Jump Packs
- **THEN** the user sets phase=Carga, Tipo Unidad=Todas, Impactos=Por Stats (Nº Modelos), Resolución=Tirada (4+), MW por éxito=Fijo 1

#### Scenario: Configuring Haywire Mine with Vehicle override

- **WHEN** the user configures a Haywire Mine ability that deals more damage to vehicles
- **THEN** the user creates two effects: one with Tipo Unidad=Todas, Impactos=Fijo 1, Resolución=Tirada (2+), MW por éxito=Tirada 1×D3; and another with Tipo Unidad=Vehicle, same hits and resolution, MW por éxito=Tirada 2×D3

## ADDED Requirements

### Requirement: Extended Phase Selector

The structuring form's phase selector (labelled "Fase") SHALL offer six values: `Cualquiera`, `Movimiento`, `Disparo`, `Carga`, `Combate`, `Mando`. These map to data model values `ANY`, `MOVEMENT`, `SHOOTING`, `CHARGE`, `FIGHT`, `COMMAND`.

#### Scenario: All phases available in dropdown

- **WHEN** the user opens the phase dropdown in the structuring form
- **THEN** six options are visible: Cualquiera, Movimiento, Disparo, Carga, Combate, Mando

#### Scenario: Default phase is Cualquiera

- **WHEN** a new structuring row is created
- **THEN** the phase selector defaults to Cualquiera (ANY)

### Requirement: Trigger Toggle Switch

The trigger input SHALL be an inline toggle switch instead of a checkbox. When the switch is OFF, the ability applies always (trigger = `"ALWAYS"`, `autoApply` = true) and no text input is shown. When the switch is ON, a text input appears inline for the trigger question. The layout is horizontal: label "Trigger", toggle switch, conditional text input — all on the same line.

#### Scenario: Switch OFF hides text input

- **WHEN** the trigger toggle is OFF
- **THEN** no text input is visible for the trigger field
- **AND** the ability's trigger is set to `"ALWAYS"` with `autoApply: true`

#### Scenario: Switch ON shows text input

- **WHEN** the trigger toggle is switched ON
- **THEN** a text input appears inline to the right of the toggle
- **AND** the user can type a trigger question

#### Scenario: Default state is OFF

- **WHEN** a new structuring row is created with trigger `"ALWAYS"`
- **THEN** the toggle switch defaults to OFF

### Requirement: Compact Form Layout

The structuring form SHALL arrange its top-level fields in a compact row layout:
- **Row 1**: Contexto, Fase, Trigger (toggle + text)
- **Row 2**: Target, Categoría
- **Row N**: Category-specific fields

Target and Categoría SHALL always be visible on the same row regardless of the selected category.

#### Scenario: Target and Category on same row

- **WHEN** the structuring form is displayed
- **THEN** the Target dropdown and Categoría dropdown appear on the same horizontal row
- **AND** this row is below the Contexto/Fase/Trigger row and above category-specific fields

### Requirement: Heal Effect Category Stub

The structuring form's category dropdown SHALL include a `Curar` (heal) option. When selected, no category-specific fields are shown beyond the Target dropdown. The effect is stored with `category: "heal"` and `appliedTo` only.

#### Scenario: Heal category shows no extra fields

- **WHEN** the user selects "Curar" from the category dropdown
- **THEN** no additional fields appear below the Target/Category row
- **AND** the effect is stored as `{ category: "heal", appliedTo: <selected target> }`

#### Scenario: Heal category in dropdown

- **WHEN** the user opens the category dropdown
- **THEN** "Curar" appears as an option alongside Stats, Tirada, Palabra Clave, Mitigación Daño, and Heridas Mortales
