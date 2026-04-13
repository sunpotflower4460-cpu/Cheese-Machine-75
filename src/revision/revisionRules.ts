import type { NodePipelineResult, StudioViewModel } from '../types/nodeStudio'
import type { ProposedChange } from './revisionTypes'

/**
 * Minimal rules for generating ProposedChanges based on detected issues
 * This is the core of self-revision: identifying what went wrong and proposing fixes
 */

const generateId = () => `change_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

export const analyzeIssues = (
  result: NodePipelineResult,
  studioView: StudioViewModel,
): string[] => {
  const issues: string[] = []
  const vector = result.stateVector

  // Detect common divergences
  if (studioView.homeCheck.needsReturn) {
    issues.push(`home_return_${studioView.homeCheck.reason}`)
  }

  if (vector.ambiguity > 0.8 && studioView.rawReplyPreview.length < 50) {
    issues.push('reply_too_short_for_ambiguity')
  }

  if (vector.fragility > 0.75 && studioView.rawReplyPreview.includes('しましょう')) {
    issues.push('directive_tone_on_fragility')
  }

  if (vector.urgency > 0.7 && !studioView.homeCheck.needsReturn) {
    issues.push('missed_overperformance_check')
  }

  const hasConflict = result.bindings.some(b => b.type === 'conflicts_with' || b.type === 'tension')
  if (hasConflict && !studioView.rawReplyPreview.includes('揺れ') && !studioView.rawReplyPreview.includes('引っぱられ')) {
    issues.push('conflict_not_acknowledged')
  }

  return issues
}

export const buildProposedChangesFromIssues = (
  issues: string[],
): ProposedChange[] => {
  const changes: ProposedChange[] = []

  issues.forEach(issue => {
    switch (issue) {
      case 'home_return_overperformance':
        changes.push({
          id: generateId(),
          kind: 'home_trigger',
          key: 'urgency_threshold',
          delta: -0.05,
          reason: 'Missed overperformance trigger - lower urgency threshold',
          status: 'ephemeral',
        })
        break

      case 'home_return_ambiguity_overload':
        changes.push({
          id: generateId(),
          kind: 'home_trigger',
          key: 'ambiguity_threshold',
          delta: -0.05,
          reason: 'Missed ambiguity overload - lower ambiguity threshold',
          status: 'ephemeral',
        })
        break

      case 'home_return_fragility':
        changes.push({
          id: generateId(),
          kind: 'home_trigger',
          key: 'fragility_threshold',
          delta: -0.05,
          reason: 'Missed fragility trigger - lower fragility threshold',
          status: 'ephemeral',
        })
        break

      case 'directive_tone_on_fragility':
        changes.push({
          id: generateId(),
          kind: 'tone_bias',
          key: 'directive_reduction',
          delta: 0.15,
          reason: 'Used directive tone on high fragility - increase directive reduction',
          status: 'ephemeral',
        })
        break

      case 'conflict_not_acknowledged':
        changes.push({
          id: generateId(),
          kind: 'pattern_weight',
          key: 'conflict_emphasis',
          delta: 0.1,
          reason: 'Conflict not acknowledged in reply - boost conflict pattern weight',
          status: 'ephemeral',
        })
        break

      case 'reply_too_short_for_ambiguity':
        changes.push({
          id: generateId(),
          kind: 'tone_bias',
          key: 'ambiguity_elaboration',
          delta: 0.1,
          reason: 'Reply too brief for high ambiguity - need more elaboration',
          status: 'ephemeral',
        })
        break

      case 'missed_overperformance_check':
        changes.push({
          id: generateId(),
          kind: 'home_trigger',
          key: 'urgency_sensitivity',
          delta: 0.1,
          reason: 'High urgency not caught by home check - increase sensitivity',
          status: 'ephemeral',
        })
        break
    }
  })

  return changes
}
