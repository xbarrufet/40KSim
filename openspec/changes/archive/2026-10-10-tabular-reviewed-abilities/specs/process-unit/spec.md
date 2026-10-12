# Spec Delta

## ADDED Requirements

### Requirement: Tabular Reviewed Abilities Display

The reviewed abilities section of the Process Unit screen SHALL display abilities in a table layout with five columns: Nombre, Fase, Freq, Trigger, and Acciones. Each structured ability's effects SHALL appear as indented sub-rows below the ability's main row, spanning all columns. Each effect sub-row SHALL show the effect category as a short label prefix followed by the effect description.

#### Scenario: Structured ability with one effect

- **WHEN** a reviewed structured ability has one effect
- **THEN** the main row shows the ability name, phase label, frequency (or empty), trigger text (or "siempre"/"auto"), and Editar/Quitar buttons in aligned columns
- **AND** one sub-row below shows the effect category label and description, indented from the left

#### Scenario: Structured ability with multiple effects

- **WHEN** a reviewed structured ability has two or more effects
- **THEN** the main row shows the ability-level data in columns as above
- **AND** each effect appears as a separate sub-row below the main row

#### Scenario: OTHER ability in table

- **WHEN** a reviewed ability has `category: "OTHER"`
- **THEN** the main row shows the ability name, an "OTHER" tag in place of phase/freq/trigger, and Editar/Quitar buttons
- **AND** the ability text appears as a sub-row spanning all columns

#### Scenario: Editing replaces the table row

- **WHEN** the user clicks Editar on a reviewed ability
- **THEN** the StructuringForm replaces the ability's main row and sub-rows in the table
- **AND** other abilities remain visible in the table above and below

#### Scenario: Phase column shows Spanish labels

- **WHEN** the phase column renders a phase value
- **THEN** it displays the Spanish label: ANY=Cualq., MOVEMENT=Mov., SHOOTING=Disp., CHARGE=Carga, FIGHT=Comb., COMMAND=Mando

#### Scenario: Trigger column shows abbreviated text

- **WHEN** the trigger is `"ALWAYS"` and `autoApply` is absent or false
- **THEN** the trigger column shows "siempre"
- **WHEN** `autoApply` is true
- **THEN** the trigger column shows "auto"
- **WHEN** the trigger is a custom question
- **THEN** the trigger column shows the question text truncated with ellipsis if it exceeds the column width
