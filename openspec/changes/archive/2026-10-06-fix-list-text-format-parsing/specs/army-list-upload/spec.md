# Spec Delta

## MODIFIED Requirements

### Requirement: List Parsing

The system SHALL parse a pasted 40k.app army list export into: a title, a faction, a free-text army name, a free-text detachment name, a mission, a declared points total, an export list URL (if present), and one entry per unit block. The export has no markdown decoration; hierarchy is conveyed by indentation depth alone: category headers are unindented, each unit entry's own line is indented one level deeper than its category header, and a unit entry's sub-lines (Attached to/Led by/Supported by/Enhancement/wargear) are indented one level deeper still.

#### Scenario: Header line parsed
- **WHEN** the pasted text's second line has the form `<Faction> · <army name> · <detachment>`
- **THEN** the parsed list's faction, army name, and detachment are set from that line's three segments respectively

#### Scenario: Category header parsed
- **WHEN** an unindented line has the form `<CATEGORY NAME> [<points> pts]`
- **THEN** subsequent unit entries are associated with that category, until the next category header

#### Scenario: Unit entry parsed
- **WHEN** a line indented one level deeper than its category header has the form `<unit name> [<points> pts]`, optionally followed by ` (<N> models)`
- **THEN** an entry is created under the current category, with that unit name, points, and model count
- **AND** any subsequent sub-line reading `Attached to <name>`, `Led by <name>`, `Supported by <name>`, or `Enhancement: <name> (+<points> pts)` belonging to that entry is captured on the entry as free text
- **AND** the entry's wargear sub-line (if present) is captured on the entry as free text

#### Scenario: List URL captured
- **WHEN** the pasted text's footer contains a 40k.app list URL (e.g. `https://www.40k.app/lists/<id>`), whether inline or on its own line
- **THEN** that URL is stored on the parsed list as its external list URL
