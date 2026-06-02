import type { DataQualityFlag, ObservationInput, QualityAssessment } from '../../types/observation'

const clamp = (value: number) => Math.max(0, Math.min(1, value))

function pushFlag(flags: DataQualityFlag[], notes: string[], flag: DataQualityFlag, note: string) {
  if (flags.includes(flag)) return
  flags.push(flag)
  notes.push(note)
}

export function assessDataQuality(input: ObservationInput): QualityAssessment {
  const flags: DataQualityFlag[] = []
  const notes: string[] = []
  const thresholdSignal = input.thresholdSignal
  const stats = thresholdSignal?.stats
  const foreground = thresholdSignal?.foreground
  const components = thresholdSignal?.components
  const tracks = thresholdSignal?.detectedTracks ?? []
  const measuredSource = input.measuredSource

  const mean = stats?.mean ?? input.features.brightness * 255
  const std = stats?.std ?? input.features.noiseScore * 40
  const foregroundRatio = foreground?.ratio ?? 0
  const foregroundCount = foreground?.count ?? 0
  const acceptedComponentCount = components?.acceptedComponents.length ?? 0
  const avgAcceptedSize = acceptedComponentCount > 0
    ? components!.acceptedComponents.reduce((sum, c) => sum + c.pixelCount, 0) / acceptedComponentCount
    : 0

  const lightLeakScore = Number(clamp((mean / 255) * 0.6 + foregroundRatio * 0.8).toFixed(3))
  const thermalNoiseScore = Number(clamp(Math.max(input.features.noiseScore, std / 60)).toFixed(3))
  const compressionRisk = Number(clamp(
    input.sourceType === 'uploaded-image' && (
      input.rawImageUri?.startsWith('data:image/jpeg') ||
      input.rawImageUri?.startsWith('data:image/jpg')
    )
      ? 0.7
      : 0,
  ).toFixed(3))

  const calibrationQuality = Number(
    clamp(
      measuredSource === 'calibrated-pixel'
        ? 0.85
        : measuredSource === 'pixel-derived'
          ? 0.35
          : measuredSource === 'placeholder-dimension'
            ? 0.1
            : 0.25,
    ).toFixed(3),
  )

  const stabilityPenalty = input.notes?.toLowerCase().includes('moving') || input.notes?.toLowerCase().includes('shake')
    ? 0.35
    : 0
  const stabilityScore = Number(clamp(1 - input.features.noiseScore - stabilityPenalty).toFixed(3))

  if (measuredSource === 'placeholder-dimension') {
    pushFlag(flags, notes, 'placeholder-measurement', 'Measurement values are placeholder-derived and not calibrated sensor readings.')
  }

  if (measuredSource !== 'calibrated-pixel') {
    pushFlag(flags, notes, 'baseline-missing', 'No active dark/baseline calibration was attached to this observation.')
  } else {
    pushFlag(flags, notes, 'calibrated-session', 'Calibration was applied for this session.')
  }

  if (mean > 205 || foregroundRatio > 0.45) {
    pushFlag(flags, notes, 'frame-too-bright', 'Frame is broadly bright, reducing confidence in sparse-event interpretation.')
  }

  if (lightLeakScore > 0.55 && foregroundRatio > 0.18) {
    pushFlag(flags, notes, 'light-leak-suspected', 'Brightness distribution appears broad instead of sparse, consistent with possible light leakage.')
  }

  if ((foregroundCount > 0 && foregroundCount < 10) || (tracks.length === 0 && acceptedComponentCount < 1)) {
    pushFlag(flags, notes, 'low-signal', 'Foreground signal is weak or lacks a meaningful candidate track/component.')
  }

  if (acceptedComponentCount >= 8 && avgAcceptedSize <= 3) {
    pushFlag(flags, notes, 'hot-pixel-overlap-high', 'Many tiny bright components overlap, increasing hot-pixel artifact risk.')
  }

  if (thermalNoiseScore > 0.62) {
    pushFlag(flags, notes, 'thermal-noise-high', 'Thermal/background noise appears elevated in this frame.')
  }

  if (input.sourceType === 'camera' && stabilityScore < 0.3) {
    pushFlag(flags, notes, 'device-moving', 'Capture conditions suggest possible camera/device motion.')
  }

  if (compressionRisk > 0.5) {
    pushFlag(flags, notes, 'compression-risk', 'Image appears JPEG-compressed; compression artifacts may influence pixel statistics.')
  }

  if (measuredSource === 'calibrated-pixel' && thermalNoiseScore < 0.35) {
    pushFlag(flags, notes, 'good-dark-frame', 'Dark-frame/noise conditions are favorable, but still not proof of origin.')
  }

  if (input.sourceType === 'camera' && stabilityScore > 0.7) {
    pushFlag(flags, notes, 'stable-device', 'Capture appears stable with low motion/noise indicators.')
  }

  return {
    flags,
    notes,
    lightLeakScore,
    thermalNoiseScore,
    calibrationQuality,
    compressionRisk: compressionRisk > 0 ? compressionRisk : undefined,
    stabilityScore,
  }
}
