// Observation Studio ViewModel builder
// Converts pipeline + guide + home check into a display model
// Parallel to buildStudioViewModel.ts but for observation domain

import type {
  GuideBundle,
  ObservationCrystal,
  ObservationHomeCheck,
  ObservationPipelineResult,
  ObservationStateVector,
  StateContributor,
} from '../types/observation'
import { OBS_NODE_DICT, OBS_PATTERN_RULES } from '../core/observationNodeData'
import { getMappingById } from '../core/mappings/mappingCatalog'

export type ObservationSummaryCard = {
  title: string
  subtitle: string
  confidence: string
  artifactRisk: string
  particleLikelihood: string
  tags: string[]
}

export type ObservationPatternCard = {
  id: string
  label: string
  score: number
  matchedNodes: string[]
  description: string
}

export type ObservationInternalLine = {
  stage: string
  content: string
}

export type ObservationMappingFlowStep = {
  id: 'raw' | 'measured' | 'nodes' | 'state' | 'caution' | 'guide' | 'crystal'
  label: string
  mappingId?: string
  active: boolean
  name?: string
  description?: string
  outputLabel?: string
  target: ObservationMappingFlowStep['id']
}

export type ObservationFeatureItem = {
  key: string
  label: string
  value: number
}

export type ObservationStateVectorItem = {
  key: keyof ObservationStateVector
  label: string
  value: number
  contributors: StateContributor[]
}

export type ObservationViewModel = {
  summaryCard: ObservationSummaryCard
  guidePreview: GuideBundle
  cautionSummary: { level: 'low' | 'medium' | 'high'; notes: string[] }
  activeSignals: Array<{ id: string; label: string; value: number; category: string; description: string }>
  patternCards: ObservationPatternCard[]
  revisionCards: Array<{ id: string; timestamp: string; note: string; trigger: string }>
  internalProcessLines: ObservationInternalLine[]
  mappingFlow: ObservationMappingFlowStep[]
  features: ObservationFeatureItem[]
  stateVectorItems: ObservationStateVectorItem[]
  flowBlurb: string
  overlayHints: string[]
}

