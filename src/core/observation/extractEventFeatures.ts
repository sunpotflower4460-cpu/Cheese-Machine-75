import type { EventFeatures, MeasuredSource, ThresholdSignal } from '../../types/observation'
import { loadImagePixels } from '../measurement/imageLoader'
import {
  computeBrightnessStats,
  extractForegroundMask,
  type BrightnessStats,
  type ForegroundMask,
} from '../measurement/threshold'
import {
  DEFAULT_COMPONENT_CONNECTIVITY,
  DEFAULT_COMPONENT_SORT,
  DEFAULT_MIN_COMPONENT_PIXELS,
  detectConnectedComponents,
} from '../measurement/connectedComponents'

const LUMINANCE_MAX = 255
const NOISE_STD_NORMALIZER = 40
const PIXEL_ANALYSIS_VERSION = 'phase1-pixel-v1'

/** Clamp a value between 0 and 1 */
const clamp = (v: number): number => Math.max(0, Math.min(1, v))

function buildDimensionFeatures(width: number, height: number): EventFeatures {
  const safeWidth = Math.max(1, width)
  const safeHeight = Math.max(1, height)
  const aspectRatio = safeWidth / safeHeight
  const linearity = clamp(0.5 + (aspectRatio > 1 ? 0.15 : -0.1))
  const length = clamp(0.4 + Math.min(Math.max(aspectRatio - 0.5, 0), 1) * 0.3)

  return {
    brightness: 0.5,
    length,
    width: clamp(0.2 - (linearity - 0.5) * 0.2),
    linearity,
    curvature: 0.2,
    scatterScore: 0.25,
    clusterScore: 0.2,
    rarityScore: 0.5,
    noiseScore: 0.3,
  }
}

function buildConservativePixelPhaseFeatures(): EventFeatures {
  return {
    brightness: 0.5,
    length: 0.3,
    width: 0.15,
    linearity: 0.5,
    curvature: 0.2,
    scatterScore: 0.2,
    clusterScore: 0.2,
    rarityScore: 0.5,
    noiseScore: 0.3,
  }
}

function deriveBrightness(stats: BrightnessStats, foreground: ForegroundMask): number {
  if (foreground.count === 0) {
    return Number(clamp((stats.mean / LUMINANCE_MAX) * 0.2).toFixed(4))
  }

  const totalPixels = foreground.width * foreground.height
  const foregroundSum = foreground.pixels.reduce((sum, pixel) => sum + pixel.luminance, 0)
  const foregroundMean = foregroundSum / foreground.count
  const backgroundCount = totalPixels - foreground.count
  const backgroundMean = backgroundCount > 0
    ? ((stats.mean * totalPixels) - foregroundSum) / backgroundCount
    : stats.mean
  const foregroundMax = foreground.pixels.reduce((max, pixel) => Math.max(max, pixel.luminance), 0)

  const separation = clamp((foregroundMean - backgroundMean) / LUMINANCE_MAX)
  const peak = clamp((foregroundMax - backgroundMean) / LUMINANCE_MAX)
  const sparsityBias = Math.min(0.1, (1 - foreground.ratio) * 0.1)

  return Number(clamp(separation * 0.75 + peak * 0.2 + sparsityBias).toFixed(4))
}

function deriveNoiseScore(
  luminance: Float32Array,
  foreground: ForegroundMask,
  fallbackStd: number,
): number {
  let count = 0
  let sum = 0
  let sumSquares = 0

  for (let i = 0; i < luminance.length; i += 1) {
    const value = luminance[i]
    if (value >= foreground.threshold) continue

    count += 1
    sum += value
    sumSquares += value * value
  }

  const std = count > 0
    ? Math.sqrt(Math.max(0, (sumSquares / count) - ((sum / count) ** 2)))
    : fallbackStd

  return Number(clamp(std / NOISE_STD_NORMALIZER).toFixed(4))
}

function buildFeaturesFromLuminance(
  width: number,
  height: number,
  luminance: Float32Array,
): { features: EventFeatures; thresholdSignal: ThresholdSignal } {
  const stats = computeBrightnessStats(luminance)
  const foreground = extractForegroundMask(luminance, width, height, stats)
  const components = detectConnectedComponents(foreground)
  const conservative = buildConservativePixelPhaseFeatures()

  return {
    features: {
      ...conservative,
      brightness: deriveBrightness(stats, foreground),
      noiseScore: deriveNoiseScore(luminance, foreground, stats.std),
      rarityScore: 0.5,
    },
    thresholdSignal: { stats, foreground, components },
  }
}

