import type { RevisionState } from './revisionTypes'
import { createDefaultRevisionState } from './defaultRevisionState'

const STORAGE_KEY = 'node-ai-z:revision-state'

/**
 * Serialize RevisionState for localStorage
 * Note: Set objects need special handling for JSON
 */
const serializeRevisionState = (state: RevisionState): string => {
  const serializable = {
    plasticity: state.plasticity,
    memory: state.memory,
    tuning: {
      locked: Array.from(state.tuning.locked),
      softened: Array.from(state.tuning.softened),
      reverted: Array.from(state.tuning.reverted),
      kept: Array.from(state.tuning.kept),
    },
  }
  return JSON.stringify(serializable)
}

/**
 * Deserialize RevisionState from localStorage
 */
const deserializeRevisionState = (json: string): RevisionState => {
  const parsed = JSON.parse(json)
  return {
    plasticity: parsed.plasticity,
    memory: parsed.memory,
    tuning: {
      locked: new Set(parsed.tuning.locked || []),
      softened: new Set(parsed.tuning.softened || []),
      reverted: new Set(parsed.tuning.reverted || []),
      kept: new Set(parsed.tuning.kept || []),
    },
  }
}

export const loadRevisionState = (): RevisionState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return createDefaultRevisionState()
    }
    return deserializeRevisionState(stored)
  } catch (error) {
    console.error('Failed to load revision state:', error)
    return createDefaultRevisionState()
  }
}

export const saveRevisionState = (state: RevisionState): void => {
  try {
    const serialized = serializeRevisionState(state)
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    console.error('Failed to save revision state:', error)
  }
}

export const clearRevisionState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear revision state:', error)
  }
}
