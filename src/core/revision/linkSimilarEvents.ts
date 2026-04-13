// Link similar observation crystals by feature similarity
// MVP implementation: simple Euclidean-like distance on features

import type { EventFeatures, ObservationCrystal } from '../../types/observation'

function featureDistance(a: EventFeatures, b: EventFeatures): number {
  const keys: Array<keyof EventFeatures> = ['brightness', 'length', 'width', 'linearity', 'curvature', 'scatterScore', 'clusterScore', 'rarityScore', 'noiseScore']
  const sum = keys.reduce((acc, k) => acc + Math.pow(a[k] - b[k], 2), 0)
  return Math.sqrt(sum / keys.length)
}

/** Return up to `maxLinks` similar crystal IDs for a given crystal */
export function linkSimilarEvents(crystal: ObservationCrystal, archive: ObservationCrystal[], maxLinks = 5): string[] {
  const candidates = archive.filter((c) => c.id !== crystal.id)
  return candidates
    .map((c) => ({ id: c.id, dist: featureDistance(crystal.features, c.features) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, maxLinks)
    .map((c) => c.id)
}
