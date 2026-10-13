# Design

## Context

See proposal.md for motivation. The app already has all the Supabase fetch functions needed (`fetchUnitsByFaction`, `fetchAllBaseDataByFaction`, `fetchAllUnitDataByFaction`, `fetchAllLoadoutDataByFaction`) and all the upsert functions (`upsertUnit`, `upsertBaseData`, `upsertUnitData`, `upsertLoadoutData`). The feature is a thin orchestration layer on top of these.

The faction detail view (`UnitsView.tsx`) already has upload buttons for BaseData and AI proposals — the backup buttons follow the same pattern.

## Goals / Non-Goals

**Goals:**
- One-click download of all faction data as a portable JSON file
- One-click restore from a backup file with validation and confirmation
- Self-contained backup format that can be shared or version-controlled

**Non-Goals:**
- Incremental/differential backups
- Cross-faction backup (one file per faction)
- Automatic scheduled backups
- Backup of army lists (those are local-only by spec)

## Decisions

### 1. Single JSON file per faction

One file contains everything: units, baseData, unitData, loadoutData. Simple to produce, simple to restore, easy to inspect manually.

**Alternative**: Separate files per data type. Rejected — adds complexity without benefit for a backup use case.

### 2. Browser download via Blob URL

Use `URL.createObjectURL(new Blob([json]))` with a hidden `<a>` element to trigger download. Standard pattern for PWAs, no server needed.

### 3. Upsert semantics on restore

Restore uses the existing `upsert` functions (which do `ON CONFLICT ... DO UPDATE`). This means restoring a backup overwrites current data for matching keys, but does not delete units that exist in Supabase but not in the backup.

**Alternative**: Delete-then-insert. Rejected — destructive and risky if the backup is partial.

### 4. Buttons in the faction detail toolbar

Download and upload buttons sit in the existing toolbar of `UnitsView.tsx`, alongside the existing BaseData upload and AI proposals import buttons. Uses `Download` and `Upload` icons from lucide-react.

### 5. Validation before restore

The restore flow validates: (a) valid JSON, (b) `format === "40ksim-faction-backup"`, (c) `factionSlug` matches current faction. Then shows a confirmation modal with record counts before proceeding.

## Risks / Trade-offs

- **Large backups**: Factions with many units and full BaseData can produce large JSON files (several MB). Mitigation: acceptable for backup use case; the browser handles it fine.
- **No delete on restore**: If a unit was removed from a faction since the backup, restoring won't delete the extra unit. Mitigation: acceptable — backup is additive, not destructive.
