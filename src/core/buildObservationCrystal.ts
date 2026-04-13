// Build an ObservationCrystal from pipeline results
// This is the main record unit of Cheese Machine 75
//
// 写像 M11: Raw + Measured + Inferred → ObservationCrystal
// このファイルは複数の観測層をひとつの記録単位（Crystal）に結晶化する責務を担う。
//
// Crystal が束ねる層:
//   Raw      ... rawImageUri (元画像の URI)
//   Measured ... features (EventFeatures), pipelineResult.input
//   Inferred ... pipelineResult (nodes/bindings/patterns/stateVector), guideBundle
//   Revised  ... homeCheck, revisionHistory, memoryLinks, recheckFlag

import type { GuideBundle, ObservationCrystal, ObservationHomeCheck, ObservationPipelineResult } from '../types/observation'
import { linkSimilarEvents } from './revision/linkSimilarEvents'

const createId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `crystal_${crypto.randomUUID()}`
    : `crystal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

/**
 * M11: Raw + Measured + Inferred → ObservationCrystal
 *
 * pipelineResult (Measured/Inferred)、guideBundle (Inferred)、homeCheck (M8出力)、
 * および既存のアーカイブを受け取り、ObservationCrystal を構築する。
 *
 * Crystal は「結晶化された観測記録」であり、保存後も revisionHistory と memoryLinks で改訂できる。
 */
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
