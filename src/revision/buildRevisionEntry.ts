import type { NodePipelineResult, StudioViewModel } from '../types/nodeStudio'
import type { RevisionEntry } from './revisionTypes'
import { buildProposedChanges } from './buildProposedChanges'

const generateId = () => `rev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

/**
 * Build a RevisionEntry from a completed interaction
 * This captures what happened and what could be improved
 */
export const buildRevisionEntry = (
  result: NodePipelineResult,
  studioView: StudioViewModel,
): RevisionEntry => {
  const { changes, issues } = buildProposedChanges(result, studioView)

  // Generate a note summarizing what happened
  let note = ''
  if (studioView.homeCheck.needsReturn) {
    note = `Home return triggered: ${studioView.homeCheck.reason}. `
  }
  if (issues.length > 0) {
    note += `Detected ${issues.length} potential improvement(s).`
  } else {
    note += 'No major issues detected.'
  }

  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    inputText: result.inputText,
    rawReply: studioView.rawReplyPreview,
    adjustedReply: studioView.adjustedReplyPreview,
    issueTags: issues,
    note,
    proposedChanges: changes,
    status: 'ephemeral',
  }
}
