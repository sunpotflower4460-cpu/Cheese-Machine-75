import type { RevisionState, RevisionSummary } from './revisionTypes'

/**
 * Get summary statistics about the revision state
 * Used for displaying overview in the Revision tab
 */
export const getRevisionSummary = (state: RevisionState): RevisionSummary => {
  const allEntries = state.memory.entries

  // Count by status
  const ephemeralCount = allEntries.filter(e => e.status === 'ephemeral').length
  const provisionalCount = allEntries.filter(e => e.status === 'provisional').length
  const promotedCount = allEntries.filter(e => e.status === 'promoted').length
  const revertedCount = allEntries.filter(e => e.status === 'reverted').length

  // Aggregate issue tags
  const issueMap = new Map<string, number>()
  allEntries.forEach(entry => {
    entry.issueTags.forEach(tag => {
      issueMap.set(tag, (issueMap.get(tag) || 0) + 1)
    })
  })

  const topIssues = Array.from(issueMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Get recent changes (last 10)
  const recentChanges = allEntries
    .flatMap(entry => entry.proposedChanges)
    .sort((a, b) => {
      // Sort by ID which contains timestamp
      return b.id.localeCompare(a.id)
    })
    .slice(0, 10)

  return {
    totalEntries: allEntries.length,
    ephemeralCount,
    provisionalCount,
    promotedCount,
    revertedCount,
    topIssues,
    recentChanges,
  }
}
