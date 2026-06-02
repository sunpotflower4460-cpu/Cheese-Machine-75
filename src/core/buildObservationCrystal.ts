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

import type {
  AnalysisProvenance,
  DetectionAlgorithmId,
  GuideBundle,
  MeasuredSource,
  MorphologyCandidate,
  ObservationCrystal,
  ObservationHomeCheck,
  ObservationPipelineResult,
  ObservationSourceType,
} from '../types/observation'
import { deriveMeasuredSource } from './observation/measuredSource'
import { linkSimilarEvents } from './revision/linkSimilarEvents'
import { classifyMorphology } from './morphology/classifyMorphology'

/** Current analysis pipeline version — bump when the algorithm changes. */
const ANALYSIS_VERSION = '0.1.0'

const createId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `crystal_${crypto.randomUUID()}`
    : `crystal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

// ---------------------------------------------------------------------------
// Provenance helpers
// ---------------------------------------------------------------------------

function deriveAlgorithmId(source: MeasuredSource): DetectionAlgorithmId {
  switch (source) {
    case 'sample-authored':       return 'authored-v1'
    case 'placeholder-dimension': return 'placeholder-v1'
    case 'pixel-derived':         return 'pixel-edge-v1'
    case 'calibrated-pixel':      return 'pixel-edge-v1'
    case 'temporal-difference':   return 'temporal-diff-v1'
    case 'external-agent':        return 'external-agent-v1'
  }
}

function deriveRawInputKind(
  sourceType: ObservationSourceType | undefined,
): AnalysisProvenance['rawInputKind'] {
  switch (sourceType) {
    case 'uploaded-image': return 'uploaded-image'
    case 'camera':         return 'camera-frame'
    case 'sample':         return 'sample'
    default:               return 'sample'
  }
}

function deriveLimitations(source: MeasuredSource): string[] {
  switch (source) {
    case 'sample-authored':
      return [
        'Values authored for demo or testing purposes — not real sensor data.',
      ]
    case 'placeholder-dimension':
      return [
        'Single-frame analysis only.',
        'No dark calibration was applied.',
        'Measurement is dimension-derived placeholder.',
        'Morphology is a visual classification, not proof of origin.',
      ]
    case 'pixel-derived':
    case 'calibrated-pixel':
      return [
        'Single-frame analysis only.',
        'Morphology is a visual classification, not proof of origin.',
      ]
    case 'temporal-difference':
      return [
        'Temporal analysis requires stable session context.',
        'Morphology is a visual classification, not proof of origin.',
      ]
    case 'external-agent':
      return [
        'Values supplied by an external agent — verify independently.',
      ]
  }
}

function deriveWarnings(source: MeasuredSource): string[] {
  switch (source) {
    case 'placeholder-dimension':
      return ['No dark calibration applied.']
    case 'pixel-derived':
      return ['No dark calibration applied.']
    case 'sample-authored':
    case 'calibrated-pixel':
    case 'temporal-difference':
    case 'external-agent':
      return []
  }
}

function buildAnalysisProvenance(
  source: MeasuredSource,
  sourceType: ObservationSourceType | undefined,
  createdAt: string,
): AnalysisProvenance {
  return {
    measuredSource: source,
    algorithmId: deriveAlgorithmId(source),
    analysisVersion: ANALYSIS_VERSION,
    createdAt,
    rawInputKind: deriveRawInputKind(sourceType),
    calibrationStatus: source === 'calibrated-pixel' ? 'applied' : 'none',
    limitations: deriveLimitations(source),
    warnings: deriveWarnings(source),
  }
}

/** Build a provenance preview (without a fixed timestamp) for display before saving. */
export function previewAnalysisProvenance(
  source: MeasuredSource,
  sourceType: ObservationSourceType | undefined,
): AnalysisProvenance {
  return buildAnalysisProvenance(source, sourceType, new Date().toISOString())
}

// ---------------------------------------------------------------------------
// Crystal builder
// ---------------------------------------------------------------------------

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
  const createdAt = new Date().toISOString()
  const sourceType = pipelineResult.input.sourceType
  const measuredSource =
    pipelineResult.input.measuredSource ?? deriveMeasuredSource(sourceType)

  const morphologyCandidate: MorphologyCandidate = classifyMorphology(pipelineResult.input.features)

  const crystal: ObservationCrystal = {
    id: createId(),
    createdAt,
    rawImageUri: pipelineResult.input.rawImageUri ?? '',
    overlayImageUri: '',
    sourceType: sourceType ?? 'sample',
    features: pipelineResult.input.features,
    measuredSource,
    analysisProvenance: buildAnalysisProvenance(measuredSource, sourceType, createdAt),
    pipelineResult,
    guideBundle,
    homeCheck,
    morphologyCandidate,
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
