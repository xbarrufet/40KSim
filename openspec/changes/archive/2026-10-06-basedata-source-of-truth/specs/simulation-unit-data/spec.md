# Spec Delta

## MODIFIED Requirements

### Requirement: Simulation Unit Structure

A simulation unit SHALL be assembled, whenever it is needed for display or simulation, by combining a unit's live BaseData (`id`, `slug`, `name`, `keywords`, `stats`, `wargear` with weapon profiles) with its StructuredAbilitiesData (`tag`, `abilities` with structured rules). Only the StructuredAbilitiesData portion SHALL be persisted; the BaseData-derived portion SHALL be read fresh from BaseData each time, never stored as a separate copy.

#### Scenario: Unit with basic stats
- **WHEN** a simulation unit is assembled for a given unit slug
- **THEN** its `id`, `slug`, `name`, `keywords[]`, and `stats` object (movement, toughness, save, invulnerableSave, wounds, leadership, objectiveControl) come from that unit's current BaseData record
- **AND** its `tag` and `abilities` come from that unit's StructuredAbilitiesData record

#### Scenario: No duplicate storage to go stale
- **WHEN** a unit's BaseData is re-uploaded with changed stats or wargear
- **THEN** the next simulation unit assembled for that slug reflects the updated BaseData immediately
- **AND** no separately stored stats/wargear copy needs to be synced or can go stale

### Requirement: UnitData Review Tag

A StructuredAbilitiesData record SHALL include a `tag` field whose value is `"PENDING"` or `"CONFIRMED"`, indicating whether it has passed manual review on the Process Unit screen.

#### Scenario: Newly generated UnitData
- **WHEN** StructuredAbilitiesData is generated automatically from a BaseData upload
- **THEN** its `tag` is `"PENDING"`

#### Scenario: Reviewed and saved UnitData
- **WHEN** a user saves the Process Unit screen for a unit
- **THEN** its `tag` is `"CONFIRMED"`