export function buildObservationViewModel(
  result: ObservationPipelineResult,
  guide: GuideBundle,
  homeCheck: ObservationHomeCheck,
  crystal?: ObservationCrystal,
): ObservationViewModel {
  const sv = result.stateVector

  const summaryCard: ObservationSummaryCard = {
    title: result.activatedNodes.length > 0 ? result.activatedNodes[0].label.replace(/_/g, ' ') : 'No signal',
    subtitle: result.liftedPatterns.length > 0 ? result.liftedPatterns[0].label : 'No pattern matched',
    confidence: `${(sv.confidence * 100).toFixed(0)}%`,
    artifactRisk: `${(sv.artifactRisk * 100).toFixed(0)}%`,
    particleLikelihood: `${(sv.particleLikelihood * 100).toFixed(0)}%`,
    tags: crystal?.tags ?? [],
  }

  const cautionLevel: 'low' | 'medium' | 'high' =
    homeCheck.cautionUp || homeCheck.softenClaim ? 'high' : homeCheck.holdAsInteresting ? 'medium' : 'low'

  const cautionSummary = { level: cautionLevel, notes: homeCheck.reasons }

  const activeSignals = result.activatedNodes.map((n) => ({
    id: n.id,
    label: n.label,
    value: n.value,
    category: n.category,
    description: OBS_NODE_DICT[n.id]?.description ?? n.label,
  }))

  const patternCards = result.liftedPatterns.map((p) => {
    const rule = OBS_PATTERN_RULES.find((r) => r.id === p.id)
    return {
      id: p.id,
      label: p.label,
      score: p.score,
      matchedNodes: p.matchedNodes,
      description: rule?.description ?? p.label,
    }
  })

  const revisionCards = (crystal?.revisionHistory ?? []).map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    note: r.note,
    trigger: r.trigger,
  }))

  const internalProcessLines: ObservationInternalLine[] = [
    { stage: 'Feature Extraction', content: `brightness=${result.input.features.brightness.toFixed(2)}, linearity=${result.input.features.linearity.toFixed(2)}, noise=${result.input.features.noiseScore.toFixed(2)}` },
    { stage: 'Node Retrieval', content: `${result.activatedNodes.length} nodes activated, ${result.suppressedNodes.length} suppressed` },
    { stage: 'Binding', content: `${result.bindings.length} bindings formed` },
    { stage: 'Pattern Lift', content: result.liftedPatterns.length > 0 ? result.liftedPatterns.map((p) => p.label).join(', ') : 'No patterns' },
    { stage: 'M6 State Vector', content: `confidence=${sv.confidence.toFixed(2)}, artifactRisk=${sv.artifactRisk.toFixed(2)}, particleLikelihood=${sv.particleLikelihood.toFixed(2)}` },
    { stage: 'Home Check', content: homeCheck.reasons.join('; ') },
    { stage: 'Guide', content: guide.quickGuide.slice(0, 80) + '...' },
  ]

  const featureLabels: Record<string, string> = {
    brightness: 'Brightness',
    length: 'Length',
    width: 'Width',
    linearity: 'Linearity',
    curvature: 'Curvature',
    scatterScore: 'Scatter',
    clusterScore: 'Cluster',
    rarityScore: 'Rarity',
    noiseScore: 'Noise',
  }

  const features = Object.entries(result.input.features).map(([key, value]) => ({
    key,
    label: featureLabels[key] ?? key,
    value,
  }))

  const stateLabels: Record<keyof ObservationStateVector, string> = {
    confidence: 'Confidence',
    artifactRisk: 'Artifact risk',
    particleLikelihood: 'Particle likelihood',
    noiseLevel: 'Noise level',
    raritySignal: 'Rarity signal',
    geometryClarity: 'Geometry clarity',
    claimStrength: 'Claim strength',
    caution: 'Caution',
  }

  const stateVectorItems: ObservationStateVectorItem[] = (Object.keys(sv) as Array<keyof ObservationStateVector>).map((key) => ({
    key,
    label: stateLabels[key],
    value: sv[key],
    contributors: result.stateContributions[key] ?? [],
  }))

  const mapStep = (id: 'M2' | 'M4' | 'M6' | 'M8' | 'M10' | 'M11', target: ObservationMappingFlowStep['id'], label: string): ObservationMappingFlowStep => {
    const descriptor = getMappingById(id)
    return {
      id: target,
      target,
      label,
      mappingId: id,
      active: true,
      name: descriptor?.name ?? label,
      description: descriptor?.description,
      outputLabel: descriptor?.outputLabel,
    }
  }

  const mappingFlow: ObservationMappingFlowStep[] = [
    { id: 'raw', target: 'raw', label: 'Raw', active: true, description: 'Sensor frame and context' },
    mapStep('M2', 'measured', 'Measured'),
    mapStep('M4', 'nodes', 'Nodes'),
    mapStep('M6', 'state', 'State'),
    mapStep('M8', 'caution', 'Caution'),
    mapStep('M10', 'guide', 'Guide'),
    { ...mapStep('M11', 'crystal', 'Crystal'), active: crystal !== undefined },
  ]

  const flowBlurb = mappingFlow
    .filter((step) => step.mappingId)
    .map((step) => `${step.mappingId}: ${step.name ?? step.label}`)
    .join(' → ')

  const overlayHints: string[] = []
  if (result.activatedNodes.some((n) => n.id === 'simulation_recommended')) {
    overlayHints.push('Simulation overlay recommended for this event.')
  }
  if (result.activatedNodes.some((n) => n.id === 'linear_trace')) {
    overlayHints.push('A predicted straight-line overlay is available.')
  }
  if (result.activatedNodes.some((n) => n.id === 'curved_track')) {
    overlayHints.push('A simulated curved-track overlay is available.')
  }

  return {
    summaryCard,
    guidePreview: guide,
    cautionSummary,
    activeSignals,
    patternCards,
    revisionCards,
    internalProcessLines,
    mappingFlow,
    features,
    stateVectorItems,
    flowBlurb,
    overlayHints,
  }
}
