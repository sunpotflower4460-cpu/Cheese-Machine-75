// Observation Crystal storage – localStorage-based for MVP
// One event = one ObservationCrystal

import type { ObservationCrystal, ObservationRevisionEntry } from '../types/observation'

const STORAGE_KEY = 'cheese_machine_crystals'

const canUseLocalStorage = (): boolean => typeof localStorage !== 'undefined'

export function loadCrystals(): ObservationCrystal[] {
  if (!canUseLocalStorage()) {
    return []
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ObservationCrystal[]
    // Migrate older crystals that may not have sourceType
    return parsed.map((c) => (c.sourceType ? c : { ...c, sourceType: 'sample' as const }))
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
