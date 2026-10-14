# Spec Delta

## ADDED Requirements

### Requirement: Army Rules in Factions Table

The `factions` table SHALL have an `army_rules` column (JSONB, nullable) storing the faction's army rules as an array of rule objects with `name` and `components`.

#### Scenario: Faction with army rules
- **WHEN** the `factions` table is queried for a faction with army rules
- **THEN** the `army_rules` column SHALL contain a JSON array of rule objects

#### Scenario: Faction without army rules
- **WHEN** the `factions` table is queried for a faction without army rules
- **THEN** the `army_rules` column SHALL be null

### Requirement: Army Rules Client Function

The Supabase client module SHALL provide `fetchArmyRules(factionSlug)` that returns the army rules for a faction, falling back to the parent faction for subfactions.

#### Scenario: Fetching army rules for a parent faction
- **WHEN** `fetchArmyRules("space-marines")` is called
- **THEN** it SHALL return the army rules from the `factions` row

#### Scenario: Fetching army rules for a subfaction
- **WHEN** `fetchArmyRules("blood-angels")` is called and Blood Angels has no army rules
- **THEN** it SHALL fall back to the parent faction (Space Marines) army rules