function buildPlaceholderThresholdSignal(
  width: number,
  height: number,
  extractionError?: string,
): ThresholdSignal {
  return {
    stats: {
      mean: 0,
      median: 0,
      std: 0,
      max: 0,
      min: 0,
      threshold: 0,
    },
    foreground: {
      width: Math.max(1, width),
      height: Math.max(1, height),
      threshold: 0,
      pixels: [],
      count: 0,
      ratio: 0,
    },
    components: {
      components: [],
      acceptedComponents: [],
      rejectedComponents: [],
      filteredCount: 0,
      minPixelCount: DEFAULT_MIN_COMPONENT_PIXELS,
      connectivity: DEFAULT_COMPONENT_CONNECTIVITY,
      sortBy: DEFAULT_COMPONENT_SORT,
    },
    extractionError,
  }
}

export type PixelMeasuredBundle = {
  features: EventFeatures
  brightnessStats: BrightnessStats
  foreground: ForegroundMask
  measuredSource: 'pixel-derived' | 'placeholder-dimension'
  analysisVersion: string
  warnings: string[]
}

export function extractEventFeatures(raw: Partial<EventFeatures>): EventFeatures {
  return {
    brightness: clamp(raw.brightness ?? 0.5),
    length: clamp(raw.length ?? 0.3),
    width: clamp(raw.width ?? 0.15),
    linearity: clamp(raw.linearity ?? 0.5),
    curvature: clamp(raw.curvature ?? 0.2),
    scatterScore: clamp(raw.scatterScore ?? 0.2),
    clusterScore: clamp(raw.clusterScore ?? 0.2),
    rarityScore: clamp(raw.rarityScore ?? 0.3),
    noiseScore: clamp(raw.noiseScore ?? 0.3),
  }
}

export async function analyzeImagePixels(
  imageUri: string,
  width: number,
  height: number,
): Promise<PixelMeasuredBundle> {
  const dimensionFeatures = buildDimensionFeatures(width, height)

  try {
    const loaded = await loadImagePixels(imageUri)
    const measured = buildFeaturesFromLuminance(loaded.width, loaded.height, loaded.luminance)
    return {
      features: measured.features,
      brightnessStats: measured.thresholdSignal.stats,
      foreground: measured.thresholdSignal.foreground,
      measuredSource: 'pixel-derived',
      analysisVersion: PIXEL_ANALYSIS_VERSION,
      warnings: [],
    }
  } catch (error) {
    const warning = error instanceof Error
      ? `Pixel analysis failed; using placeholder dimension features: ${error.message}`
      : 'Pixel analysis failed; using placeholder dimension features.'
    const thresholdSignal = buildPlaceholderThresholdSignal(width, height, warning)

    return {
      features: dimensionFeatures,
      brightnessStats: thresholdSignal.stats,
      foreground: thresholdSignal.foreground,
      measuredSource: 'placeholder-dimension',
      analysisVersion: PIXEL_ANALYSIS_VERSION,
      warnings: [warning],
    }
  }
}

export async function extractFeaturesFromUploadedImage(
  imageUri: string,
  width: number,
  height: number,
): Promise<{ features: EventFeatures; measuredSource: MeasuredSource; thresholdSignal?: ThresholdSignal }> {
  const measured = await analyzeImagePixels(imageUri, width, height)
  return {
    features: measured.features,
    measuredSource: measured.measuredSource,
    thresholdSignal: {
      stats: measured.brightnessStats,
      foreground: measured.foreground,
      extractionError: measured.warnings[0],
    },
  }
}

export function randomEventFeatures(seed?: number): EventFeatures {
  let s = seed ?? Math.random() * 1000
  const r = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }
  return extractEventFeatures({
    brightness: r(),
    length: r(),
    width: r() * 0.3,
    linearity: r(),
    curvature: r() * 0.5,
    scatterScore: r() * 0.6,
    clusterScore: r() * 0.6,
    rarityScore: r(),
    noiseScore: r() * 0.7,
  })
}
