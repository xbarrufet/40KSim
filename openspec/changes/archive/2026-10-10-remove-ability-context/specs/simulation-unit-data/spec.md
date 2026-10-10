# Spec Delta

## REMOVED Requirements

### Requirement: Ability Types

**Reason**: The `type` field (Always/AsLeader/Alone) is redundant with the effect-level `appliedTo` field which already conveys the targeting context.
**Migration**: Remove `type` field from `StructuredAbility` and `OtherAbility`. Old data with `type` is harmless — the field is ignored at runtime.
