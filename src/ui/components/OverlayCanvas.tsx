import { useState } from 'react'
import type { DetectedTrack, ForegroundPixel, OverlayHypothesis, ThresholdSignal } from '../../types/observation'

type OverlayCanvasProps = {
  rawImageUri?: string
  hypotheses: OverlayHypothesis[]
  thresholdSignal?: ThresholdSignal
  showOverlay: boolean
  width?: number
  height?: number
}

type OverlayLayerKey =
  | 'bright-pixels'
  | 'components'
  | 'measured-track'
  | 'predicted-track'
  | 'simulated-track'
  | 'rejected-pixels'

type OverlayLayerMeta = {
  label: string
  origin: 'Measured' | 'Inferred' | 'Simulated' | 'Rejected'
  color: string
  dashArray?: string
}

const DEFAULT_LAYER_VISIBILITY: Record<OverlayLayerKey, boolean> = {
  'bright-pixels': true,
  components: true,
  'measured-track': true,
  'predicted-track': true,
  'simulated-track': true,
  'rejected-pixels': true,
}

const LAYER_META: Record<OverlayLayerKey, OverlayLayerMeta> = {
  'bright-pixels': { label: 'Bright pixels', origin: 'Measured', color: '#f8fafc' },
  components: { label: 'Components', origin: 'Measured', color: '#22c55e' },
  'measured-track': { label: 'Measured track', origin: 'Measured', color: '#4ade80' },
  'predicted-track': { label: 'Predicted track', origin: 'Inferred', color: '#60a5fa', dashArray: '5 2' },
  'simulated-track': { label: 'Simulated track', origin: 'Simulated', color: '#f59e0b', dashArray: '2 2' },
  'rejected-pixels': { label: 'Rejected pixels', origin: 'Rejected', color: '#f87171' },
}

