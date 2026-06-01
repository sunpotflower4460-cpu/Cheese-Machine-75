const RED_LUMA_WEIGHT = 0.2126
const GREEN_LUMA_WEIGHT = 0.7152
const BLUE_LUMA_WEIGHT = 0.0722

export type LuminanceAlphaMode = 'ignore' | 'premultiply'

export type LuminanceOptions = {
  alphaMode?: LuminanceAlphaMode
}

/**
 * Convert an RGBA byte array to per-pixel luminance values.
 * Alpha handling:
 * - ignore: RGB contributes fully regardless of alpha
 * - premultiply (default): transparent pixels contribute less; alpha=0 becomes black
 */
export function rgbaToLuminance(
  rgba: Uint8ClampedArray,
  options: LuminanceOptions = {},
): Float32Array {
  if (rgba.length % 4 !== 0) {
    throw new Error(`Expected RGBA data length to be a multiple of 4, got ${rgba.length}`)
  }

  const alphaMode = options.alphaMode ?? 'premultiply'
  const pixelCount = rgba.length / 4
  const luminance = new Float32Array(pixelCount)

  for (let i = 0, pixel = 0; i < rgba.length; i += 4, pixel += 1) {
    const r = rgba[i]
    const g = rgba[i + 1]
    const b = rgba[i + 2]
    const alpha = rgba[i + 3] / 255
    const y = (RED_LUMA_WEIGHT * r) + (GREEN_LUMA_WEIGHT * g) + (BLUE_LUMA_WEIGHT * b)
    luminance[pixel] = alphaMode === 'premultiply' ? y * alpha : y
  }

  return luminance
}

export function imageDataToLuminance(
  imageData: ImageData,
  options: LuminanceOptions = {},
): Float32Array {
  return rgbaToLuminance(imageData.data, options)
}
