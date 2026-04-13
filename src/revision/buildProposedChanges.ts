import type { NodePipelineResult, StudioViewModel } from '../types/nodeStudio'
import type { ProposedChange } from './revisionTypes'
import { analyzeIssues, buildProposedChangesFromIssues } from './revisionRules'

/**
 * Build ProposedChanges based on pipeline result and studio view
 * This is the entry point for generating revision candidates
 */
export const buildProposedChanges = (
  result: NodePipelineResult,
  studioView: StudioViewModel,
): { changes: ProposedChange[]; issues: string[] } => {
  const issues = analyzeIssues(result, studioView)
  const changes = buildProposedChangesFromIssues(issues)

  return { changes, issues }
}