export function OverlayCanvas({
  rawImageUri,
  hypotheses,
  thresholdSignal,
  showOverlay,
  width = 300,
  height = 200,
}: OverlayCanvasProps) {
  const vb = `0 0 100 100`
  const [layerVisibility, setLayerVisibility] = useState<Record<OverlayLayerKey, boolean>>(DEFAULT_LAYER_VISIBILITY)
  const measurementWidth = Math.max(1, thresholdSignal?.foreground.width ?? 1)
  const measurementHeight = Math.max(1, thresholdSignal?.foreground.height ?? 1)
  const pixelWidth = 100 / measurementWidth
  const pixelHeight = 100 / measurementHeight
  const brightPixels = thresholdSignal?.foreground.pixels ?? []
  const components = thresholdSignal?.components?.acceptedComponents ?? []
  const rejectedPixels = (thresholdSignal?.components?.rejectedComponents ?? []).flatMap((component) => component.pixels)
  const measuredTracks = thresholdSignal?.detectedTracks ?? []
  const measuredTrackHypotheses = measuredTracks.length > 0 ? [] : hypotheses.filter((h) => h.kind === 'measured')
  const predictedTrackHypotheses = hypotheses.filter((h) => h.kind === 'predicted')
  const simulatedTrackHypotheses = hypotheses.filter((h) => h.kind === 'simulated')
  const availableLayers = (Object.keys(LAYER_META) as OverlayLayerKey[]).filter((key) => {
    switch (key) {
      case 'bright-pixels':
        return brightPixels.length > 0
      case 'components':
        return components.length > 0
      case 'measured-track':
        return measuredTracks.length > 0 || measuredTrackHypotheses.length > 0
      case 'predicted-track':
        return predictedTrackHypotheses.length > 0
      case 'simulated-track':
        return simulatedTrackHypotheses.length > 0
      case 'rejected-pixels':
        return rejectedPixels.length > 0
    }
  })

  const pointsToPolyline = (pts: Array<{ x: number; y: number }>) =>
    pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  const scaleToOverlayX = (value: number) => (value / Math.max(1, measurementWidth)) * 100
  const scaleToOverlayY = (value: number) => (value / Math.max(1, measurementHeight)) * 100

  const renderPixel = (prefix: string, pixel: ForegroundPixel, fill: string, opacity: number) => (
    <rect
      key={`${prefix}-${pixel.x}-${pixel.y}`}
      x={scaleToOverlayX(pixel.x)}
      y={scaleToOverlayY(pixel.y)}
      width={Math.max(0.8, pixelWidth)}
      height={Math.max(0.8, pixelHeight)}
      fill={fill}
      fillOpacity={opacity}
    />
  )

  const renderTrack = (track: DetectedTrack) => (
    <polyline
      key={track.id}
      points={pointsToPolyline([
        scalePointToOverlay(track.principalAxis.start, measurementWidth, measurementHeight),
        scalePointToOverlay(track.principalAxis.end, measurementWidth, measurementHeight),
      ])}
      fill="none"
      stroke={LAYER_META['measured-track'].color}
      strokeWidth="1.8"
      strokeOpacity={Math.max(0.45, track.confidence)}
      strokeLinecap="round"
    />
  )

  const toggleLayer = (layer: OverlayLayerKey) => {
    setLayerVisibility((current) => ({ ...current, [layer]: !current[layer] }))
  }

  return (
    <div className="space-y-2">
      <div
        className="relative rounded-lg overflow-hidden border border-slate-600 bg-black"
        style={{ width, height }}
      >
        {rawImageUri ? (
          <img
            src={rawImageUri}
            alt="Raw event"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-slate-600 text-xs">No image</span>
          </div>
        )}

        {showOverlay && (
          <svg
            className="absolute inset-0"
            width={width}
            height={height}
            viewBox={vb}
            preserveAspectRatio="none"
          >
            {layerVisibility['bright-pixels'] && brightPixels.map((pixel) => renderPixel('bright', pixel, '#f8fafc', 0.5))}

            {layerVisibility['rejected-pixels'] && rejectedPixels.map((pixel) => renderPixel('rejected', pixel, '#f87171', 0.8))}

            {layerVisibility.components && components.map((component) => (
              <rect
                key={component.id}
                x={scaleToOverlayX(component.boundingBox.x)}
                y={scaleToOverlayY(component.boundingBox.y)}
                width={Math.max(pixelWidth, (component.boundingBox.width / measurementWidth) * 100)}
                height={Math.max(pixelHeight, (component.boundingBox.height / measurementHeight) * 100)}
                fill="none"
                stroke={LAYER_META.components.color}
                strokeWidth="1.2"
                strokeOpacity="0.95"
              />
            ))}

            {layerVisibility['measured-track'] && measuredTracks.map((track) => renderTrack(track))}

            {layerVisibility['measured-track'] && measuredTrackHypotheses.map((hypothesis) => (
              <polyline
                key={hypothesis.id}
                points={pointsToPolyline(hypothesis.points)}
                fill="none"
                stroke={hypothesis.color ?? LAYER_META['measured-track'].color}
                strokeWidth="1.8"
                strokeOpacity={Math.max(0.45, hypothesis.confidence)}
                strokeLinecap="round"
              />
            ))}

            {layerVisibility['predicted-track'] && predictedTrackHypotheses.map((hypothesis) => (
              <polyline
                key={hypothesis.id}
                points={pointsToPolyline(hypothesis.points)}
                fill="none"
                stroke={hypothesis.color ?? LAYER_META['predicted-track'].color}
                strokeWidth="1.5"
                strokeOpacity={Math.max(0.35, hypothesis.confidence)}
                strokeDasharray={LAYER_META['predicted-track'].dashArray}
                strokeLinecap="round"
              />
            ))}

            {layerVisibility['simulated-track'] && simulatedTrackHypotheses.map((hypothesis) => (
              <polyline
                key={hypothesis.id}
                points={pointsToPolyline(hypothesis.points)}
                fill="none"
                stroke={hypothesis.color ?? LAYER_META['simulated-track'].color}
                strokeWidth="1.5"
                strokeOpacity={Math.max(0.35, hypothesis.confidence)}
                strokeDasharray={LAYER_META['simulated-track'].dashArray}
                strokeLinecap="round"
              />
            ))}
          </svg>
        )}
      </div>

      {showOverlay && availableLayers.length > 0 && (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {availableLayers.map((layer) => {
            const meta = LAYER_META[layer]
            const isVisible = layerVisibility[layer]
            return (
              <button
                key={layer}
                type="button"
                onClick={() => toggleLayer(layer)}
                aria-label={`${meta.origin} ${meta.label} ${isVisible ? 'On' : 'Off'}`}
                className={`flex items-center justify-between gap-2 rounded border px-2 py-1 text-left text-[11px] transition-colors ${
                  isVisible
                    ? 'border-slate-600 bg-slate-800 text-slate-100'
                    : 'border-slate-800 bg-slate-900 text-slate-500'
                }`}
              >
                <span className="min-w-0">
                  <span className="mr-1 font-semibold uppercase tracking-wide text-[10px] text-slate-400">{meta.origin}</span>
                  <span>{meta.label}</span>
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <span
                    className="inline-block h-0.5 w-4 rounded-full"
                    style={{
                      backgroundColor: meta.color,
                      opacity: isVisible ? 1 : 0.4,
                      borderTop: meta.dashArray ? `1px dashed ${meta.color}` : undefined,
                    }}
                  />
                  <span>{isVisible ? 'On' : 'Off'}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
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
