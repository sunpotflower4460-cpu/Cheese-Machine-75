import type { RevisionState, PlasticityState, MemoryState, UserTuningState } from './revisionTypes'

export const createDefaultPlasticityState = (): PlasticityState => ({
  nodeBoosts: {},
  relationBoosts: {},
  patternBoosts: {},
  homeTriggerAdjust: {},
  toneBias: {},
  lastUpdated: new Date().toISOString(),
})

export const createDefaultMemoryState = (): MemoryState => ({
  entries: [],
  promoted: [],
  ephemeral: [],
  maxEphemeralSize: 50,
  lastCleanup: new Date().toISOString(),
})

export const createDefaultUserTuningState = (): UserTuningState => ({
  locked: new Set<string>(),
  softened: new Set<string>(),
  reverted: new Set<string>(),
  kept: new Set<string>(),
})

export const createDefaultRevisionState = (): RevisionState => ({
  plasticity: createDefaultPlasticityState(),
  memory: createDefaultMemoryState(),
  tuning: createDefaultUserTuningState(),
})
