// Build an ObservationCrystal from pipeline results
// This is the main record unit of Cheese Machine 75

import type { GuideBundle, ObservationCrystal, ObservationHomeCheck, ObservationPipelineResult } from '../types/observation'
import { linkSimilarEvents } from './revision/linkSimilarEvents'

const createId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `crystal_${crypto.randomUUID()}`
    : `crystal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export function buildObservationCrystal(
  pipelineResult: ObservationPipelineResult,
  guideBundle: GuideBundle,
  homeCheck: ObservationHomeCheck,
  archive: ObservationCrystal[] = [],
): ObservationCrystal {
  const crystal: ObservationCrystal = {
    id: createId(),
    createdAt: new Date().toISOString(),
    rawImageUri: pipelineResult.input.rawImageUri ?? '',
    overlayImageUri: '',
    features: pipelineResult.input.features,
    pipelineResult,
    guideBundle,
    homeCheck,
    revisionHistory: [],
    memoryLinks: [],
    recheckFlag: homeCheck.cautionUp || homeCheck.softenClaim,
    tags: deriveTags(pipelineResult),
  }

  // Link to similar events
  crystal.memoryLinks = linkSimilarEvents(crystal, archive)

  return crystal
}

function deriveTags(result: ObservationPipelineResult): string[] {
  const tags: string[] = []
  const hasNode = (id: string) => result.activatedNodes.some((n) => n.id === id)

  if (hasNode('possible_particle_candidate')) tags.push('particle-candidate')
  if (hasNode('likely_sensor_artifact')) tags.push('artifact')
  if (hasNode('linear_trace')) tags.push('linear')
  if (hasNode('curved_track')) tags.push('curved')
  if (hasNode('unusual_event')) tags.push('unusual')
  if (hasNode('worth_recheck')) tags.push('recheck')
  if (hasNode('archive_worthy')) tags.push('notable')

  return tags
}
