const LUMINANCE_MAX = 255
const DEFAULT_STD_MULTIPLIER = 2
const MIN_FOREGROUND_THRESHOLD = 16

export type BrightnessStats = {
  mean: number
  median: number
  std: number
  max: number
  min: number
  threshold: number
}

export type ForegroundPixel = {
  x: number
  y: number
  luminance: number
}

export type ForegroundMask = {
  width: number
  height: number
  threshold: number
  pixels: ForegroundPixel[]
  count: number
  ratio: number
}

export type ThresholdOptions = {
  stdMultiplier?: number
  minThreshold?: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round4(value: number): number {
  return Number(value.toFixed(4))
}

export function computeBrightnessStats(
  luminance: Float32Array,
  options: ThresholdOptions = {},
): BrightnessStats {
  if (luminance.length === 0) {
    return { mean: 0, median: 0, std: 0, max: 0, min: 0, threshold: MIN_FOREGROUND_THRESHOLD }
  }

  const sorted = Array.from(luminance).sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const sum = sorted.reduce((acc, value) => acc + value, 0)
  const mean = sum / sorted.length
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]

  const variance = sorted.reduce((acc, value) => {
    const diff = value - mean
    return acc + (diff * diff)
  }, 0) / sorted.length
  const std = Math.sqrt(variance)

  const stdMultiplier = options.stdMultiplier ?? DEFAULT_STD_MULTIPLIER
  const minThreshold = options.minThreshold ?? MIN_FOREGROUND_THRESHOLD
  const threshold = clamp(mean + (stdMultiplier * std), minThreshold, LUMINANCE_MAX)

  return {
    mean: round4(mean),
    median: round4(median),
    std: round4(std),
    max: round4(max),
    min: round4(min),
    threshold: round4(threshold),
  }
}

export function extractForegroundMask(
  luminance: Float32Array,
  width: number,
  height: number,
  stats: BrightnessStats,
): ForegroundMask {
  const expectedPixelCount = width * height
  if (luminance.length !== expectedPixelCount) {
    throw new Error(`Luminance pixel count (${luminance.length}) does not match dimensions (${expectedPixelCount}).`)
  }

  const pixels: ForegroundPixel[] = []
  for (let index = 0; index < luminance.length; index += 1) {
    const value = luminance[index]
    if (value < stats.threshold) continue

    pixels.push({
      x: index % width,
      y: Math.floor(index / width),
      luminance: round4(value),
    })
  }

  const count = pixels.length
  const ratio = expectedPixelCount === 0 ? 0 : count / expectedPixelCount

  return {
    width,
    height,
    threshold: stats.threshold,
    pixels,
    count,
    ratio: round4(ratio),
  }
}
