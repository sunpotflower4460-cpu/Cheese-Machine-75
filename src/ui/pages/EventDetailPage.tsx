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
import { Layers, ChevronLeft, Tag, Cpu, AlertTriangle } from 'lucide-react'

type EventDetailPageProps = {
  crystal: ObservationCrystal | null
  crystals: ObservationCrystal[]
  navigate: (to: Route) => void
  navigateToEvent: (id: string) => void
}

/** Crystal detail tabs aligned to the 4 observation layers */
type Tab = 'raw' | 'measured' | 'inferred' | 'revised'

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

  const TABS: Array<{ id: Tab; label: string; description: string }> = [
    { id: 'raw', label: 'Raw', description: 'Source image and capture context' },
    { id: 'measured', label: 'Measured', description: 'Extracted features, nodes, bindings, state vector' },
    { id: 'inferred', label: 'Inferred', description: 'Guide bundle, patterns, overlay hypotheses' },
    { id: 'revised', label: 'Revised', description: 'Revision history and similar events' },
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

        {/* Image + overlay (quick view above tabs) */}
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
              {showOverlay ? 'Hide inferred overlay' : 'Show inferred overlay'}
            </button>
          </div>
          <div className="flex-1 space-y-2">
            {/* Recheck status badge */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-slate-500 uppercase tracking-wide">Recheck</span>
                <span className={crystal.recheckFlag ? 'text-amber-400' : 'text-green-400'}>
                  {crystal.recheckFlag ? '⚠ Flagged' : '✓ Clear'}
                </span>
              </div>
              <p className="text-slate-600 text-xs">See the <span className="text-slate-400">Raw</span> tab for capture context, <span className="text-slate-400">Measured</span> for features.</p>
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
        {/* Tab description */}
        <p className="text-slate-600 text-xs mb-3 italic">
          {TABS.find((t) => t.id === tab)?.description}
        </p>

        {/* Tab content */}

        {/* RAW: source image and capture context */}
        {tab === 'raw' && (
          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-3">Source Image</p>
              <div className="flex gap-4 items-start">
                <OverlayCanvas
                  rawImageUri={crystal.rawImageUri}
                  hypotheses={[]}
                  showOverlay={false}
                  width={140}
                  height={140}
                />
                <div className="flex-1 text-xs text-slate-400 space-y-1">
                  <p>Raw sensor capture — no processing applied.</p>
                  <p>Use the <span className="text-slate-300">Measured</span> tab to see extracted features.</p>
                  <p>Use the <span className="text-slate-300">Inferred</span> tab to see the guide and patterns.</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Capture Context</p>
              <dl className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Event ID</dt>
                  <dd className="text-slate-300 font-mono">{crystal.pipelineResult.input.eventId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Device</dt>
                  <dd className="text-slate-300 font-mono">{crystal.pipelineResult.input.context.deviceId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Session</dt>
                  <dd className="text-slate-300 font-mono">{crystal.pipelineResult.input.context.sessionId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Timestamp</dt>
                  <dd className="text-slate-300 font-mono">{crystal.pipelineResult.input.context.timestamp}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Exposure</dt>
                  <dd className="text-slate-300 font-mono">{crystal.pipelineResult.input.context.exposureMs}ms</dd>
                </div>
                {crystal.pipelineResult.input.notes && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Notes</dt>
                    <dd className="text-slate-300">{crystal.pipelineResult.input.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        {/* MEASURED: extracted features, activated nodes, state vector */}
        {tab === 'measured' && (
          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <p className="text-slate-500 text-xs uppercase tracking-wide px-3 pt-2 pb-1">Extracted Features</p>
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

            {/* Activated nodes */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
                <Cpu size={11} /> Activated Observation Nodes
              </p>
              <div className="space-y-1">
                {crystal.pipelineResult.activatedNodes.map((n) => (
                  <div key={n.id} className="flex items-center justify-between">
                    <span className="text-slate-300 text-xs font-mono">{n.label.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 text-xs">{n.category}</span>
                      <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${Math.round(n.value * 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 font-mono w-8 text-right">{(n.value * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* State vector */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">State Vector</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(Object.entries(sv) as [string, number][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-slate-300 font-mono">{v.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INFERRED: guide bundle, lifted patterns, overlay hypotheses, home check */}
        {tab === 'inferred' && (
          <div className="space-y-4">
            <GuidePanel guide={crystal.guideBundle} />

            {crystal.pipelineResult.liftedPatterns.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Lifted Patterns (Interpretation)</p>
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

            {/* Home check result */}
            <div className="bg-slate-800 border border-amber-800/40 rounded-lg p-3">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
                <AlertTriangle size={11} className="text-amber-400" /> Caution Check (Home Layer)
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {crystal.homeCheck.cautionUp && (
                  <span className="text-xs bg-red-900/40 text-red-300 border border-red-800/40 px-2 py-0.5 rounded">cautionUp</span>
                )}
                {crystal.homeCheck.softenClaim && (
                  <span className="text-xs bg-amber-900/40 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded">softenClaim</span>
                )}
                {crystal.homeCheck.holdAsInteresting && (
                  <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-800/40 px-2 py-0.5 rounded">holdAsInteresting</span>
                )}
                {crystal.homeCheck.keepAsStrongCandidate && (
                  <span className="text-xs bg-green-900/40 text-green-300 border border-green-800/40 px-2 py-0.5 rounded">keepAsStrongCandidate</span>
                )}
              </div>
              <ul className="space-y-0.5">
                {crystal.homeCheck.reasons.map((r, i) => (
                  <li key={i} className="text-slate-400 text-xs">• {r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* REVISED: revision timeline, similar events, memory links */}
        {tab === 'revised' && (
          <div className="space-y-4">
            <RevisionTimeline entries={crystal.revisionHistory} />

            {similarCrystals.length > 0 && (
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Memory Links – Similar Events</p>
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
