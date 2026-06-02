// Simulation overlay hypothesis builder
// Builds measured / predicted / simulated overlay lines for display

/**
 * Measured -> Simulated mapping
 *
 * This step takes Measured layer event features and an optional ThresholdSignal
 * (which may carry DetectedTrack geometry) and converts them into overlay
 * hypotheses for visual interpretation (Inferred layer).
 *
 * measured:     drawn directly from DetectedTrack.principalAxis — real pixel geometry only.
 *               Never generated from feature values alone.
 * predicted:    inferred extension / straight-line hypothesis derived from measured data.
 *               Labelled 'inferred' so the UI cannot treat it as a sensor measurement.
 * simulated:    hypothesis-driven model line for comparison against measurement.
 *               Labelled 'simulated'.
 *
 * If no DetectedTrack exists, no measured overlay is emitted.  The caller must not
 * invent a measured line from EventFeatures; that would violate overlay truthfulness.
 */

import type { DetectedTrack, EventFeatures, OverlayHypothesis, ThresholdSignal } from '../../types/observation'

/**
 * Build overlay hypotheses from event features and optional threshold signal.
 *
 * @param features   - Measured event features (used for predicted/simulated overlays).
 * @param thresholdSignal - Optional pixel-analysis result; detectedTracks within it
 *                         are the sole source of measured overlays.
 */
export function buildOverlayHypothesis(features: EventFeatures, thresholdSignal?: ThresholdSignal): OverlayHypothesis[] {
  const hypotheses: OverlayHypothesis[] = []
  const measuredTrack = thresholdSignal?.detectedTracks?.[0]
  const measurementWidth = Math.max(1, thresholdSignal?.foreground.width ?? 1)
  const measurementHeight = Math.max(1, thresholdSignal?.foreground.height ?? 1)

  // Measured overlay: only when a real DetectedTrack exists.
  // No feature-generated fallback — that would be dishonest.
  if (measuredTrack) {
    const axisPoints = interpolateLine(
      scalePointToOverlay(measuredTrack.principalAxis.start, measurementWidth, measurementHeight),
      scalePointToOverlay(measuredTrack.principalAxis.end, measurementWidth, measurementHeight),
      10,
    )
    hypotheses.push({
      id: measuredTrack.id,
      kind: 'measured',
      origin: 'measured',
      label: measuredTrackLabel(measuredTrack),
      confidence: measuredTrack.confidence,
      color: '#4ade80',
      points: axisPoints,
    })
  }
  // No else branch: if no DetectedTrack, no measured overlay is emitted.

  // Predicted overlay: inferred straight-line particle hypothesis.
  // When a measured track exists, the predicted line extends along its principal axis;
  // otherwise a generic straight line is used. Always labelled 'inferred'.
  if (features.linearity > 0.5) {
    const predictedPoints = measuredTrack
      ? extendAxis(measuredTrack, measurementWidth, measurementHeight)
      : interpolateLine({ x: 8, y: 50 }, { x: 92, y: 50 }, 10)
    hypotheses.push({
      id: 'predicted',
      kind: 'predicted',
      origin: 'inferred',
      label: 'Predicted Particle Track (Inferred)',
      confidence: features.linearity * (1 - features.noiseScore),
      color: '#60a5fa',
      points: predictedPoints,
    })
  }

  // Simulated hypothesis: curved track for comparison only.  Always labelled 'simulated'.
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
      origin: 'simulated',
      label: 'Simulated Curved Track (Model)',
      confidence: features.curvature * 0.7,
      color: '#f59e0b',
      points: pts,
    })
  }

  return hypotheses
}

/** Return a label that honestly describes the detected track geometry. */
function measuredTrackLabel(track: DetectedTrack): string {
  if (track.kind === 'spot') return 'Measured Centroid (spot)'
  if (track.kind === 'short-line') return 'Measured Short Track'
  if (track.kind === 'curved') return 'Measured Curved Track'
  if (track.kind === 'cluster') return 'Measured Cluster'
  return 'Measured Track'
}

/**
 * Build predicted points by extending the measured track's principal axis
 * by 30 % beyond each endpoint, clamped to the overlay coordinate range [2, 98].
 */
function extendAxis(
  track: DetectedTrack,
  width: number,
  height: number,
): Array<{ x: number; y: number }> {
  const start = scalePointToOverlay(track.principalAxis.start, width, height)
  const end = scalePointToOverlay(track.principalAxis.end, width, height)
  const dx = end.x - start.x
  const dy = end.y - start.y
  const margin = 0.3
  const extStart = {
    x: Math.max(2, start.x - dx * margin),
    y: Math.max(2, Math.min(98, start.y - dy * margin)),
  }
  const extEnd = {
    x: Math.min(98, end.x + dx * margin),
    y: Math.max(2, Math.min(98, end.y + dy * margin)),
  }
  return interpolateLine(extStart, extEnd, 10)
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
