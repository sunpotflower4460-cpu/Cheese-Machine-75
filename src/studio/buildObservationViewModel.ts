// Observation Studio ViewModel builder
// Converts pipeline + guide + home check into a display model
// Parallel to buildStudioViewModel.ts but for observation domain

import type { GuideBundle, ObservationCrystal, ObservationHomeCheck, ObservationPipelineResult } from '../types/observation'
import { OBS_NODE_DICT, OBS_PATTERN_RULES } from '../core/observationNodeData'

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

export type ObservationViewModel = {
  summaryCard: ObservationSummaryCard
  guidePreview: GuideBundle
  cautionSummary: { level: 'low' | 'medium' | 'high'; notes: string[] }
  activeSignals: Array<{ id: string; label: string; value: number; category: string; description: string }>
  patternCards: ObservationPatternCard[]
  revisionCards: Array<{ id: string; timestamp: string; note: string; trigger: string }>
  internalProcessLines: ObservationInternalLine[]
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
    { stage: 'State Vector', content: `confidence=${sv.confidence.toFixed(2)}, artifactRisk=${sv.artifactRisk.toFixed(2)}, particleLikelihood=${sv.particleLikelihood.toFixed(2)}` },
    { stage: 'Home Check', content: homeCheck.reasons.join('; ') },
    { stage: 'Guide', content: guide.quickGuide.slice(0, 80) + '...' },
  ]

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

  return { summaryCard, guidePreview: guide, cautionSummary, activeSignals, patternCards, revisionCards, internalProcessLines, overlayHints }
}
