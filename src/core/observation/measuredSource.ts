// Measurement provenance helpers for Cheese Machine 75
// Single source of truth for MeasuredSource semantics.
//
// Use these helpers instead of scattering string comparisons across the codebase.

import type { MeasuredSource, ObservationSourceType } from '../../types/observation'

/**
 * Returns true only when the measurement comes from real pixel analysis.
 * Placeholder and authored values do NOT count as real measurements.
 */
export function isRealMeasuredSource(source: MeasuredSource): boolean {
  return source === 'pixel-derived' || source === 'calibrated-pixel' || source === 'temporal-difference'
}

/**
 * Returns true when claim strength should be capped because the measurement
 * provenance does not support confident sensor-derived conclusions.
 */
export function shouldCapClaimStrength(source: MeasuredSource): boolean {
  return source === 'placeholder-dimension' || source === 'sample-authored'
}

/** Human-readable label for display in badges and summaries. */
export function getMeasuredSourceLabel(source: MeasuredSource): string {
  switch (source) {
    case 'sample-authored':       return 'Authored sample'
    case 'placeholder-dimension': return 'Placeholder measurement'
    case 'pixel-derived':         return 'Pixel-derived measurement'
    case 'calibrated-pixel':      return 'Calibrated pixel measurement'
    case 'temporal-difference':   return 'Temporal-difference measurement'
    case 'external-agent':        return 'External-agent measurement'
  }
}

/**
 * Derive a sensible default MeasuredSource from an ObservationSourceType.
 * Until real pixel analysis is wired in, uploaded-image and camera inputs
 * always yield placeholder-dimension values.
 */
export function deriveMeasuredSource(sourceType: ObservationSourceType | undefined): MeasuredSource {
  switch (sourceType) {
    case 'uploaded-image': return 'placeholder-dimension'
    case 'camera':         return 'placeholder-dimension'
    case 'sample':         return 'sample-authored'
    default:               return 'sample-authored'
  }
}
