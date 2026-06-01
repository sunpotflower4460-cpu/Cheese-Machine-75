import { imageDataToLuminance } from './luminance'

export type ImageLoadErrorCode =
  | 'image-load-failed'
  | 'invalid-image-dimensions'
  | 'canvas-context-unavailable'
  | 'image-data-extraction-failed'

export class ImageLoadError extends Error {
  readonly code: ImageLoadErrorCode

  constructor(code: ImageLoadErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ImageLoadError'
    this.code = code
  }
}

export type LoadedImagePixels = {
  width: number
  height: number
  pixelCount: number
  imageData: ImageData
  luminance: Float32Array
}

function loadHtmlImage(imageUri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.crossOrigin = 'anonymous'

    const onLoad = (): void => {
      cleanup()
      resolve(image)
    }
    const onError = (): void => {
      cleanup()
      reject(new ImageLoadError('image-load-failed', 'Unable to load image from provided URI'))
    }
    const cleanup = (): void => {
      image.onload = null
      image.onerror = null
    }

    image.onload = onLoad
    image.onerror = onError
    image.src = imageUri
  })
}

export async function loadImagePixels(imageUri: string): Promise<LoadedImagePixels> {
  if (!imageUri) {
    throw new ImageLoadError('image-load-failed', 'Image URI is empty')
  }

  const image = await loadHtmlImage(imageUri)
  const width = image.naturalWidth
  const height = image.naturalHeight

  if (width <= 0 || height <= 0) {
    throw new ImageLoadError(
      'invalid-image-dimensions',
      `Loaded image has invalid dimensions (${width}x${height})`,
    )
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new ImageLoadError('canvas-context-unavailable', '2D canvas context is unavailable')
  }

  context.drawImage(image, 0, 0, width, height)

  let imageData: ImageData
  try {
    imageData = context.getImageData(0, 0, width, height)
  } catch (error) {
    throw new ImageLoadError(
      'image-data-extraction-failed',
      'Failed to read image pixel data via canvas.getImageData()',
      { cause: error },
    )
  }

  return {
    width,
    height,
    pixelCount: width * height,
    imageData,
    luminance: imageDataToLuminance(imageData, { alphaMode: 'premultiply' }),
  }
}
