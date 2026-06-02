import type { DetectedComponent, DetectedTrack } from '../../types/observation'

const EPSILON = 1e-9

const clamp = (value: number): number => Math.max(0, Math.min(1, value))
const round4 = (value: number): number => Number(value.toFixed(4))

function classifyTrack(lengthPx: number, widthPx: number, linearity: number, pixelCount: number): DetectedTrack['kind'] {
  const aspectRatio = lengthPx / Math.max(1, widthPx)
  if (pixelCount <= 2 || (lengthPx < 2 && pixelCount <= 3)) return 'spot'
  if (linearity < 0.25 || aspectRatio < 1.3) return 'cluster'
  if (lengthPx < 8) return 'short-line'
  if (linearity > 0.7) return 'long-line'
  return 'unknown'
}

export function detectTrackFromComponent(component: DetectedComponent): DetectedTrack {
  const points = component.pixels.map((pixel) => ({ x: pixel.x, y: pixel.y }))
  const count = points.length

  if (count === 0) {
    return {
      id: `track-${component.id}`,
      componentId: component.id,
      kind: 'unknown',
      points: [],
      principalAxis: {
        start: { x: component.centroid.x, y: component.centroid.y },
        end: { x: component.centroid.x, y: component.centroid.y },
        angleRad: 0,
      },
      lengthPx: 0,
      widthPx: 0,
      linearity: 0,
      curvature: 0,
      confidence: 0,
    }
  }

  const centerX = points.reduce((sum, point) => sum + point.x, 0) / count
  const centerY = points.reduce((sum, point) => sum + point.y, 0) / count

  let covXX = 0
  let covYY = 0
  let covXY = 0
  for (const point of points) {
    const dx = point.x - centerX
    const dy = point.y - centerY
    covXX += dx * dx
    covYY += dy * dy
    covXY += dx * dy
  }
  covXX /= count
  covYY /= count
  covXY /= count

  const trace = covXX + covYY
  const discriminant = Math.sqrt(Math.max(0, ((covXX - covYY) ** 2) + (4 * covXY * covXY)))
  const lambda1 = Math.max(0, (trace + discriminant) / 2)
  const lambda2 = Math.max(0, (trace - discriminant) / 2)

  let vx = 1
  let vy = 0
  if (Math.abs(covXY) > EPSILON) {
    vx = lambda1 - covYY
    vy = covXY
    const norm = Math.hypot(vx, vy)
    if (norm > EPSILON) {
      vx /= norm
      vy /= norm
    }
  } else if (covYY > covXX) {
    vx = 0
    vy = 1
  }

  const ux = -vy
  const uy = vx

  let minAlong = Number.POSITIVE_INFINITY
  let maxAlong = Number.NEGATIVE_INFINITY
  let minAcross = Number.POSITIVE_INFINITY
  let maxAcross = Number.NEGATIVE_INFINITY

  for (const point of points) {
    const dx = point.x - centerX
    const dy = point.y - centerY
    const along = (dx * vx) + (dy * vy)
    const across = (dx * ux) + (dy * uy)
    minAlong = Math.min(minAlong, along)
    maxAlong = Math.max(maxAlong, along)
    minAcross = Math.min(minAcross, across)
    maxAcross = Math.max(maxAcross, across)
  }

  const lengthPx = Math.max(0, maxAlong - minAlong)
  const widthPx = Math.max(0, maxAcross - minAcross)
  const linearity = clamp(1 - (widthPx / Math.max(1, lengthPx)))
  const anisotropy = trace > EPSILON ? clamp((lambda1 - lambda2) / trace) : 0
  const countScore = clamp((count - 1) / 12)
  const confidence = count <= 2
    ? clamp(0.15 + (0.2 * anisotropy))
    : clamp(0.25 + (0.5 * anisotropy) + (0.25 * countScore))

  const start = {
    x: round4(centerX + (vx * minAlong)),
    y: round4(centerY + (vy * minAlong)),
  }
  const end = {
    x: round4(centerX + (vx * maxAlong)),
    y: round4(centerY + (vy * maxAlong)),
  }

  return {
    id: `track-${component.id}`,
    componentId: component.id,
    kind: classifyTrack(lengthPx, widthPx, linearity, count),
    points: points.map((point) => ({ x: round4(point.x), y: round4(point.y) })),
    principalAxis: {
      start,
      end,
      angleRad: round4(Math.atan2(vy, vx)),
    },
    lengthPx: round4(lengthPx),
    widthPx: round4(widthPx),
    linearity: round4(linearity),
    curvature: 0,
    confidence: round4(confidence),
  }
}

export function detectTracksFromComponents(components: DetectedComponent[]): DetectedTrack[] {
  return components.map((component) => detectTrackFromComponent(component))
}
