// Morphology candidate classifier for Cheese Machine 75
//
// Classifies measured EventFeatures geometry into cautious morphology candidates.
// Classification is conservative and visual/geometric only — no physical origin is claimed.
//
// Rules (applied in priority order):
//   1. artifact  — high noise + high brightness + very short extent
//   2. track     — high linearity + sufficient length + narrow width
//   3. worm      — moderate/high curvature + non-trivial length
//   4. cluster   — high cluster score + low linearity + moderate area
//   5. spot      — small compact signal (short and narrow)
//   6. unknown   — conflicting or insufficient geometry (fallback)
//
// If quality indicators are poor (high noiseScore), confidence is down-weighted
// and caution notes are added.

import type { EventFeatures, MorphologyCandidate, MorphologyClass } from '../../types/observation'
import { getMorphologyCatalogEntry } from './morphologyCatalog'

// ---------------------------------------------------------------------------
// Thresholds — conservative, can be tuned as more data becomes available
// ---------------------------------------------------------------------------

const ARTIFACT_NOISE_MIN = 0.60
const ARTIFACT_BRIGHTNESS_MIN = 0.65
const ARTIFACT_LENGTH_MAX = 0.20

const TRACK_LINEARITY_MIN = 0.70
const TRACK_LENGTH_MIN = 0.30
const TRACK_WIDTH_MAX = 0.30

const WORM_CURVATURE_MIN = 0.45
const WORM_LENGTH_MIN = 0.20

const CLUSTER_CLUSTER_SCORE_MIN = 0.50
const CLUSTER_LINEARITY_MAX = 0.40

const SPOT_LENGTH_MAX = 0.18
const SPOT_WIDTH_MAX = 0.20

// Down-weight confidence when noise is elevated
const QUALITY_NOISE_CAUTION_THRESHOLD = 0.45
const QUALITY_NOISE_HIGH_THRESHOLD = 0.65

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build a MorphologyCandidate from classification outputs.
 * Applies quality-based confidence down-weighting and caution notes.
 */
function buildCandidate(
  morphologyClass: MorphologyClass,
  baseConfidence: number,
  reasons: string[],
  features: EventFeatures,
): MorphologyCandidate {
  const entry = getMorphologyCatalogEntry(morphologyClass)
  const cautionNotes: string[] = [entry.standardCaution]
  let confidence = baseConfidence

  // Down-weight when noise is elevated
  if (features.noiseScore >= QUALITY_NOISE_HIGH_THRESHOLD) {
    confidence *= 0.55
    cautionNotes.push(`High noise score (${features.noiseScore.toFixed(2)}) — morphology confidence is significantly reduced.`)
  } else if (features.noiseScore >= QUALITY_NOISE_CAUTION_THRESHOLD) {
    confidence *= 0.75
    cautionNotes.push(`Elevated noise score (${features.noiseScore.toFixed(2)}) — treat morphology label with caution.`)
  }

  // Add caution if this is a non-artifact classification but noise is high
  if (morphologyClass !== 'artifact' && features.noiseScore >= ARTIFACT_NOISE_MIN) {
    cautionNotes.push('Noise level overlaps artifact range — artifact origin cannot be excluded.')
  }

  return {
    morphologyClass,
    confidence: Math.max(0, Math.min(1, parseFloat(confidence.toFixed(3)))),
    label: entry.displayLabel,
    reasons,
    cautionNotes,
  }
}

// ---------------------------------------------------------------------------
// Classifier
// ---------------------------------------------------------------------------

/**
 * Classify measured EventFeatures into a morphology candidate.
 *
 * This is an Inferred-layer operation: it takes Measured features and produces
 * a cautious shape label. Classification is visual/geometric only.
 *
 * Rules are applied in priority order:
 *   1. artifact-like  (quality/noise evidence takes precedence)
 *   2. track-like     (high linearity + long/narrow)
 *   3. worm-like      (curved + non-trivial length)
 *   4. cluster-like   (dense + low linearity)
 *   5. spot-like      (small + compact)
 *   6. unknown        (fallback)
 */
export function classifyMorphology(features: EventFeatures): MorphologyCandidate {
  const {
    linearity,
    curvature,
    length,
    width,
    brightness,
    noiseScore,
    clusterScore,
  } = features

  // 1. Artifact-like: quality/hot-pixel evidence
  if (
    noiseScore >= ARTIFACT_NOISE_MIN &&
    brightness >= ARTIFACT_BRIGHTNESS_MIN &&
    length <= ARTIFACT_LENGTH_MAX
  ) {
    return buildCandidate(
      'artifact',
      0.70 + noiseScore * 0.15,
      [
        `noiseScore ${noiseScore.toFixed(2)} ≥ ${ARTIFACT_NOISE_MIN} (artifact threshold)`,
        `brightness ${brightness.toFixed(2)} ≥ ${ARTIFACT_BRIGHTNESS_MIN}`,
        `length ${length.toFixed(2)} ≤ ${ARTIFACT_LENGTH_MAX} (very short extent)`,
      ],
      features,
    )
  }

  // 2. Track-like: high linearity, sufficient length, narrow width
  if (
    linearity >= TRACK_LINEARITY_MIN &&
    length >= TRACK_LENGTH_MIN &&
    width <= TRACK_WIDTH_MAX
  ) {
    return buildCandidate(
      'track',
      0.55 + linearity * 0.30 + length * 0.10,
      [
        `linearity ${linearity.toFixed(2)} ≥ ${TRACK_LINEARITY_MIN} (high linearity)`,
        `length ${length.toFixed(2)} ≥ ${TRACK_LENGTH_MIN} (sufficient length)`,
        `width ${width.toFixed(2)} ≤ ${TRACK_WIDTH_MAX} (narrow)`,
      ],
      features,
    )
  }

  // 3. Worm-like: curved, non-trivial length
  if (curvature >= WORM_CURVATURE_MIN && length >= WORM_LENGTH_MIN) {
    return buildCandidate(
      'worm',
      0.50 + curvature * 0.30 + length * 0.10,
      [
        `curvature ${curvature.toFixed(2)} ≥ ${WORM_CURVATURE_MIN} (moderate/high curvature)`,
        `length ${length.toFixed(2)} ≥ ${WORM_LENGTH_MIN} (non-trivial length)`,
      ],
      features,
    )
  }

  // 4. Cluster-like: dense region, low linearity
  if (clusterScore >= CLUSTER_CLUSTER_SCORE_MIN && linearity <= CLUSTER_LINEARITY_MAX) {
    return buildCandidate(
      'cluster',
      0.50 + clusterScore * 0.30,
      [
        `clusterScore ${clusterScore.toFixed(2)} ≥ ${CLUSTER_CLUSTER_SCORE_MIN} (dense region)`,
        `linearity ${linearity.toFixed(2)} ≤ ${CLUSTER_LINEARITY_MAX} (low linearity)`,
      ],
      features,
    )
  }

  // 5. Spot-like: small compact component
  if (length <= SPOT_LENGTH_MAX && width <= SPOT_WIDTH_MAX) {
    return buildCandidate(
      'spot',
      0.55 + (SPOT_LENGTH_MAX - length) * 1.5,
      [
        `length ${length.toFixed(2)} ≤ ${SPOT_LENGTH_MAX} (small extent)`,
        `width ${width.toFixed(2)} ≤ ${SPOT_WIDTH_MAX} (compact)`,
      ],
      features,
    )
  }

  // 6. Unknown: insufficient or conflicting geometry
  return buildCandidate(
    'unknown',
    0.30,
    ['No geometry condition met a clear morphology threshold — ambiguous or mixed signals.'],
    features,
  )
}
