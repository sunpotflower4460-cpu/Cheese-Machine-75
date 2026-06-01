// Build an ObservationCrystal from pipeline results
// This is the main record unit of Cheese Machine 75
//
// 写像 M11: Raw + Measured + Inferred → ObservationCrystal
// このファイルは複数の観測層をひとつの記録単位（Crystal）に結晶化する責務を担う。
//
// Crystal が束ねる層:
//   Raw      ... rawImageUri, sourceType (元画像 URI・観測起点)
//   Measured ... features (EventFeatures) — M2 出力、Raw から直接抽出した特徴量のみ
//   Inferred ... pipelineResult (nodes/bindings/patterns/stateVector), guideBundle, homeCheck
//                — M4/M6/M8/M10 出力。測定値から pipeline が推定・構築したもの
//   Revised  ... revisionHistory, memoryLinks, recheckFlag — 事後改訂・再評価

import type { GuideBundle, ObservationCrystal, ObservationHomeCheck, ObservationPipelineResult } from '../types/observation'
import { deriveMeasuredSource } from './observation/measuredSource'
import { linkSimilarEvents } from './revision/linkSimilarEvents'

const createId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `crystal_${crypto.randomUUID()}`
    : `crystal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

/**
 * M11: Raw + Measured + Inferred → ObservationCrystal
 *
 * pipelineResult (Inferred: nodes/bindings/patterns/stateVector, M4/M6)、
 * guideBundle (Inferred: M10)、homeCheck (Inferred: M8)、
 * および既存のアーカイブを受け取り、ObservationCrystal を構築する。
 *
 * Measured 層は features (pipelineResult.input.features) のみ。
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
    sourceType: pipelineResult.input.sourceType ?? 'sample',
    features: pipelineResult.input.features,
    measuredSource: pipelineResult.input.measuredSource ?? deriveMeasuredSource(pipelineResult.input.sourceType),
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
