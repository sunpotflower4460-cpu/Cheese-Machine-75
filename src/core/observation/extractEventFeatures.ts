// Feature extraction from observation events
// For MVP: rule-based extraction from mock/sample data
// Future: replace with real image processing

import type { EventFeatures } from '../../types/observation'

/** Clamp a value between 0 and 1 */
const clamp = (v: number): number => Math.max(0, Math.min(1, v))

/** Extract features from a raw feature object (mock or real) */
export function extractEventFeatures(raw: Partial<EventFeatures>): EventFeatures {
  return {
    brightness: clamp(raw.brightness ?? 0.5),
    length: clamp(raw.length ?? 0.3),
    width: clamp(raw.width ?? 0.15),
    linearity: clamp(raw.linearity ?? 0.5),
    curvature: clamp(raw.curvature ?? 0.2),
    scatterScore: clamp(raw.scatterScore ?? 0.2),
    clusterScore: clamp(raw.clusterScore ?? 0.2),
    rarityScore: clamp(raw.rarityScore ?? 0.3),
    noiseScore: clamp(raw.noiseScore ?? 0.3),
  }
}

/** Generate a random feature set for testing */
export function randomEventFeatures(seed?: number): EventFeatures {
  let s = seed ?? Math.random() * 1000
  const r = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }
  return extractEventFeatures({
    brightness: r(),
    length: r(),
    width: r() * 0.3,
    linearity: r(),
    curvature: r() * 0.5,
    scatterScore: r() * 0.6,
    clusterScore: r() * 0.6,
    rarityScore: r(),
    noiseScore: r() * 0.7,
  })
}
