# Spec Delta

## MODIFIED Requirements

### Requirement: Unit List

The unit list for a faction SHALL display each unit with a status indicator. The indicator SHALL reflect three states: red for units with no reviewed abilities (`PENDING`), amber for units with AI-proposed abilities awaiting human review (`AI_PROPOSED`), and green for units that have been manually confirmed (`CONFIRMED`).

#### Scenario: Red indicator for unprocessed unit

- **WHEN** a unit's StructuredAbilitiesData has `tag: "PENDING"` or no StructuredAbilitiesData record exists
- **THEN** the unit's status indicator is red

#### Scenario: Amber indicator for AI-proposed unit

- **WHEN** a unit's StructuredAbilitiesData has `tag: "AI_PROPOSED"`
- **THEN** the unit's status indicator is amber

#### Scenario: Green indicator for confirmed unit

- **WHEN** a unit's StructuredAbilitiesData has `tag: "CONFIRMED"`
- **THEN** the unit's status indicator is green
