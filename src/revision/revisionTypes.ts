/**
 * Self-Revision Layer Types
 * Minimal implementation for SRM-1: tracking divergences and proposed changes
 */

export type ChangeStatus = 'ephemeral' | 'provisional' | 'promoted' | 'reverted'

export type ProposedChange =
  | { id: string; kind: 'relation_weight'; key: string; delta: number; reason: string; status: ChangeStatus }
  | { id: string; kind: 'pattern_weight'; key: string; delta: number; reason: string; status: ChangeStatus }
  | { id: string; kind: 'home_trigger'; key: string; delta: number; reason: string; status: ChangeStatus }
  | { id: string; kind: 'tone_bias'; key: string; delta: number; reason: string; status: ChangeStatus }

export type RevisionEntry = {
  id: string
  timestamp: string
  inputText: string
  rawReply: string
  adjustedReply: string
  issueTags: string[]
  note: string
  proposedChanges: ProposedChange[]
  status: ChangeStatus
}

export type PlasticityState = {
  nodeBoosts: Record<string, number>
  relationBoosts: Record<string, number>
  patternBoosts: Record<string, number>
  homeTriggerAdjust: Record<string, number>
  toneBias: Record<string, number>
  lastUpdated: string
}

export type MemoryState = {
  entries: RevisionEntry[]
  promoted: RevisionEntry[]
  ephemeral: RevisionEntry[]
  maxEphemeralSize: number
  lastCleanup: string
}

export type UserTuningAction = 'keep' | 'soften' | 'revert' | 'lock'

export type UserTuningState = {
  locked: Set<string>
  softened: Set<string>
  reverted: Set<string>
  kept: Set<string>
}

export type RevisionState = {
  plasticity: PlasticityState
  memory: MemoryState
  tuning: UserTuningState
}

export type RevisionSummary = {
  totalEntries: number
  ephemeralCount: number
  provisionalCount: number
  promotedCount: number
  revertedCount: number
  topIssues: Array<{ tag: string; count: number }>
  recentChanges: ProposedChange[]
}
