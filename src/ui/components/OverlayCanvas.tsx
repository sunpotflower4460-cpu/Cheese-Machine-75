import type { OverlayHypothesis } from '../../types/observation'

type OverlayCanvasProps = {
  rawImageUri?: string
  hypotheses: OverlayHypothesis[]
  showOverlay: boolean
  width?: number
  height?: number
}

/** Kind labels and stroke styles for the three overlay line types */
const KIND_LABELS: Record<OverlayHypothesis['kind'], string> = {
  measured: 'Measured (actual track)',
  predicted: 'Predicted (AI hypothesis)',
  simulated: 'Simulated (model curve)',
}

export function OverlayCanvas({ rawImageUri, hypotheses, showOverlay, width = 300, height = 200 }: OverlayCanvasProps) {
  const vb = `0 0 100 100`
  const scaleX = width / 100
  const scaleY = height / 100

  const pointsToPolyline = (pts: Array<{ x: number; y: number }>) =>
    pts.map((p) => `${(p.x * scaleX).toFixed(1)},${(p.y * scaleY).toFixed(1)}`).join(' ')

  return (
    <div
      className="relative rounded-lg overflow-hidden border border-slate-600 bg-black"
      style={{ width, height }}
    >
      {/* Raw image */}
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

      {/* Overlay SVG – inferred lines drawn on top of raw image */}
      {showOverlay && (
        <svg
          className="absolute inset-0"
          width={width}
          height={height}
          viewBox={vb}
          preserveAspectRatio="none"
        >
          {hypotheses.map((h) => (
            <g key={h.id}>
              <polyline
                points={pointsToPolyline(h.points)}
                fill="none"
                stroke={h.color ?? '#fff'}
                strokeWidth="1.5"
                strokeOpacity={h.confidence}
                strokeDasharray={h.kind === 'simulated' ? '3 2' : h.kind === 'predicted' ? '5 2' : undefined}
              />
            </g>
          ))}
        </svg>
      )}

      {/* Legend – shows kind type for each overlay line */}
      {showOverlay && hypotheses.length > 0 && (
        <div className="absolute bottom-1 left-1 flex flex-col gap-0.5">
          {hypotheses.map((h) => (
            <div key={h.id} className="flex items-center gap-1 bg-black/70 px-1.5 py-0.5 rounded text-xs">
              <span style={{ color: h.color ?? '#fff', fontSize: 10 }}>
                {h.kind === 'measured' ? '—' : h.kind === 'predicted' ? '╌╌' : '···'}
              </span>
              <span className="text-slate-200" style={{ fontSize: 9 }}>{KIND_LABELS[h.kind]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
