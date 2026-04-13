import { useState, useCallback } from 'react'
import type { Route } from '../../App'
import type { ObservationCrystal } from '../../types/observation'
import { NavBar } from '../components/NavBar'
import { GuidePanel } from '../components/GuidePanel'
import { OverlayCanvas } from '../components/OverlayCanvas'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { runObservationPipeline } from '../../core/runObservationPipeline'
import { buildGuideText } from '../../core/guide/buildGuideText'
import { buildObservationHomeCheck } from '../../core/observation/buildObservationHomeCheck'
import { buildObservationCrystal } from '../../core/buildObservationCrystal'
import { buildOverlayHypothesis } from '../../core/simulation/buildOverlayHypothesis'
import { detectNextEvent } from '../../core/observation/detectObservationEvent'
import { ChevronRight, Save, Layers, Eye } from 'lucide-react'

type LiveObservePageProps = {
  crystals: ObservationCrystal[]
  onSave: (crystal: ObservationCrystal) => void
  navigate: (to: Route) => void
}

export function LiveObservePage({ crystals, onSave, navigate }: LiveObservePageProps) {
  const [eventIndex, setEventIndex] = useState(0)
  const [showOverlay, setShowOverlay] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  const { event } = detectNextEvent(eventIndex)
  const result = runObservationPipeline(event)
  const guide = buildGuideText(result)
  const homeCheck = buildObservationHomeCheck(result)
  const overlays = buildOverlayHypothesis(event.features)
  const sv = result.stateVector

  const handleNext = useCallback(() => {
    setSavedId(null)
    setEventIndex((i) => i + 1)
  }, [])

  const handleSave = useCallback(() => {
    const crystal = buildObservationCrystal(result, guide, homeCheck, crystals)
    onSave(crystal)
    setSavedId(crystal.id)
  }, [result, guide, homeCheck, crystals, onSave])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NavBar navigate={navigate} current="/observe" />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye size={18} className="text-green-400" />
            Live Observe
          </h1>
          <span className="text-slate-500 text-xs font-mono">
            Event {(eventIndex % 5) + 1} of 5 samples
          </span>
        </div>

        {/* Event ID + context */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4 text-xs text-slate-400 font-mono">
          <span className="text-slate-500">id:</span> {event.eventId} &nbsp;|&nbsp;
          <span className="text-slate-500">ts:</span> {event.context.timestamp} &nbsp;|&nbsp;
          <span className="text-slate-500">device:</span> {event.context.deviceId}
          {event.notes && <span className="block mt-1 text-slate-500">{event.notes}</span>}
        </div>

        {/* Image + overlay */}
        <div className="flex items-start gap-4 mb-4">
          <div>
            <OverlayCanvas
              rawImageUri={event.rawImageUri}
              hypotheses={overlays}
              showOverlay={showOverlay}
              width={200}
              height={200}
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

          {/* State vector mini */}
          <div className="flex-1 space-y-2">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <p className="text-slate-500 text-xs mb-2 uppercase tracking-wide">State Vector</p>
              {(
                [
                  ['Confidence', sv.confidence],
                  ['Particle likelihood', sv.particleLikelihood],
                  ['Artifact risk', sv.artifactRisk],
                  ['Noise level', sv.noiseLevel],
                ] as [string, number][]
              ).map(([label, val]) => (
                <div key={label} className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 text-xs">{label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${Math.round(val * 100)}%` }}
                      />
                    </div>
                    <span className="text-slate-300 text-xs font-mono w-8 text-right">{Math.round(val * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <ConfidenceBadge value={sv.confidence} label="conf" size="md" />
              <ConfidenceBadge value={sv.particleLikelihood} label="particle" size="md" />
            </div>
          </div>
        </div>

        {/* Guide */}
        <div className="mb-4">
          <GuidePanel guide={guide} compact />
        </div>

        {/* Active nodes */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4">
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Active Nodes ({result.activatedNodes.length})</p>
          <div className="flex flex-wrap gap-1">
            {result.activatedNodes.map((n) => (
              <span key={n.id} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                {n.label.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <ChevronRight size={16} />
            Next Event
          </button>
          <button
            onClick={handleSave}
            disabled={savedId !== null}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Save size={16} />
            {savedId ? 'Saved ✓' : 'Save Crystal'}
          </button>
        </div>
      </div>
    </div>
  )
}
