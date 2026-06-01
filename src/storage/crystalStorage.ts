// Observation Crystal storage – localStorage-based for MVP
// One event = one ObservationCrystal

import type { AnalysisProvenance, ObservationCrystal, ObservationRevisionEntry } from '../types/observation'

const STORAGE_KEY = 'cheese_machine_crystals'

const canUseLocalStorage = (): boolean => typeof localStorage !== 'undefined'

/** Minimal provenance stub for crystals saved before AnalysisProvenance was introduced. */
function migrateProvenance(c: ObservationCrystal): ObservationCrystal {
  if (c.analysisProvenance) return c
  const source = c.measuredSource ?? 'sample-authored'
  const provenance: AnalysisProvenance = {
    measuredSource: source,
    algorithmId: source === 'placeholder-dimension' ? 'placeholder-v1' : 'authored-v1',
    analysisVersion: '0.0.0',
    createdAt: c.createdAt,
    rawInputKind: c.sourceType === 'uploaded-image' ? 'uploaded-image' : c.sourceType === 'camera' ? 'camera-frame' : 'sample',
    calibrationStatus: 'none',
    limitations: ['Provenance record unavailable — this crystal was saved before provenance tracking was added.'],
    warnings: [],
  }
  return { ...c, analysisProvenance: provenance }
}

export function loadCrystals(): ObservationCrystal[] {
  if (!canUseLocalStorage()) {
    return []
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ObservationCrystal[]
    // Migrate older crystals that may not have sourceType or analysisProvenance
    return parsed
      .map((c) => (c.sourceType ? c : { ...c, sourceType: 'sample' as const }))
      .map(migrateProvenance)
  } catch {
    return []
  }
}

export function saveCrystals(crystals: ObservationCrystal[]): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(crystals))
  } catch {
    // Storage quota exceeded or unavailable
  }
}

export function addCrystal(crystal: ObservationCrystal): ObservationCrystal[] {
  const current = loadCrystals()
  const updated = [crystal, ...current]
  saveCrystals(updated)
  return updated
}

export function updateCrystal(id: string, updates: Partial<ObservationCrystal>): ObservationCrystal[] {
  const current = loadCrystals()
  const updated = current.map((c) => (c.id === id ? { ...c, ...updates } : c))
  saveCrystals(updated)
  return updated
}

export function addRevisionToCrystal(crystalId: string, entry: ObservationRevisionEntry): ObservationCrystal[] {
  const current = loadCrystals()
  const updated = current.map((c) =>
    c.id === crystalId ? { ...c, revisionHistory: [...c.revisionHistory, entry] } : c,
  )
  saveCrystals(updated)
  return updated
}

export function deleteCrystal(id: string): ObservationCrystal[] {
  const current = loadCrystals()
  const updated = current.filter((c) => c.id !== id)
  saveCrystals(updated)
  return updated
}

export function clearCrystals(): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable
  }
}
