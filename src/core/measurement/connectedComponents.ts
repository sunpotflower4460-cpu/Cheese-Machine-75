import type { ConnectedComponents, DetectedComponent, ForegroundMask, ForegroundPixel } from '../../types/observation'

export const DEFAULT_COMPONENT_CONNECTIVITY = 8
export const DEFAULT_MIN_COMPONENT_PIXELS = 2
export const DEFAULT_COMPONENT_SORT = 'totalLuminance'

export type ConnectedComponentOptions = {
  connectivity?: 4 | 8
  minPixelCount?: number
  sortBy?: 'pixelCount' | 'totalLuminance'
}

type MutableComponent = {
  pixels: ForegroundPixel[]
  pixelCount: number
  centroid: { x: number; y: number }
  boundingBox: { x: number; y: number; width: number; height: number }
  maxLuminance: number
  meanLuminance: number
  totalLuminance: number
}

function round4(value: number): number {
  return Number(value.toFixed(4))
}

function getNeighborOffsets(connectivity: 4 | 8): Array<{ x: number; y: number }> {
  if (connectivity === 4) {
    return [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ]
  }

  return [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 },
  ]
}

function compareComponents(
  a: MutableComponent,
  b: MutableComponent,
  sortBy: 'pixelCount' | 'totalLuminance',
): number {
  const byScore = sortBy === 'pixelCount'
    ? b.pixelCount - a.pixelCount
    : b.totalLuminance - a.totalLuminance
  if (byScore !== 0) return byScore

  if (b.pixelCount !== a.pixelCount) return b.pixelCount - a.pixelCount
  return b.totalLuminance - a.totalLuminance
}

function toDetectedComponent(component: MutableComponent, id: string): DetectedComponent {
  return {
    id,
    pixels: component.pixels,
    pixelCount: component.pixelCount,
    centroid: component.centroid,
    boundingBox: component.boundingBox,
    maxLuminance: component.maxLuminance,
    meanLuminance: component.meanLuminance,
    totalLuminance: component.totalLuminance,
  }
}

export function detectConnectedComponents(
  foreground: ForegroundMask,
  options: ConnectedComponentOptions = {},
): ConnectedComponents {
  const minPixelCount = Math.max(1, Math.floor(options.minPixelCount ?? DEFAULT_MIN_COMPONENT_PIXELS))
  const connectivity = options.connectivity ?? DEFAULT_COMPONENT_CONNECTIVITY
  const sortBy = options.sortBy ?? DEFAULT_COMPONENT_SORT
  const width = foreground.width
  const height = foreground.height

  const pixelByIndex = new Map<number, ForegroundPixel>()
  for (const pixel of foreground.pixels) {
    if (pixel.x < 0 || pixel.x >= width || pixel.y < 0 || pixel.y >= height) continue
    const index = (pixel.y * width) + pixel.x
    pixelByIndex.set(index, pixel)
  }

  const orderedIndexes = Array.from(pixelByIndex.keys()).sort((a, b) => a - b)
  const visited = new Set<number>()
  const neighborOffsets = getNeighborOffsets(connectivity)
  const components: MutableComponent[] = []

  for (const startIndex of orderedIndexes) {
    if (visited.has(startIndex)) continue

    const queue = [startIndex]
    const pixels: ForegroundPixel[] = []
    let head = 0
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    let sumX = 0
    let sumY = 0
    let totalLuminance = 0
    let maxLuminance = Number.NEGATIVE_INFINITY

    visited.add(startIndex)
    while (head < queue.length) {
      const currentIndex = queue[head]
      head += 1
      const currentPixel = pixelByIndex.get(currentIndex)
      if (!currentPixel) continue

      pixels.push(currentPixel)
      sumX += currentPixel.x
      sumY += currentPixel.y
      totalLuminance += currentPixel.luminance
      maxLuminance = Math.max(maxLuminance, currentPixel.luminance)
      minX = Math.min(minX, currentPixel.x)
      minY = Math.min(minY, currentPixel.y)
      maxX = Math.max(maxX, currentPixel.x)
      maxY = Math.max(maxY, currentPixel.y)

      for (const offset of neighborOffsets) {
        const nx = currentPixel.x + offset.x
        const ny = currentPixel.y + offset.y
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
        const neighborIndex = (ny * width) + nx
        if (!pixelByIndex.has(neighborIndex) || visited.has(neighborIndex)) continue
        visited.add(neighborIndex)
        queue.push(neighborIndex)
      }
    }

    if (pixels.length === 0) continue

    components.push({
      pixels,
      pixelCount: pixels.length,
      centroid: {
        x: round4(sumX / pixels.length),
        y: round4(sumY / pixels.length),
      },
      boundingBox: {
        x: minX,
        y: minY,
        width: (maxX - minX) + 1,
        height: (maxY - minY) + 1,
      },
      maxLuminance: round4(maxLuminance),
      meanLuminance: round4(totalLuminance / pixels.length),
      totalLuminance: round4(totalLuminance),
    })
  }

  const sorted = components
    .sort((a, b) => compareComponents(a, b, sortBy))
    .map((component, index) => toDetectedComponent(component, `component-${index + 1}`))

  return {
    components: sorted,
    acceptedComponents: sorted.filter((component) => component.pixelCount >= minPixelCount),
    rejectedComponents: sorted.filter((component) => component.pixelCount < minPixelCount),
    filteredCount: sorted.filter((component) => component.pixelCount < minPixelCount).length,
    minPixelCount,
    connectivity,
    sortBy,
  }
}
