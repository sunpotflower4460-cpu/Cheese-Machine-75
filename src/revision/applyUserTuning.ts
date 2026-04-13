import type { UserTuningAction, RevisionState } from './revisionTypes'

/**
 * Apply user tuning actions to revision entries
 * This allows users to keep, soften, revert, or lock changes
 */

export const applyUserTuning = (
  state: RevisionState,
  entryId: string,
  changeId: string,
  action: UserTuningAction,
): RevisionState => {
  const newState = { ...state }

  // Update tuning state
  switch (action) {
    case 'keep':
      newState.tuning.kept.add(changeId)
      newState.tuning.softened.delete(changeId)
      newState.tuning.reverted.delete(changeId)
      // Promote change from ephemeral to provisional
      updateChangeStatus(newState, entryId, changeId, 'provisional')
      break

    case 'soften':
      newState.tuning.softened.add(changeId)
      newState.tuning.kept.delete(changeId)
      newState.tuning.reverted.delete(changeId)
      // Keep as ephemeral but mark as softened
      break

    case 'revert':
      newState.tuning.reverted.add(changeId)
      newState.tuning.kept.delete(changeId)
      newState.tuning.softened.delete(changeId)
      updateChangeStatus(newState, entryId, changeId, 'reverted')
      break

    case 'lock':
      newState.tuning.locked.add(changeId)
      // Promote to permanent
      updateChangeStatus(newState, entryId, changeId, 'promoted')
      break
  }

  return newState
}

const updateChangeStatus = (
  state: RevisionState,
  entryId: string,
  changeId: string,
  status: 'ephemeral' | 'provisional' | 'promoted' | 'reverted',
) => {
  // Find entry in memory
  const entry = state.memory.entries.find(e => e.id === entryId)
  if (!entry) return

  // Update change status
  const change = entry.proposedChanges.find(c => c.id === changeId)
  if (change) {
    change.status = status
  }

  // Update entry status based on changes
  if (entry.proposedChanges.every(c => c.status === 'reverted')) {
    entry.status = 'reverted'
  } else if (entry.proposedChanges.some(c => c.status === 'promoted')) {
    entry.status = 'promoted'
  } else if (entry.proposedChanges.some(c => c.status === 'provisional')) {
    entry.status = 'provisional'
  }
}

/**
 * Get effective delta for a change considering user tuning
 */
export const getEffectiveDelta = (
  changeId: string,
  originalDelta: number,
  tuning: RevisionState['tuning'],
): number => {
  if (tuning.reverted.has(changeId)) {
    return 0
  }
  if (tuning.softened.has(changeId)) {
    return originalDelta * 0.5
  }
  if (tuning.kept.has(changeId) || tuning.locked.has(changeId)) {
    return originalDelta
  }
  // Ephemeral: not yet applied
  return 0
}
