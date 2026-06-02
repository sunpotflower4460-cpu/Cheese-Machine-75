// Morphology Catalog for Cheese Machine 75
// Describes each cautious shape class used in morphology candidate classification.
//
// Morphology is a visual/geometry classification only — NOT a physical origin claim.
// Use careful wording: "track-like morphology", not "muon track".

import type { MorphologyClass } from '../../types/observation'

export type MorphologyCatalogEntry = {
  /** Shape class identifier */
  morphologyClass: MorphologyClass
  /**
   * Display label for UI use — always uses cautious, non-claiming language.
   * Examples: "track-like morphology", "spot-like candidate"
   */
  displayLabel: string
  /** Brief description of what this shape class represents visually/geometrically */
  description: string
  /**
   * Geometry conditions associated with this class.
   * These are informational — the actual rules are in classifyMorphology.ts.
   */
  geometryHints: string[]
  /**
   * Standard caution note to attach whenever this class is applied.
   * Reminds users this is a shape observation, not a physical claim.
   */
  standardCaution: string
}

export const MORPHOLOGY_CATALOG: Record<MorphologyClass, MorphologyCatalogEntry> = {
  track: {
    morphologyClass: 'track',
    displayLabel: 'track-like morphology',
    description: 'A long, narrow, and highly linear signal — visually resembles a straight track.',
    geometryHints: ['high linearity', 'long normalized length', 'narrow width'],
    standardCaution: 'Track-like morphology is a shape observation only. It does not confirm particle origin.',
  },
  worm: {
    morphologyClass: 'worm',
    displayLabel: 'worm-like morphology',
    description: 'A curved or sinuous signal of non-trivial length — resembles a worm or bent trace.',
    geometryHints: ['moderate to high curvature', 'non-trivial length', 'non-linear path'],
    standardCaution: 'Worm-like morphology describes shape only. Curvature alone does not indicate particle species.',
  },
  spot: {
    morphologyClass: 'spot',
    displayLabel: 'spot-like candidate',
    description: 'A small, compact, near-circular signal — consistent with a point-like or brief deposit.',
    geometryHints: ['small length', 'small width', 'compact extent'],
    standardCaution: 'Spot-like morphology is a shape observation. It does not distinguish particle from noise.',
  },
  cluster: {
    morphologyClass: 'cluster',
    displayLabel: 'cluster-like pattern',
    description: 'A dense, low-linearity region — visually resembles a blob or group of activated pixels.',
    geometryHints: ['high cluster score', 'low linearity', 'broad extent'],
    standardCaution: 'Cluster-like morphology describes a dense region. Physical cause is not determined from shape alone.',
  },
  artifact: {
    morphologyClass: 'artifact',
    displayLabel: 'artifact-like pattern',
    description: 'Pattern consistent with sensor artifacts — high noise, hot-pixel overlap, or quality flag indicators.',
    geometryHints: ['elevated noise score', 'high brightness with very short extent', 'quality flags present'],
    standardCaution: 'Artifact-like pattern suggests sensor or calibration origin. Treat with caution before further analysis.',
  },
  unknown: {
    morphologyClass: 'unknown',
    displayLabel: 'unknown morphology',
    description: 'Geometry is insufficient or conflicting — no confident shape class could be assigned.',
    geometryHints: ['ambiguous or mixed geometry', 'conflicting feature values'],
    standardCaution: 'Morphology could not be confidently classified. More data or calibration may be needed.',
  },
}

/** Look up a catalog entry by morphology class */
export function getMorphologyCatalogEntry(morphologyClass: MorphologyClass): MorphologyCatalogEntry {
  return MORPHOLOGY_CATALOG[morphologyClass]
}
