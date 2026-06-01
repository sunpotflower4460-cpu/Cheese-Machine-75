// MeasuredSourceBadge — visual trust indicator for measurement provenance
// Shows a clearly-colored badge so the user always knows whether a value
// came from authored samples, dimension-derived placeholders, or real pixels.

import type { MeasuredSource } from '../../types/observation'
import { getMeasuredSourceLabel, isRealMeasuredSource, shouldCapClaimStrength } from '../../core/observation/measuredSource'
import { AlertTriangle, FlaskConical, Microscope } from 'lucide-react'

type Props = {
  source: MeasuredSource
  /** When true, also shows an explanatory sentence below the badge. */
  showDescription?: boolean
}

export function MeasuredSourceBadge({ source, showDescription }: Props) {
  const label = getMeasuredSourceLabel(source)
  const isReal = isRealMeasuredSource(source)
  const isCapped = shouldCapClaimStrength(source)
  const isPlaceholder = source === 'placeholder-dimension'
  const isAuthored = source === 'sample-authored'

  const colorClass = isReal
    ? 'bg-green-900/40 text-green-300 border-green-700/50'
    : isPlaceholder
      ? 'bg-amber-900/40 text-amber-300 border-amber-700/50'
      : isAuthored
        ? 'bg-violet-900/40 text-violet-300 border-violet-700/50'
        : 'bg-slate-700 text-slate-300 border-slate-600'

  const Icon = isReal ? Microscope : isCapped ? AlertTriangle : FlaskConical

  return (
    <div className="inline-flex flex-col gap-1">
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded border ${colorClass}`}>
        <Icon size={11} />
        {label}
      </span>
      {showDescription && (
        <p className={`text-[10px] leading-snug ${isCapped ? 'text-amber-400/80' : 'text-slate-500'}`}>
          {isPlaceholder && 'Features derived from image dimensions only — not from real pixel analysis.'}
          {isAuthored && 'Values authored by a human for demo or testing purposes — not sensor measurements.'}
          {isReal && 'Values extracted from actual pixel analysis.'}
          {!isReal && !isPlaceholder && !isAuthored && 'Measurement provenance: ' + source}
        </p>
      )}
    </div>
  )
}
