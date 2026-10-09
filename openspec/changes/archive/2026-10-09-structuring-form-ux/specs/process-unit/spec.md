# Spec Delta

## MODIFIED Requirements

### Requirement: Manual Re-Sync

The Process Unit screen SHALL offer two manual reconciliation actions against the unit's current BaseData, both available at any time independent of the upload flow. "Re-sincronizar" adds abilities that are in the live BaseData but not yet in the reviewed or pending queues. "Re-sincronizar sin cambios" acknowledges a BaseData update as non-breaking — it updates the sync marker without touching reviewed abilities or the pending queue, for cases where only stats, descriptions, or other non-rule content changed.

#### Scenario: Syncing a points update

- **WHEN** a unit's BaseData has been re-uploaded with an ability not already present in the unit's reviewed `abilities` or pending `rawAbilities`, and the user triggers "Re-sincronizar"
- **THEN** that new ability is added to the pending `rawAbilities` queue
- **AND** previously structured, removed, or OTHER-marked abilities are not discarded

#### Scenario: Re-sync without changes when only stats changed

- **WHEN** a unit's BaseData has been re-uploaded with updated stats or description text but no new abilities, and the user triggers "Re-sincronizar sin cambios"
- **THEN** the unit's sync marker is updated to match the current BaseData
- **AND** `abilities` and `rawAbilities` are left unchanged

## ADDED Requirements

### Requirement: BaseData Change Indicator

The Process Unit screen SHALL display a visible warning at the top when the currently stored BaseData differs from the BaseData that was in use when the unit's structured abilities were last confirmed.

#### Scenario: BaseData updated after confirmation

- **WHEN** a unit's BaseData has been re-uploaded since the last time its structured abilities were confirmed
- **THEN** the Process Unit screen shows a warning indicator at the top of the screen before the user takes any action

#### Scenario: No indicator after confirming with current BaseData

- **WHEN** the user confirms the unit's structured abilities (or uses "Re-sincronizar sin cambios") and the BaseData has not changed since
- **THEN** no warning indicator is shown when the screen is next opened

#### Scenario: No indicator for units that have never been confirmed

- **WHEN** a unit's structured abilities have never been confirmed (tag is `PENDING`) and no BaseData hash is stored
- **THEN** no change warning is shown — the unit is already in an unreviewed state
