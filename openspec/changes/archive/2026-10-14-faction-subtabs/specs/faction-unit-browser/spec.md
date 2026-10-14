# Spec Delta

## ADDED Requirements

### Requirement: Faction Subtab Navigation

The faction detail view SHALL display a horizontal subtab bar below the faction name with three tabs: DATASHEETS, ARMY RULES, and DETACHMENTS. The DATASHEETS tab SHALL be selected by default.

#### Scenario: Subtab bar visible
- **WHEN** the user navigates to a faction detail view
- **THEN** a horizontal tab bar is displayed with DATASHEETS, ARMY RULES, and DETACHMENTS tabs
- **AND** DATASHEETS is the active tab

#### Scenario: Switching tabs
- **WHEN** the user taps a different subtab
- **THEN** the content area switches to the corresponding view
- **AND** the tapped tab becomes visually active

### Requirement: Datasheets Subtab

The DATASHEETS subtab SHALL display the existing unit list with status indicators, upload buttons, and all current functionality.

#### Scenario: Datasheets content
- **WHEN** the DATASHEETS subtab is active
- **THEN** the unit list, upload buttons, sync button, backup buttons, and proposals import button are displayed as before

### Requirement: Army Rules Subtab

The ARMY RULES subtab SHALL display the faction's army rules as formatted HTML text. For subfactions, it SHALL display the parent faction's army rules.

#### Scenario: Army rules displayed
- **WHEN** the ARMY RULES subtab is active and the faction has army rules in Supabase
- **THEN** each rule is displayed with its name as a heading and its text content rendered with FormattedAbilityText

#### Scenario: Subfaction inherits parent army rules
- **WHEN** viewing army rules for a subfaction (e.g. Blood Angels)
- **THEN** the army rules from the parent faction (Space Marines) SHALL be displayed

#### Scenario: No army rules available
- **WHEN** the faction has no army rules in Supabase
- **THEN** a message SHALL indicate that no army rules data is available

### Requirement: Detachments Subtab

The DETACHMENTS subtab SHALL display the detachments list view (currently accessible via the "DET" button), including inherited parent detachments for subfactions.

#### Scenario: Detachments content
- **WHEN** the DETACHMENTS subtab is active
- **THEN** the detachments list view is displayed with the same functionality as the current DetachmentsView

## MODIFIED Requirements

### Requirement: Faction Detail Top Bar

The faction detail view SHALL have a top bar with a back button and the faction name. The subtab bar SHALL appear below it.

#### Scenario: Top bar elements visible
- **WHEN** the user navigates to a faction detail view
- **THEN** the top bar displays a back button and the faction name
- **AND** the subtab bar is displayed below with DATASHEETS, ARMY RULES, and DETACHMENTS tabs

## REMOVED Requirements

_none_ (the "DET" button is removed from the toolbar as an implementation detail, not a spec-level removal)
