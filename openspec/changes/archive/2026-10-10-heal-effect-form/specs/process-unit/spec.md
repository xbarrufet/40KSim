# Spec Delta

## MODIFIED Requirements

### Requirement: Heal Effect Category Stub
The structuring form's category dropdown SHALL include a `Curar` (heal) option. When selected, the form SHALL expose an **Amount** field: a dice notation text input (e.g. `"1"`, `"D6"`, `"1D3+3"`). The effect is stored with `category: "heal"`, `appliedTo`, and `amount`.

#### Scenario: Heal form fields
- **WHEN** the user selects "Curar" as the effect category
- **THEN** the form SHALL display a dice notation input labelled "Cantidad" with a default value of `"1"`

#### Scenario: Dice notation validation on save
- **WHEN** the user saves a heal effect with an invalid notation string
- **THEN** the save SHALL be blocked and the field SHALL be visually highlighted as invalid

#### Scenario: Describe heal effect
- **WHEN** a reviewed ability has a heal effect with `amount: "1D3+3"`
- **THEN** the ability summary SHALL display `Curar 1D3+3` instead of `Curar (stub)`
