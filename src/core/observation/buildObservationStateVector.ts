import type {
  EventFeatures,
  ObservationBinding,
  ObservationNode,
  ObservationPattern,
  ObservationStateVector,
} from '../../types/observation'

export type ObservationStateVectorMappingInput = {
  nodes: ObservationNode[]
  bindings: ObservationBinding[]
  patterns: ObservationPattern[]
  features: EventFeatures
}

/**
 * M6: Nodes / Bindings / Patterns / Features → ObservationStateVector
 *
 * 観測ノード場の発火状況と測定特徴量をまとめて、
 * 「どれくらい確からしいか / どれくらい注意すべきか」を表す
 * ObservationStateVector へ写像する。
 */
export function buildObservationStateVector({
  nodes,
  bindings,
  patterns,
  features,
}: ObservationStateVectorMappingInput): { stateVector: ObservationStateVector; debugNotes: string[] } {
  const hasNode = (id: string) => nodes.some((node) => node.id === id)

  const stateVector: ObservationStateVector = {
    confidence: 0.4,
    artifactRisk: features.noiseScore * 0.7,
    particleLikelihood: 0.3,
    noiseLevel: features.noiseScore,
    raritySignal: features.rarityScore,
    geometryClarity: features.linearity * 0.6 + (1 - features.curvature) * 0.4,
    claimStrength: 0.3,
    caution: 0.3,
  }

  if (hasNode('possible_particle_candidate')) {
    stateVector.particleLikelihood += 0.3
    stateVector.confidence += 0.2
    stateVector.claimStrength += 0.25
  }
  if (hasNode('likely_sensor_artifact')) {
    stateVector.artifactRisk += 0.3
    stateVector.confidence -= 0.15
    stateVector.caution += 0.3
  }
  if (hasNode('linear_trace')) {
    stateVector.particleLikelihood += 0.2
    stateVector.confidence += 0.1
  }
  if (hasNode('low_noise_context')) {
    stateVector.confidence += 0.15
    stateVector.artifactRisk -= 0.2
  }
  if (hasNode('unusual_event')) {
    stateVector.raritySignal += 0.2
    stateVector.caution += 0.1
  }
  if (hasNode('worth_recheck')) {
    stateVector.caution += 0.2
  }
  if (hasNode('archive_worthy')) {
    stateVector.claimStrength += 0.15
    stateVector.confidence += 0.1
  }

  const clamp = (value: number) => Math.max(0, Math.min(1, value))
  for (const key of Object.keys(stateVector) as Array<keyof ObservationStateVector>) {
    stateVector[key] = clamp(stateVector[key])
  }

  return {
    stateVector,
    debugNotes: [
      `M6 mapped ${nodes.length} nodes, ${bindings.length} bindings, ${patterns.length} patterns into ObservationStateVector.`,
    ],
  }
}
