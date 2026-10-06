# Spec Delta

## ADDED Requirements

### Requirement: Open List Detail From Saved Lists Table

Selecting a saved list's row SHALL open the list-view screen for that list.

#### Scenario: Selecting a row opens the detail screen
- **WHEN** the user clicks a saved list's row, other than its delete button
- **THEN** the list-view screen opens for that list

#### Scenario: Back returns to the table
- **WHEN** the user navigates back from the list-view screen opened from the LIST tab
- **THEN** the saved lists table is shown again
