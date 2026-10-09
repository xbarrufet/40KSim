# Tasks

## 1. Fix the text lookup in `startEditing`

- [x] 1.1 In `app/src/home/ProcessUnitView.tsx`, replace the single-lookup line in `startEditing`:
  ```ts
  setEditingAbilityText(baseDataAbilitiesMap[ability.name] ?? null)
  ```
  with a three-step fallback:
  ```ts
  const baseName = ability.name.replace(/\s+\(efecto \d+\)$/, '')
  setEditingAbilityText(
    baseDataAbilitiesMap[ability.name] ??
    baseDataAbilitiesMap[baseName] ??
    (draft.rawAbilities.find((r) => r.name === baseName || r.name === ability.name)?.text ?? null)
  )
  ```
  Verify: `npm run build` in `app/` succeeds with no type errors.

## 2. End-to-end verification

- [x] 2.1 Open the Process Unit screen for a unit with a fanned-out ability (e.g. a unit where one raw ability was structured into two effects). Click "Editar" on the second structured entry (named "X (efecto 2)"). Confirm: the original ability text from the BaseData is shown above the form.

- [x] 2.2 Open the Process Unit screen for a unit whose raw ability text is still in `rawAbilities` (not yet reviewed). Structure it, producing one reviewed entry. Without reloading, click "Editar" on that entry. Confirm: the original text is shown.
