// AnalysisProvenanceCard — compact audit card for measurement provenance
// Shows how a measured result was produced: source, algorithm, version,
// calibration status, limitations, and warnings.
// Matches the design intent: compact by default, expandable for details.

import { useState } from 'react'
import type { AnalysisProvenance } from '../../types/observation'
import { AlertTriangle, ChevronDown, ChevronUp, Info, ShieldCheck } from 'lucide-react'

type Props = {
  provenance: AnalysisProvenance
  /** When true the limitations/warnings section starts expanded. Default: false. */
  defaultExpanded?: boolean
}

const CALIBRATION_LABELS: Record<AnalysisProvenance['calibrationStatus'], string> = {
  none:      'None',
  available: 'Available (not applied)',
  stale:     'Stale',
  applied:   'Applied ✓',
}

const CALIBRATION_COLORS: Record<AnalysisProvenance['calibrationStatus'], string> = {
  none:      'text-slate-400',
  available: 'text-amber-400',
  stale:     'text-amber-500',
  applied:   'text-green-400',
}

export function AnalysisProvenanceCard({ provenance, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const hasWarnings = provenance.warnings.length > 0
  const hasLimitations = provenance.limitations.length > 0

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden text-xs">
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <div className="flex items-center gap-1.5">
          <Info size={12} className="text-slate-400 shrink-0" />
          <span className="text-slate-400 uppercase tracking-wide font-semibold">Analysis Provenance</span>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
          aria-expanded={expanded}
          aria-label="Toggle provenance details"
        >
          <span className="text-[10px]">{expanded ? 'Hide' : 'Details'}</span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Summary row — always visible */}
      <div className="px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1">
        <div>
          <span className="text-slate-500">Algorithm</span>
          <p className="text-slate-300 font-mono">{provenance.algorithmId}</p>
        </div>
        <div>
          <span className="text-slate-500">Version</span>
          <p className="text-slate-300 font-mono">{provenance.analysisVersion}</p>
        </div>
        <div>
          <span className="text-slate-500">Input kind</span>
          <p className="text-slate-300">{provenance.rawInputKind}</p>
        </div>
        <div>
          <span className="text-slate-500">Calibration</span>
          <p className={CALIBRATION_COLORS[provenance.calibrationStatus]}>
            {CALIBRATION_LABELS[provenance.calibrationStatus]}
          </p>
        </div>
      </div>

      {/* Expandable: limitations + warnings */}
      {expanded && (
        <div className="border-t border-slate-700 px-3 py-2 space-y-2">
          {hasLimitations && (
            <div>
              <div className="flex items-center gap-1 mb-1 text-slate-500 uppercase tracking-wide">
                <ShieldCheck size={11} />
                <span>Limitations</span>
              </div>
              <ul className="space-y-0.5">
                {provenance.limitations.map((lim, i) => (
                  <li key={i} className="text-slate-400 leading-snug">
                    <span className="text-slate-600 mr-1">•</span>{lim}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasWarnings && (
            <div>
              <div className="flex items-center gap-1 mb-1 text-amber-500 uppercase tracking-wide">
                <AlertTriangle size={11} />
                <span>Warnings</span>
              </div>
              <ul className="space-y-0.5">
                {provenance.warnings.map((w, i) => (
                  <li key={i} className="text-amber-400/80 leading-snug">
                    <span className="text-amber-600 mr-1">•</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!hasLimitations && !hasWarnings && (
            <p className="text-slate-600">No limitations or warnings recorded.</p>
          )}

          <div className="pt-1 border-t border-slate-700/60">
            <span className="text-slate-600">Recorded at: </span>
            <span className="text-slate-500 font-mono">{provenance.createdAt}</span>
          </div>
        </div>
      )}

      {/* Warning indicator on summary row when collapsed */}
      {!expanded && hasWarnings && (
        <div className="px-3 pb-2">
          <span className="inline-flex items-center gap-1 text-amber-400/80 text-[10px]">
            <AlertTriangle size={10} />
            {provenance.warnings.length} warning{provenance.warnings.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
