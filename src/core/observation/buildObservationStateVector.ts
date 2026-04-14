import type {
  EventFeatures,
  ObservationBinding,
  ObservationNode,
  ObservationPattern,
  ObservationStateVector,
  StateContributionMap,
  StateContributor,
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
}: ObservationStateVectorMappingInput): { stateVector: ObservationStateVector; contributions: StateContributionMap; debugNotes: string[] } {
  const hasNode = (id: string) => nodes.some((node) => node.id === id)
  const nodeLabel = (id: string) => nodes.find((n) => n.id === id)?.label ?? id

  const contributions: StateContributionMap = {
    confidence: [],
    artifactRisk: [],
    particleLikelihood: [],
    noiseLevel: [],
    raritySignal: [],
    geometryClarity: [],
    claimStrength: [],
    caution: [],
  }

  const addContribution = (key: keyof ObservationStateVector, contributor: StateContributor) => {
    if (!contributions[key]) contributions[key] = []
    contributions[key]!.push(contributor)
  }

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

  addContribution('confidence', { sourceType: 'feature', sourceId: 'prior', label: 'Baseline prior', weight: stateVector.confidence, reason: 'Default confidence before nodes/patterns are considered.' })
  addContribution('artifactRisk', { sourceType: 'feature', sourceId: 'noiseScore', label: 'Noise score', weight: stateVector.artifactRisk, reason: 'Higher noise raises perceived artifact risk.' })
  addContribution('particleLikelihood', { sourceType: 'feature', sourceId: 'prior', label: 'Baseline particle prior', weight: stateVector.particleLikelihood, reason: 'Neutral prior before evidence.' })
  addContribution('noiseLevel', { sourceType: 'feature', sourceId: 'noiseScore', label: 'Noise score', weight: features.noiseScore, reason: 'Measured noise level.' })
  addContribution('raritySignal', { sourceType: 'feature', sourceId: 'rarityScore', label: 'Rarity score', weight: features.rarityScore, reason: 'Measured rarity contributes directly to raritySignal.' })
  addContribution('geometryClarity', { sourceType: 'feature', sourceId: 'linearity', label: 'Linearity', weight: features.linearity, reason: 'Higher linearity clarifies geometry.' })
  addContribution('geometryClarity', { sourceType: 'feature', sourceId: 'curvature', label: 'Curvature', weight: 1 - features.curvature, reason: 'Lower curvature keeps tracks easy to follow.' })
  addContribution('claimStrength', { sourceType: 'feature', sourceId: 'prior', label: 'Baseline claim prior', weight: stateVector.claimStrength, reason: 'Conservative claim baseline.' })
  addContribution('caution', { sourceType: 'feature', sourceId: 'prior', label: 'Caution baseline', weight: stateVector.caution, reason: 'Default caution until signals tilt either way.' })

  if (hasNode('possible_particle_candidate')) {
    stateVector.particleLikelihood += 0.3
    stateVector.confidence += 0.2
    stateVector.claimStrength += 0.25
    addContribution('particleLikelihood', { sourceType: 'node', sourceId: 'possible_particle_candidate', label: nodeLabel('possible_particle_candidate'), weight: 0.3, reason: 'Particle candidate node boosts likelihood.' })
    addContribution('confidence', { sourceType: 'node', sourceId: 'possible_particle_candidate', label: nodeLabel('possible_particle_candidate'), weight: 0.2, reason: 'Candidate node lifts confidence.' })
    addContribution('claimStrength', { sourceType: 'node', sourceId: 'possible_particle_candidate', label: nodeLabel('possible_particle_candidate'), weight: 0.25, reason: 'Supports making a stronger claim.' })
  }
  if (hasNode('likely_sensor_artifact')) {
    stateVector.artifactRisk += 0.3
    stateVector.confidence -= 0.15
    stateVector.caution += 0.3
    addContribution('artifactRisk', { sourceType: 'node', sourceId: 'likely_sensor_artifact', label: nodeLabel('likely_sensor_artifact'), weight: 0.3, reason: 'Artifact indicators raise risk.' })
    addContribution('confidence', { sourceType: 'node', sourceId: 'likely_sensor_artifact', label: nodeLabel('likely_sensor_artifact'), weight: -0.15, reason: 'Artifact suspicion lowers confidence.' })
    addContribution('caution', { sourceType: 'node', sourceId: 'likely_sensor_artifact', label: nodeLabel('likely_sensor_artifact'), weight: 0.3, reason: 'Calls for caution in interpretation.' })
  }
  if (hasNode('linear_trace')) {
    stateVector.particleLikelihood += 0.2
    stateVector.confidence += 0.1
    addContribution('particleLikelihood', { sourceType: 'node', sourceId: 'linear_trace', label: nodeLabel('linear_trace'), weight: 0.2, reason: 'Linear geometry aligns with particle hypothesis.' })
    addContribution('confidence', { sourceType: 'node', sourceId: 'linear_trace', label: nodeLabel('linear_trace'), weight: 0.1, reason: 'Linear trace supports confidence.' })
  }
  if (hasNode('low_noise_context')) {
    stateVector.confidence += 0.15
    stateVector.artifactRisk -= 0.2
    addContribution('confidence', { sourceType: 'node', sourceId: 'low_noise_context', label: nodeLabel('low_noise_context'), weight: 0.15, reason: 'Low-noise context boosts confidence.' })
    addContribution('artifactRisk', { sourceType: 'node', sourceId: 'low_noise_context', label: nodeLabel('low_noise_context'), weight: -0.2, reason: 'Low noise reduces artifact concerns.' })
  }
  if (hasNode('unusual_event')) {
    stateVector.raritySignal += 0.2
    stateVector.caution += 0.1
    addContribution('raritySignal', { sourceType: 'node', sourceId: 'unusual_event', label: nodeLabel('unusual_event'), weight: 0.2, reason: 'Unusual event raises rarity signal.' })
    addContribution('caution', { sourceType: 'node', sourceId: 'unusual_event', label: nodeLabel('unusual_event'), weight: 0.1, reason: 'Unusual events warrant caution until validated.' })
  }
  if (hasNode('worth_recheck')) {
    stateVector.caution += 0.2
    addContribution('caution', { sourceType: 'node', sourceId: 'worth_recheck', label: nodeLabel('worth_recheck'), weight: 0.2, reason: 'Marked for recheck; keep caution elevated.' })
  }
  if (hasNode('archive_worthy')) {
    stateVector.claimStrength += 0.15
    stateVector.confidence += 0.1
    addContribution('claimStrength', { sourceType: 'node', sourceId: 'archive_worthy', label: nodeLabel('archive_worthy'), weight: 0.15, reason: 'Archive-worthy signals allow stronger claims.' })
    addContribution('confidence', { sourceType: 'node', sourceId: 'archive_worthy', label: nodeLabel('archive_worthy'), weight: 0.1, reason: 'Archive-worthy classification increases confidence.' })
  }

  patterns.forEach((pattern) => {
    addContribution('particleLikelihood', {
      sourceType: 'pattern',
      sourceId: pattern.id,
      label: pattern.label,
      weight: undefined,
      reason: 'Pattern match provides contextual support for the particle hypothesis.',
    })
  })

  const clamp = (value: number) => Math.max(0, Math.min(1, value))
  for (const key of Object.keys(stateVector) as Array<keyof ObservationStateVector>) {
    stateVector[key] = clamp(stateVector[key])
  }

  return {
    stateVector,
    contributions,
    debugNotes: [
      `M6 mapped ${nodes.length} nodes, ${bindings.length} bindings, ${patterns.length} patterns into ObservationStateVector.`,
    ],
  }
}
