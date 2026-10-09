# Proposal

## Why

The Process Unit screen already shows the original BaseData ability text above the structuring form when editing a reviewed ability — but the lookup silently fails in two common scenarios, leaving the text box blank: (1) fanned-out abilities whose names have an `(efecto N)` suffix appended at fan-out time (`"Hammer of Wrath (efecto 2)"` doesn't match the BaseData key `"Hammer of Wrath"`), and (2) any ability in a unit whose `rawAbilities` list still contains the original text but whose name isn't in `baseDataAbilitiesMap` because BaseData wasn't uploaded in this session.

## What Changes

- In `startEditing`, broaden the ability text lookup from a single exact name lookup to a three-step fallback chain:
  1. `baseDataAbilitiesMap[ability.name]` — exact match (current behaviour)
  2. `baseDataAbilitiesMap[stripFanOutSuffix(ability.name)]` — strips `(efecto N)` to find the parent ability
  3. `draft.rawAbilities.find(r => r.name === baseName)?.text` — falls back to the unit's own pending `rawAbilities` list

- No schema changes, no new state, no new props.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `process-unit`: MODIFIED requirement — Datasheet Context Display — the edit form now reliably shows the original ability text regardless of fan-out naming or upload order.

## Impact

- `app/src/home/ProcessUnitView.tsx` — three-line change to `startEditing`.
