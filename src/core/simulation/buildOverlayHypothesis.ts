// Simulation overlay hypothesis builder
// Builds measured / predicted / simulated overlay lines for display

/**
 * Measured -> Simulated mapping
 *
 * This step takes Measured layer event features and converts them into
 * overlay hypotheses for visual interpretation (Inferred layer).
 *
 * measured:  shapes directly derived from observed / extracted data
 * predicted: helper lines inferred from current measured features
 * simulated: hypothesis-driven overlay lines for comparison against measurement
 */

import type { EventFeatures, OverlayHypothesis, ThresholdSignal } from '../../types/observation'

/** Build overlay hypotheses from event features */
export function buildOverlayHypothesis(features: EventFeatures, thresholdSignal?: ThresholdSignal): OverlayHypothesis[] {
  const hypotheses: OverlayHypothesis[] = []
  const measuredTrack = thresholdSignal?.detectedTracks?.[0]
  const measurementWidth = Math.max(1, thresholdSignal?.foreground.width ?? 1)
  const measurementHeight = Math.max(1, thresholdSignal?.foreground.height ?? 1)

  // Measured line: approximate actual track from features
  if (measuredTrack) {
    const axisPoints = interpolateLine(
      scalePointToOverlay(measuredTrack.principalAxis.start, measurementWidth, measurementHeight),
      scalePointToOverlay(measuredTrack.principalAxis.end, measurementWidth, measurementHeight),
      10,
    )
    hypotheses.push({
      id: measuredTrack.id,
      kind: 'measured',
      label: 'Measured Track',
      confidence: measuredTrack.confidence,
      color: '#4ade80',
      points: axisPoints,
    })
  } else if (features.length > 0.1) {
    const x1 = 10
    const y1 = 50 + (features.curvature * 20) - 10
    const x2 = 10 + features.length * 80
    const y2 = 50 - (features.curvature * 20) + 10
    hypotheses.push({
      id: 'measured',
      kind: 'measured',
      label: 'Measured Track',
      confidence: 1 - features.noiseScore,
      color: '#4ade80',
      points: interpolateLine({ x: x1, y: y1 }, { x: x2, y: y2 }, 10),
    })
  }

  // Predicted line: straight-line particle hypothesis
  if (features.linearity > 0.5) {
    hypotheses.push({
      id: 'predicted',
      kind: 'predicted',
      label: 'Predicted Particle Track',
      confidence: features.linearity * (1 - features.noiseScore),
      color: '#60a5fa',
      points: interpolateLine({ x: 8, y: 50 }, { x: 92, y: 50 }, 10),
    })
  }

  // Simulated hypothesis: curved track hypothesis
  if (features.curvature > 0.3 || features.scatterScore > 0.4) {
    const pts: Array<{ x: number; y: number }> = []
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      pts.push({
        x: 10 + t * 80,
        y: 50 + Math.sin(t * Math.PI) * features.curvature * 30,
      })
    }
    hypotheses.push({
      id: 'simulated',
      kind: 'simulated',
      label: 'Simulated Curved Track',
      confidence: features.curvature * 0.7,
      color: '#f59e0b',
      points: pts,
    })
  }

  return hypotheses
}

function scalePointToOverlay(
  point: { x: number; y: number },
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: (point.x / Math.max(1, width - 1)) * 100,
    y: (point.y / Math.max(1, height - 1)) * 100,
  }
}

function interpolateLine(
  start: { x: number; y: number },
  end: { x: number; y: number },
  steps: number,
): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    pts.push({ x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t })
  }
  return pts
}
