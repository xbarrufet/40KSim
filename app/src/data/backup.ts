import type { FactionBackup } from './schema'
import {
  fetchUnitsByFaction,
  fetchAllBaseDataByFaction,
  fetchAllUnitDataByFaction,
  fetchAllLoadoutDataByFaction,
  fetchAllDetachmentDataByFaction,
  upsertUnit,
  upsertBaseData,
  upsertUnitData,
  upsertLoadoutData,
  upsertDetachmentData,
} from './supabase'

export async function exportFactionBackup(factionSlug: string): Promise<void> {
  const [units, baseData, unitData, loadoutData, detachmentData] = await Promise.all([
    fetchUnitsByFaction(factionSlug),
    fetchAllBaseDataByFaction(factionSlug),
    fetchAllUnitDataByFaction(factionSlug),
    fetchAllLoadoutDataByFaction(factionSlug),
    fetchAllDetachmentDataByFaction(factionSlug),
  ])

  const backup: FactionBackup = {
    format: '40ksim-faction-backup',
    version: 1,
    factionSlug,
    exportedAt: new Date().toISOString(),
    units: units.map(u => ({
      slug: u.slug,
      name: u.name,
      category: u.category ?? undefined,
      points: u.points ?? undefined,
      keywords: u.keywords,
    })),
    baseData: baseData.map(b => ({ unitSlug: b.unit_slug, data: b.data })),
    unitData: unitData.map(u => ({
      unitSlug: u.unit_slug,
      tag: u.tag,
      abilities: u.abilities,
      rawAbilities: u.raw_abilities,
      baseDataHash: u.base_data_hash ?? undefined,
    })),
    loadoutData: loadoutData.map(l => ({
      unitSlug: l.unit_slug,
      tag: l.tag,
      options: l.options,
    })),
    detachmentData: detachmentData.map(d => ({
      detachmentSlug: d.detachment_slug,
      tag: d.tag,
      data: d.data,
      enhancements: d.enhancements,
    })),
  }

  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${factionSlug}-backup.json`
  a.click()
  URL.revokeObjectURL(url)
}

export type BackupValidationResult =
  | { ok: true; backup: FactionBackup }
  | { ok: false; error: string }

export function validateBackupFile(json: string, expectedFactionSlug: string): BackupValidationResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { ok: false, error: 'El archivo no es JSON válido.' }
  }

  const obj = parsed as Record<string, unknown>
  if (obj.format !== '40ksim-faction-backup') {
    return { ok: false, error: 'El archivo no es un backup de facción válido (formato incorrecto).' }
  }
  if (obj.factionSlug !== expectedFactionSlug) {
    return { ok: false, error: `El backup es de la facción "${obj.factionSlug}", pero estás en "${expectedFactionSlug}".` }
  }

  return { ok: true, backup: parsed as FactionBackup }
}

export async function importFactionBackup(factionSlug: string, backup: FactionBackup): Promise<void> {
  for (const unit of backup.units) {
    await upsertUnit({
      faction_slug: factionSlug,
      slug: unit.slug,
      name: unit.name,
      category: unit.category ?? null,
      points: unit.points ?? null,
      keywords: unit.keywords,
    })
  }

  for (const bd of backup.baseData) {
    await upsertBaseData(factionSlug, bd.unitSlug, bd.data)
  }

  for (const ud of backup.unitData) {
    await upsertUnitData(factionSlug, ud.unitSlug, {
      tag: ud.tag as 'PENDING' | 'AI_PROPOSED' | 'CONFIRMED',
      abilities: ud.abilities,
      rawAbilities: ud.rawAbilities,
      baseDataHash: ud.baseDataHash,
    })
  }

  for (const ld of backup.loadoutData) {
    await upsertLoadoutData(factionSlug, ld.unitSlug, {
      tag: ld.tag as 'PENDING' | 'AI_PROPOSED' | 'CONFIRMED',
      options: ld.options,
    })
  }

  for (const dd of backup.detachmentData ?? []) {
    await upsertDetachmentData(factionSlug, dd.detachmentSlug, {
      tag: dd.tag as 'SCRAPED' | 'PENDING' | 'AI_PROPOSED' | 'CONFIRMED',
      data: dd.data,
      enhancements: dd.enhancements,
    })
  }
}
