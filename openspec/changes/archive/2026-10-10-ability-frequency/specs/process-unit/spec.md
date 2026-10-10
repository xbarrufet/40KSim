# Spec Delta

## ADDED Requirements

### Requirement: Frequency Selector in Structuring Form

The structuring form SHALL include a "Frecuencia" dropdown on the first descriptor row (alongside Contexto, Fase, and Trigger). Values: `Siempre` (default), `1/fase`, `1/ronda`, `1/partida`. These map to data model values `'always'`, `'perPhase'`, `'perRound'`, `'perBattle'`.

#### Scenario: Default frequency is Siempre

- **WHEN** a new structuring row is created
- **THEN** the frequency selector defaults to "Siempre"

#### Scenario: All frequency options available

- **WHEN** the user opens the frequency dropdown
- **THEN** four options are visible: Siempre, 1/fase, 1/ronda, 1/partida

#### Scenario: Frequency shown in ability summary

- **WHEN** a reviewed ability has a non-default frequency (not 'always')
- **THEN** the one-line summary includes the frequency label (e.g. "[1/partida]")

#### Scenario: Frequency preserved on edit

- **WHEN** the user edits a reviewed ability that has `frequency: 'perBattle'`
- **THEN** the frequency dropdown shows "1/partida" pre-selected
