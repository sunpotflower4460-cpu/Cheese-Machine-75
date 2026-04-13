// Guide text builder for Cheese Machine 75
// Converts pipeline results into human-readable interpretation guides
// Philosophy: do not overclaim; show what is seen, why, alternatives, and what is uncertain

import type { GuideBundle, ObservationPipelineResult } from '../../types/observation'

export function buildGuideText(result: ObservationPipelineResult): GuideBundle {
  const { stateVector, activatedNodes, liftedPatterns, input } = result
  const hasNode = (id: string) => activatedNodes.some((n) => n.id === id)
  const { features } = input

  // Quick guide – 1-2 sentences
  let quickGuide = ''
  if (stateVector.particleLikelihood > 0.65) {
    quickGuide = `This event shows features consistent with a particle track (linearity: ${features.linearity.toFixed(2)}, noise: ${features.noiseScore.toFixed(2)}). Further verification is recommended.`
  } else if (stateVector.artifactRisk > 0.65) {
    quickGuide = `Multiple artifact indicators are present (noise: ${features.noiseScore.toFixed(2)}). This event is likely a sensor artifact rather than a real particle.`
  } else if (hasNode('worth_recheck')) {
    quickGuide = `This is an ambiguous event that warrants a second look. Features are interesting but not clearly classifiable without more context.`
  } else {
    quickGuide = `Event observed with mixed indicators. Confidence is moderate. Review the full analysis below for details.`
  }

  // Deep guide
  const lines: string[] = []
  lines.push(`**What is seen:** An event with brightness ${features.brightness.toFixed(2)}, length ${features.length.toFixed(2)}, linearity ${features.linearity.toFixed(2)}.`)

  if (hasNode('linear_trace')) {
    lines.push(`The track shows high linearity (${features.linearity.toFixed(2)}), suggesting a straight path – a classic signature of a minimum-ionizing particle.`)
  }
  if (hasNode('curved_track')) {
    lines.push(`The track shows significant curvature (${features.curvature.toFixed(2)}). This could indicate interaction with a magnetic field, or a heavier particle undergoing scattering.`)
  }
  if (hasNode('scattered_path')) {
    lines.push(`Multiple scattering is visible (scatter score: ${features.scatterScore.toFixed(2)}). This is consistent with a heavy particle or compound interaction, but also with noise accumulation.`)
  }
  if (hasNode('clustered_flash')) {
    lines.push(`A tight cluster of pixels is present. This can occur from delta rays, low-energy neutron scatter, or sensor hot-pixel groups.`)
  }

  lines.push(`**Why it appears this way:** The node pipeline activated ${activatedNodes.length} nodes. Dominant signals: ${activatedNodes.slice(0, 3).map((n) => n.label).join(', ')}.`)

  if (liftedPatterns.length > 0) {
    lines.push(`Pattern match: ${liftedPatterns[0].label} (score: ${liftedPatterns[0].score.toFixed(2)}).`)
  }

  const deepGuide = lines.join(' ')

  // Bridge guide
  let bridgeGuide = ''
  if (hasNode('simulation_recommended')) {
    bridgeGuide = 'Consider comparing this event against a Monte Carlo simulation to test the particle hypothesis. Overlay comparison is available in the Lab view.'
  } else if (hasNode('cross_device_match_needed')) {
    bridgeGuide = 'This event would benefit from cross-device correlation. Check the Archive for events from other devices with similar timestamps.'
  } else if (hasNode('worth_recheck')) {
    bridgeGuide = 'Save this event and revisit it with a fresh eye. It may connect to a pattern only visible across multiple observations.'
  } else {
    bridgeGuide = 'Archive this observation for future reference. Even ambiguous events contribute to baseline characterization.'
  }

  // Caution notes
  const cautionNotes: string[] = []
  if (stateVector.artifactRisk > 0.5) {
    cautionNotes.push(`Artifact risk is elevated (${(stateVector.artifactRisk * 100).toFixed(0)}%). Do not claim particle detection without independent confirmation.`)
  }
  if (features.noiseScore > 0.5) {
    cautionNotes.push(`Noise level is significant (${features.noiseScore.toFixed(2)}). Signal features may be partially noise-driven.`)
  }
  if (stateVector.claimStrength > 0.7 && stateVector.confidence < 0.6) {
    cautionNotes.push('Claim strength is high but confidence is moderate. Consider softening the interpretation.')
  }
  if (hasNode('likely_sensor_artifact')) {
    cautionNotes.push('Sensor artifact indicators are active. Treat this event with strong skepticism.')
  }
  if (cautionNotes.length === 0) {
    cautionNotes.push('No major cautions. Standard verification still recommended before strong claims.')
  }

  return { quickGuide, deepGuide, bridgeGuide, cautionNotes }
}
