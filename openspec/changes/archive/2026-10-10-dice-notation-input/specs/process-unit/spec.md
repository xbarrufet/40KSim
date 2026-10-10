# Spec Delta

## ADDED Requirements

### Requirement: Dice Notation Input Component

The structuring form SHALL provide a reusable text input for dice notation values. The input SHALL accept strings matching the dice notation format (e.g. `"3"`, `"D6"`, `"2D3+1"`). The input SHALL NOT validate on keystroke — validation occurs on save only.

#### Scenario: User types valid notation

- **WHEN** the user types `"2D6"` into a dice notation input
- **THEN** the input accepts the text without error feedback
- **AND** the value is stored as the string `"2D6"`

#### Scenario: User types invalid notation

- **WHEN** the user types `"abc"` into a dice notation input and saves
- **THEN** the save is blocked and the input is highlighted with an error indicator
- **AND** the user can correct the value and retry

### Requirement: Save-Time Validation

The "Guardar" action on the Process Unit screen SHALL validate all dice notation fields in structured abilities before saving. If any field contains an invalid notation string, the save SHALL be blocked and the invalid fields SHALL be visually highlighted.

#### Scenario: All fields valid

- **WHEN** the user clicks "Guardar" and all dice notation fields contain valid notation
- **THEN** the save proceeds normally

#### Scenario: Invalid field blocks save

- **WHEN** the user clicks "Guardar" and one dice notation field contains `"D4"`
- **THEN** the save is blocked
- **AND** the invalid field is highlighted with an error style

## MODIFIED Requirements

### Requirement: Mortal Wounds Category in Structuring Form

The per-ability structuring form SHALL offer a "mortalWounds" (`Heridas Mortales`) effect category. When selected, the form SHALL expose the following fields:

- **Tipo Unidad**: dropdown with values `Todas`, `Vehicle`, `Infantry`, `Monster`, `Character`, `Mounted`, `Fly`, `Walker`, `Titanic`. Default: `Todas`.
- **Impactos** (hits): a selector between two modes:
  - `Notación`: a dice notation text input (e.g. `"1"`, `"D6"`, `"2D3+1"`). Default: `"1"`.
  - `Por Stats`: dropdown of unit stats (`Nº Modelos`, `Movement`, `Toughness`, etc.).
- **Resolución**: strategy selector with two options:
  - `Siempre`: no additional fields.
  - `Tirada`: threshold input (2–6) on 1D6.
- **MW por éxito** (damagePerSuccess): a dice notation text input. Default: `"1"`.

The previous dropdown combos (Fijo/Tirada with sub-selectors for count and dice) are replaced by the dice notation text inputs.

#### Scenario: Default mortal wounds effect

- **WHEN** the user selects the "Heridas Mortales" category for a new effect
- **THEN** the form shows Tipo Unidad=Todas, Impactos=Notación `"1"`, Resolución=Siempre, MW por éxito=`"1"`

#### Scenario: Configuring Haywire Mine damage

- **WHEN** the user configures a mortal wounds effect with rolled damage
- **THEN** the user types `"D3"` in the MW por éxito field instead of selecting Tirada > 1 > D3 from dropdowns
