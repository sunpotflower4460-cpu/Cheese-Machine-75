import { useState } from 'react'
import type { Route } from '../../App'
import type { ObservationCrystal } from '../../types/observation'
import { NavBar } from '../components/NavBar'
import { GuidePanel } from '../components/GuidePanel'
import { OverlayCanvas } from '../components/OverlayCanvas'
import { RevisionTimeline } from '../components/RevisionTimeline'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { buildOverlayHypothesis } from '../../core/simulation/buildOverlayHypothesis'
import { EventCard } from '../components/EventCard'
import { Layers, ChevronLeft, Tag, Cpu } from 'lucide-react'

type EventDetailPageProps = {
  crystal: ObservationCrystal | null
  crystals: ObservationCrystal[]
  navigate: (to: Route) => void
  navigateToEvent: (id: string) => void
}

type Tab = 'raw' | 'inferred' | 'revised'

export function EventDetailPage({ crystal, crystals, navigate, navigateToEvent }: EventDetailPageProps) {
  const [tab, setTab] = useState<Tab>('raw')
  const [showOverlay, setShowOverlay] = useState(false)

  if (!crystal) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <NavBar navigate={navigate} current="/archive" />
        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <p className="text-slate-400">Event not found.</p>
          <button onClick={() => navigate('/archive')} className="mt-4 text-slate-300 hover:text-white text-sm">
            ← Back to Archive
          </button>
        </div>
      </div>
    )
  }

  const overlays = buildOverlayHypothesis(crystal.features)
  const sv = crystal.pipelineResult.stateVector
  const similarCrystals = crystal.memoryLinks.map((id) => crystals.find((c) => c.id === id)).filter((c): c is ObservationCrystal => c !== undefined)

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: 'raw', label: 'Raw / Measured' },
    { id: 'inferred', label: 'Inferred' },
    { id: 'revised', label: 'Revised' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NavBar navigate={navigate} current="/archive" />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => navigate('/archive')}
          className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to Archive
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-white">
              {crystal.pipelineResult.activatedNodes[0]?.label.replace(/_/g, ' ') ?? 'Event Detail'}
            </h1>
            <p className="text-slate-500 text-xs font-mono mt-0.5">{crystal.id}</p>
          </div>
          <div className="flex gap-2">
            <ConfidenceBadge value={sv.confidence} label="conf" size="md" />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {crystal.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded">
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>

        {/* Image */}
        <div className="flex items-start gap-4 mb-6">
          <div>
            <OverlayCanvas
              rawImageUri={crystal.rawImageUri}
              hypotheses={overlays}
              showOverlay={showOverlay}
              width={220}
              height={220}
            />
            <button
              onClick={() => setShowOverlay((v) => !v)}
              className={`mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors w-full justify-center ${
                showOverlay ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={12} />
              {showOverlay ? 'Hide overlay' : 'Show overlay'}
            </button>
          </div>
          <div className="flex-1 space-y-2">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <p className="text-slate-500 text-xs mb-2 uppercase tracking-wide">Context</p>
              <dl className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Device</dt>
                  <dd className="text-slate-300 font-mono">{crystal.pipelineResult.input.context.deviceId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Timestamp</dt>
                  <dd className="text-slate-300 font-mono">{crystal.pipelineResult.input.context.timestamp}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Exposure</dt>
                  <dd className="text-slate-300 font-mono">{crystal.pipelineResult.input.context.exposureMs}ms</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Recheck</dt>
                  <dd className={crystal.recheckFlag ? 'text-amber-400' : 'text-green-400'}>
                    {crystal.recheckFlag ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-slate-800">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-2 text-sm transition-colors ${
                tab === id
                  ? 'text-white border-b-2 border-green-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'raw' && (
          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-slate-400 text-xs uppercase px-3 py-2">Feature</th>
                    <th className="text-right text-slate-400 text-xs uppercase px-3 py-2">Value</th>
                    <th className="text-right text-slate-400 text-xs uppercase px-3 py-2">Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.entries(crystal.features) as [string, number][]).map(([k, v]) => (
                    <tr key={k} className="border-b border-slate-700/50">
                      <td className="px-3 py-2 text-slate-300 font-mono text-xs">{k}</td>
                      <td className="px-3 py-2 text-slate-300 text-xs text-right font-mono">{v.toFixed(3)}</td>
                      <td className="px-3 py-2">
                        <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden ml-auto">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.round(v * 100)}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Active nodes */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
                <Cpu size={11} /> Activated Nodes
              </p>
              <div className="space-y-1">
                {crystal.pipelineResult.activatedNodes.map((n) => (
                  <div key={n.id} className="flex items-center justify-between">
                    <span className="text-slate-300 text-xs font-mono">{n.label.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${Math.round(n.value * 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 font-mono w-8 text-right">{(n.value * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'inferred' && (
          <div className="space-y-4">
            <GuidePanel guide={crystal.guideBundle} />

            {crystal.pipelineResult.liftedPatterns.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Lifted Patterns</p>
                {crystal.pipelineResult.liftedPatterns.map((p) => (
                  <div key={p.id} className="mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium">{p.label}</span>
                      <span className="text-slate-400 text-xs font-mono">{(p.score * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">{p.matchedNodes.join(', ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'revised' && (
          <div className="space-y-4">
            <RevisionTimeline entries={crystal.revisionHistory} />

            {similarCrystals.length > 0 && (
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Similar Events</p>
                <div className="space-y-2">
                  {similarCrystals.map((c) => (
                    <EventCard key={c.id} crystal={c} onClick={() => navigateToEvent(c.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
