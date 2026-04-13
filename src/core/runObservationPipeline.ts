// Observation Pipeline for Cheese Machine 75
// Parallel to runNodePipeline but for observation input
// Philosophy: field judgment → reaction → stance → home return → guide → revision → memory

import { OBS_BINDING_RULES, OBS_CORE_NODES, OBS_PATTERN_RULES } from './observationNodeData'
import type {
  EventFeatures,
  ObservationBinding,
  ObservationInput,
  ObservationNode,
  ObservationPattern,
  ObservationPipelineResult,
  ObservationStateVector,
  SuppressedObservationNode,
} from '../types/observation'

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

/** Activate observation nodes based on extracted event features */
function retrieveObsNodes(features: EventFeatures): {
  activatedNodes: ObservationNode[]
  suppressedNodes: SuppressedObservationNode[]
  debugNotes: string[]
} {
  const nodes: ObservationNode[] = []
  const debug: string[] = []

  const activate = (id: string, value: number, reasons: string[]) => {
    const def = OBS_CORE_NODES.find((n) => n.id === id)
    if (!def) return
    nodes.push({ id: def.id, label: def.label, category: def.category, value: Math.min(value, 0.98), reasons })
    debug.push(`Retrieved: ${id} (${value.toFixed(2)})`)
  }

  // Signal nodes
  if (features.linearity > 0.65 && features.length > 0.3) {
    activate('linear_trace', 0.5 + features.linearity * 0.4, ['linearity > 0.65, length > 0.3'])
  }
  if (features.scatterScore > 0.5) {
    activate('scattered_path', 0.4 + features.scatterScore * 0.5, ['scatterScore > 0.5'])
  }
  if (features.clusterScore > 0.55 && features.length < 0.3) {
    activate('clustered_flash', 0.4 + features.clusterScore * 0.4, ['clusterScore > 0.55, short length'])
  }
  if (features.brightness > 0.7 && features.linearity > 0.7 && features.noiseScore < 0.3) {
    activate('strong_signal', 0.5 + features.brightness * 0.3, ['high brightness, high linearity, low noise'])
  }
  if (features.brightness < 0.35 && features.noiseScore < 0.5) {
    activate('faint_trace', 0.45 + (1 - features.brightness) * 0.2, ['low brightness event'])
  }
  if (features.curvature > 0.5 && features.length > 0.25) {
    activate('curved_track', 0.4 + features.curvature * 0.4, ['curvature > 0.5'])
  }

  // Artifact nodes
  if (features.noiseScore > 0.6 && features.brightness > 0.7 && features.length < 0.15) {
    activate('hot_pixel_pattern', 0.5 + features.noiseScore * 0.3, ['high noise + high brightness + very short'])
  }
  if (features.noiseScore > 0.55 && features.rarityScore < 0.4) {
    activate('thermal_noise_bias', 0.45 + features.noiseScore * 0.35, ['elevated noise, low rarity'])
  }

  // Context nodes
  if (features.noiseScore < 0.2) {
    activate('low_noise_context', 0.6 + (0.2 - features.noiseScore) * 2, ['very low noise score'])
  }

  // Hypothesis nodes
  if (features.rarityScore > 0.6) {
    activate('unusual_event', 0.45 + features.rarityScore * 0.4, ['high rarity score'])
  }
  if (features.linearity > 0.6 && features.noiseScore < 0.4 && features.rarityScore > 0.4) {
    activate('possible_particle_candidate', 0.5 + features.linearity * 0.2 + features.rarityScore * 0.2, [
      'linearity > 0.6, low noise, notable rarity',
    ])
  }
  if (features.noiseScore > 0.6 && features.rarityScore < 0.5) {
    activate('likely_sensor_artifact', 0.5 + features.noiseScore * 0.3, ['high noise + low rarity = artifact indicators'])
  }
  if (features.rarityScore > 0.45 && features.noiseScore > 0.35) {
    activate('worth_recheck', 0.45 + features.rarityScore * 0.2, ['moderate rarity + noise ambiguity'])
  }

  // Geometry nodes
  if (features.linearity > 0.5 || features.curvature > 0.4) {
    activate('geometry_hint', 0.4 + Math.max(features.linearity, features.curvature) * 0.3, ['geometric feature present'])
  }
  if (features.scatterScore > 0.4 && features.clusterScore > 0.4) {
    activate('multi_origin_possibility', 0.4 + (features.scatterScore + features.clusterScore) * 0.2, ['scatter + cluster both elevated'])
  }
  if (features.width > 0.4 && features.scatterScore > 0.3) {
    activate('double_track_hint', 0.35 + features.width * 0.3, ['wide track with scatter'])
  }

  // Default artifact bias if very few nodes activated
  if (nodes.filter((n) => n.category !== 'system').length < 2) {
    activate('artifact_bias', 0.55, ['insufficient clear signal – defaulting to artifact prior'])
  }

  // Derived hypotheses
  const hasNode = (id: string) => nodes.some((n) => n.id === id)
  if (hasNode('possible_particle_candidate')) {
    activate('simulation_recommended', 0.5, ['particle candidate warrants simulation comparison'])
    if (features.rarityScore > 0.7) {
      activate('cross_device_match_needed', 0.55, ['high rarity particle candidate needs cross-device confirmation'])
    }
  }
  if (hasNode('strong_signal') && !hasNode('likely_sensor_artifact') && features.noiseScore < 0.35) {
    activate('archive_worthy', 0.6 + features.rarityScore * 0.2, ['clean strong signal – archive candidate'])
  }

  // Suppression
  const suppressed: SuppressedObservationNode[] = []
  if (hasNode('likely_sensor_artifact') && hasNode('possible_particle_candidate')) {
    const candidate = nodes.find((n) => n.id === 'possible_particle_candidate')
    if (candidate) {
      suppressed.push({ id: 'possible_particle_candidate', label: 'possible_particle_candidate', value: candidate.value * 0.5, reason: 'Suppressed by likely_sensor_artifact' })
      nodes.splice(nodes.indexOf(candidate), 1)
    }
  }
  suppressed.forEach((s) => debug.push(`Suppressed: ${s.id}`))

  return { activatedNodes: nodes, suppressedNodes: suppressed, debugNotes: debug }
}

