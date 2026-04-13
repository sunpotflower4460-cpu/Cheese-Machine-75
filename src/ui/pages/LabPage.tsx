import { useState } from 'react'
import type { Route } from '../../App'
import type { ObservationCrystal } from '../../types/observation'
import { NavBar } from '../components/NavBar'
import { GuidePanel } from '../components/GuidePanel'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { FlaskConical, ChevronDown } from 'lucide-react'

type LabPageProps = {
  crystals: ObservationCrystal[]
  navigate: (to: Route) => void
}

export function LabPage({ crystals, navigate }: LabPageProps) {
  const [idA, setIdA] = useState(crystals[0]?.id ?? '')
  const [idB, setIdB] = useState(crystals[1]?.id ?? '')
  const [notes, setNotes] = useState('')

  const crystalA = crystals.find((c) => c.id === idA) ?? null
  const crystalB = crystals.find((c) => c.id === idB) ?? null

  const FEATURE_KEYS = ['brightness', 'length', 'linearity', 'curvature', 'scatterScore', 'noiseScore', 'rarityScore'] as const

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NavBar navigate={navigate} current="/lab" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <FlaskConical size={18} className="text-amber-400" />
          <h1 className="text-lg font-bold text-white">Lab – Event Comparison</h1>
        </div>

        {crystals.length < 2 ? (
          <div className="text-center py-10 border border-dashed border-slate-700 rounded-lg">
            <p className="text-slate-400 text-sm">Need at least 2 saved crystals to compare.</p>
            <p className="text-slate-600 text-xs mt-1">Go to Observe and save some events first.</p>
          </div>
        ) : (
          <>
            {/* Selectors */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Event A', value: idA, set: setIdA },
                { label: 'Event B', value: idB, set: setIdB },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <p className="text-slate-500 text-xs mb-1">{label}</p>
                  <div className="relative">
                    <select
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      className="w-full appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm px-3 py-2 rounded-lg pr-8"
                    >
                      {crystals.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.pipelineResult.activatedNodes[0]?.label.replace(/_/g, ' ')} · {new Date(c.createdAt).toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>

            {crystalA && crystalB && (
              <>
                {/* Feature comparison */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden mb-4">
                  <div className="grid grid-cols-3 border-b border-slate-700 text-xs">
                    <div className="px-3 py-2 text-slate-400 uppercase">Feature</div>
                    <div className="px-3 py-2 text-slate-400 uppercase text-center">A</div>
                    <div className="px-3 py-2 text-slate-400 uppercase text-center">B</div>
                  </div>
                  {FEATURE_KEYS.map((k) => {
                    const a = crystalA.features[k]
                    const b = crystalB.features[k]
                    const diff = Math.abs(a - b)
                    const highlight = diff > 0.3 ? 'bg-amber-900/20' : ''
                    return (
                      <div key={k} className={`grid grid-cols-3 border-b border-slate-700/50 text-xs ${highlight}`}>
                        <div className="px-3 py-1.5 text-slate-400 font-mono">{k}</div>
                        <div className="px-3 py-1.5 text-slate-300 font-mono text-center">{a.toFixed(3)}</div>
                        <div className="px-3 py-1.5 text-slate-300 font-mono text-center">{b.toFixed(3)}</div>
                      </div>
                    )
                  })}
                </div>

                {/* Guide comparison */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { label: 'A', crystal: crystalA },
                    { label: 'B', crystal: crystalB },
                  ].map(({ label, crystal }) => (
                    <div key={label}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-slate-300 text-sm font-semibold">Event {label}</span>
                        <ConfidenceBadge value={crystal.pipelineResult.stateVector.confidence} label="conf" />
                      </div>
                      <GuidePanel guide={crystal.guideBundle} compact />
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                  <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Comparison Notes</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add comparison notes here..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-sm px-3 py-2 rounded resize-none focus:outline-none focus:border-slate-500"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
