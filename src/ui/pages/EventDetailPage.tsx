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
import { Layers, ChevronLeft, Tag, Cpu, AlertTriangle, Upload, Camera } from 'lucide-react'
import { MeasuredSourceBadge } from '../components/MeasuredSourceBadge'
import { AnalysisProvenanceCard } from '../components/AnalysisProvenanceCard'
import { classifyMorphology } from '../../core/morphology/classifyMorphology'

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

  const overlays = buildOverlayHypothesis(crystal.features, crystal.pipelineResult.input.thresholdSignal)
  const sv = crystal.pipelineResult.stateVector
  const similarCrystals = crystal.memoryLinks.map((id) => crystals.find((c) => c.id === id)).filter((c): c is ObservationCrystal => c !== undefined)
  const sourceLabel = crystal.sourceType ?? 'sample'
  const isUploaded = sourceLabel === 'uploaded-image'
  const isCamera = sourceLabel === 'camera'
  // Use saved morphologyCandidate if available; otherwise classify on the fly
  const morphologyCandidate = crystal.morphologyCandidate ?? classifyMorphology(crystal.features)

  const TABS: Array<{ id: Tab; label: string; layerNote: string }> = [
    { id: 'raw', label: 'Raw', layerNote: 'Raw sensor capture: source image + capture context (no processing applied)' },
    { id: 'measured', label: 'Measured', layerNote: 'Directly measured from raw input: extracted features only — Geometry / Shape / Noise / Rarity (M2)' },
    { id: 'inferred', label: 'Inferred', layerNote: 'Pipeline conclusions from measured data: nodes, bindings, patterns, state vector, caution check, guide bundle, overlay hypotheses (M4–M10)' },
    { id: 'revised', label: 'Revised', layerNote: 'Post-evaluation: revision history, memory links, recheck flags, similar events' },
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
              key={crystal.id}
              rawImageUri={crystal.rawImageUri}
              hypotheses={overlays}
              thresholdSignal={crystal.pipelineResult.input.thresholdSignal}
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
              {showOverlay ? 'Hide overlay layers' : 'Show overlay layers'}
            </button>
          </div>
          <div className="flex-1 space-y-2">
            {/* Measured source badge — always visible so users can immediately see provenance */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-slate-500 uppercase tracking-wide">M2 Source</span>
              </div>
              <MeasuredSourceBadge source={crystal.measuredSource} showDescription />
            </div>
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
        <div className="flex gap-1 mb-1 border-b border-slate-800">
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
        {/* Layer note: shows which mapping stage output is being viewed */}
        <p className="text-slate-600 text-xs mb-4">
          {TABS.find((t) => t.id === tab)?.layerNote}
        </p>

        {/* Tab content */}

        {/* RAW: source image and capture context */}
        {tab === 'raw' && (
          <div className="space-y-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 text-xs uppercase tracking-wide">Source Image</p>
            <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${
              isUploaded
                ? 'bg-blue-900/40 text-blue-300 border-blue-700/40'
                : isCamera
                  ? 'bg-amber-900/40 text-amber-200 border-amber-800/40'
                  : 'bg-slate-700 text-slate-400 border-slate-600'
            }`}>
              {isUploaded && <Upload size={9} />}
              {isCamera && <Camera size={9} />}
              {sourceLabel}
            </span>
          </div>
          <div className="flex gap-4 items-start">
            <OverlayCanvas
              rawImageUri={crystal.rawImageUri}
              hypotheses={[]}
                  showOverlay={false}
                  width={140}
              height={140}
            />
            <div className="flex-1 text-xs text-slate-400 space-y-1">
              {isUploaded ? (
                <p>User-uploaded image — used as Raw observation input.</p>
              ) : isCamera ? (
                <p>Captured via browser camera — single frame frozen as Raw observation input.</p>
              ) : (
                <p>Raw sensor capture — no processing applied.</p>
              )}
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
                  <dt className="text-slate-500">Source</dt>
                  <dd className="text-slate-300 font-mono">{sourceLabel}</dd>
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

        {/* MEASURED: extracted features only (M2 output — what is directly measured from raw input) */}
        {tab === 'measured' && (
          <div className="space-y-4">
            {/* Measured source badge — always shown so the user knows the measurement provenance */}
            <div className="flex items-start gap-2">
              <MeasuredSourceBadge source={crystal.measuredSource} showDescription />
            </div>

            {/* Analysis Provenance card */}
            <AnalysisProvenanceCard provenance={crystal.analysisProvenance} />

            {/* Source type hint */}
            {(isUploaded || isCamera) && (
              <div
                className={`rounded-lg p-3 ${
                  isUploaded
                    ? 'bg-blue-900/20 border border-blue-700/40'
                    : 'bg-amber-900/20 border border-amber-800/40'
                }`}
              >
                {isUploaded && (
                  <p className="text-blue-300 text-xs">
                    <span className="font-semibold">Uploaded image features</span> — These measurements were extracted from your uploaded image.
                  </p>
                )}
                {isCamera && (
                  <p className="text-amber-200 text-xs">
                    <span className="font-semibold">Camera frame features</span> — Measurements derive from the captured browser camera frame.
                  </p>
                )}
              </div>
            )}

            {/* Geometry / Shape Features */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="px-3 pt-3 pb-2 border-b border-slate-700">
                <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">Geometry / Shape Features</p>
                <p className="text-slate-600 text-xs mt-0.5">Physical dimensions and track characteristics</p>
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'brightness', label: 'Brightness', desc: 'Overall brightness level', value: crystal.features.brightness },
                  { key: 'length', label: 'Length', desc: 'Normalized track length', value: crystal.features.length },
                  { key: 'width', label: 'Width', desc: 'Normalized track width', value: crystal.features.width },
                  { key: 'linearity', label: 'Linearity', desc: 'How straight the track is', value: crystal.features.linearity },
                  { key: 'curvature', label: 'Curvature', desc: 'How curved the track is', value: crystal.features.curvature },
                ].map(({ key, label, desc, value }) => (
                  <div key={key} className="bg-slate-900/60 border border-slate-700 rounded-md p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <p className="text-slate-300 text-xs font-semibold">{label}</p>
                        <p className="text-slate-600 text-[10px] mt-0.5">{desc}</p>
                      </div>
                      <span className="text-slate-200 font-mono text-sm ml-2">{value.toFixed(3)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.round(value * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Noise / Rarity Features */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="px-3 pt-3 pb-2 border-b border-slate-700">
                <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">Noise / Rarity Features</p>
                <p className="text-slate-600 text-xs mt-0.5">Signal quality and uniqueness indicators</p>
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'scatterScore', label: 'Scatter Score', desc: 'Degree of signal scatter', value: crystal.features.scatterScore },
                  { key: 'clusterScore', label: 'Cluster Score', desc: 'Density of signal clustering', value: crystal.features.clusterScore },
                  { key: 'rarityScore', label: 'Rarity Score', desc: 'Unusualness vs baseline', value: crystal.features.rarityScore },
                  { key: 'noiseScore', label: 'Noise Score', desc: 'Estimated noise level', value: crystal.features.noiseScore },
                ].map(({ key, label, desc, value }) => (
                  <div key={key} className="bg-slate-900/60 border border-slate-700 rounded-md p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <p className="text-slate-300 text-xs font-semibold">{label}</p>
                        <p className="text-slate-600 text-[10px] mt-0.5">{desc}</p>
                      </div>
                      <span className="text-slate-200 font-mono text-sm ml-2">{value.toFixed(3)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round(value * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-700 rounded-md p-2">
              <p className="text-slate-500 text-[11px]">
                Nodes, bindings, patterns, state vector, and caution check are in the <span className="text-slate-300">Inferred</span> tab — they are conclusions constructed by the pipeline, not direct measurements.
              </p>
            </div>
          </div>
        )}

        {/* INFERRED: activated nodes, bindings, patterns, state vector, caution check, guide bundle, overlay hypotheses (M4–M10) */}
        {tab === 'inferred' && (
          <div className="space-y-4">
            {/* Activated nodes */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 text-xs uppercase tracking-wide flex items-center gap-1">
                  <Cpu size={11} /> Activated Observation Nodes <span className="text-slate-600 text-[10px] ml-1">[M4]</span>
                </p>
                <p className="text-slate-600 text-[10px]">Feature → Node (Inferred)</p>
              </div>
              <div className="space-y-2">
                {crystal.pipelineResult.activatedNodes.map((n) => {
                  // Map features to nodes based on common relationships
                  const relatedFeatures: string[] = []
                  if (n.id === 'linear_trace' && crystal.features.linearity > 0.5) relatedFeatures.push('linearity')
                  if (n.id === 'curved_track' && crystal.features.curvature > 0.4) relatedFeatures.push('curvature')
                  if (n.id === 'clustered_flash' && crystal.features.clusterScore > 0.4) relatedFeatures.push('clusterScore')
                  if (n.id === 'scattered_flash' && crystal.features.scatterScore > 0.4) relatedFeatures.push('scatterScore')
                  if (n.id === 'bright_spot' && crystal.features.brightness > 0.6) relatedFeatures.push('brightness')
                  if (n.id === 'dim_trace' && crystal.features.brightness < 0.4) relatedFeatures.push('brightness')
                  if (n.id === 'artifact_candidate' && crystal.features.noiseScore > 0.5) relatedFeatures.push('noiseScore')
                  if (n.id === 'rare_candidate' && crystal.features.rarityScore > 0.6) relatedFeatures.push('rarityScore')

                  return (
                    <div key={n.id} className="bg-slate-900/60 border border-slate-700 rounded-md p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-300 text-xs font-mono">{n.label.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 text-xs">{n.category}</span>
                          <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${Math.round(n.value * 100)}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 font-mono w-8 text-right">{(n.value * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      {relatedFeatures.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-slate-600 text-[10px]">driven by:</span>
                          {relatedFeatures.map((f) => (
                            <span key={f} className="text-blue-400 text-[10px] bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-700/30">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* State vector (M6) */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">
                State Vector <span className="text-slate-600 text-[10px]">[M6 — Inferred]</span>
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(Object.entries(sv) as [string, number][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-slate-300 font-mono">{v.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Morphology Candidate — Inferred */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
                Morphology Candidate <span className="text-slate-600 text-[10px] ml-1">[Inferred]</span>
              </p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-semibold">{morphologyCandidate.label}</span>
                <span className="text-slate-300 font-mono text-xs">{(morphologyCandidate.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.round(morphologyCandidate.confidence * 100)}%` }} />
              </div>
              <div className="space-y-0.5 mb-2">
                {morphologyCandidate.reasons.map((r, i) => (
                  <p key={i} className="text-slate-400 text-xs">· {r}</p>
                ))}
              </div>
              <div className="bg-amber-900/20 border border-amber-800/30 rounded p-2 space-y-1">
                {morphologyCandidate.cautionNotes.map((n, i) => (
                  <p key={i} className="text-amber-300 text-xs">⚠ {n}</p>
                ))}
              </div>
            </div>

            <GuidePanel guide={crystal.guideBundle} />
            {crystal.pipelineResult.liftedPatterns.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Lifted Patterns <span className="text-slate-600 text-[10px]">[M4 — Inferred]</span></p>
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

            {/* Home check result (M8) */}
            <div className="bg-slate-800 border border-amber-800/40 rounded-lg p-3">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
                <AlertTriangle size={11} className="text-amber-400" /> Caution Check <span className="text-slate-600 text-[10px] ml-1">[M8 — Inferred]</span>
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