function bindObsNodes(nodes: ObservationNode[]): { bindings: ObservationBinding[]; debugNotes: string[] } {
  const bindings: ObservationBinding[] = []
  const debug: string[] = []
  const nodeIds = nodes.map((n) => n.id)

  OBS_BINDING_RULES.forEach((rule) => {
    if (nodeIds.includes(rule.source) && nodeIds.includes(rule.target)) {
      const src = nodes.find((n) => n.id === rule.source)!
      const tgt = nodes.find((n) => n.id === rule.target)!
      const weight = (src.value + tgt.value) / 2
      bindings.push({
        id: `b_${rule.source}_${rule.target}`,
        source: rule.source,
        target: rule.target,
        type: rule.type,
        weight,
        reasons: [`${rule.source} and ${rule.target} co-activated`],
      })
      debug.push(`Bound: ${rule.source} -> ${rule.target} (${rule.type})`)
    }
  })

  return { bindings, debugNotes: debug }
}

function liftObsPatterns(nodes: ObservationNode[], bindings: ObservationBinding[]): { liftedPatterns: ObservationPattern[]; debugNotes: string[] } {
  const patterns: ObservationPattern[] = []
  const debug: string[] = []
  const nodeIds = nodes.map((n) => n.id)

  OBS_PATTERN_RULES.forEach((rule) => {
    if (rule.reqNodes.every((id) => nodeIds.includes(id))) {
      const matchedNodes = rule.reqNodes.map((id) => nodes.find((n) => n.id === id)).filter((n): n is ObservationNode => n !== undefined)
      const score = matchedNodes.reduce((sum, n) => sum + n.value, 0) / matchedNodes.length
      patterns.push({
        id: rule.id,
        label: rule.label,
        score,
        matchedNodes: rule.reqNodes,
        matchedRelations: bindings
          .filter((b) => rule.reqNodes.includes(b.source) && rule.reqNodes.includes(b.target))
          .map((b) => `${b.source}->${b.target}`),
      })
      debug.push(`Lifted Pattern: ${rule.id}`)
    }
  })

  return { liftedPatterns: patterns, debugNotes: debug }
}

function analyzeObsField(nodes: ObservationNode[], features: EventFeatures): { stateVector: ObservationStateVector; debugNotes: string[] } {
  const hasNode = (id: string) => nodes.some((n) => n.id === id)

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

  const clamp = (v: number) => Math.max(0, Math.min(1, v))
  for (const k of Object.keys(stateVector) as Array<keyof ObservationStateVector>) {
    stateVector[k] = clamp(stateVector[k])
  }

  return { stateVector, debugNotes: ['Observation field analyzed.'] }
}

export function runObservationPipeline(input: ObservationInput): ObservationPipelineResult {
  const start = now()
  const { activatedNodes, suppressedNodes, debugNotes: dn1 } = retrieveObsNodes(input.features)
  const { bindings, debugNotes: dn2 } = bindObsNodes(activatedNodes)
  const { liftedPatterns, debugNotes: dn3 } = liftObsPatterns(activatedNodes, bindings)
  const { stateVector, debugNotes: dn4 } = analyzeObsField(activatedNodes, input.features)
  const elapsedMs = now() - start

  return {
    input,
    activatedNodes: activatedNodes.sort((a, b) => b.value - a.value),
    suppressedNodes,
    bindings: bindings.sort((a, b) => b.weight - a.weight),
    liftedPatterns: liftedPatterns.sort((a, b) => b.score - a.score),
    stateVector,
    debugNotes: ['ObservationPipeline start', ...dn1, ...dn2, ...dn3, ...dn4, `Completed in ${elapsedMs.toFixed(2)} ms`],
    meta: { retrievalCount: activatedNodes.length, bindingCount: bindings.length, patternCount: liftedPatterns.length, elapsedMs },
  }
}
