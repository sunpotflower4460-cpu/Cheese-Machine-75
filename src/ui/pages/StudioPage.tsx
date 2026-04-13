import { useState } from 'react'
import type { Route } from '../../App'
import type { ObservationCrystal } from '../../types/observation'
import { NavBar } from '../components/NavBar'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { buildObservationViewModel } from '../../studio/buildObservationViewModel'
import { runObservationPipeline } from '../../core/runObservationPipeline'
import { buildGuideText } from '../../core/guide/buildGuideText'
import { buildObservationHomeCheck } from '../../core/observation/buildObservationHomeCheck'
import { getSampleEvent } from '../../core/observation/detectObservationEvent'
import { Atom, ChevronDown, AlertTriangle } from 'lucide-react'

type StudioPageProps = {
  crystal: ObservationCrystal | null
  crystals: ObservationCrystal[]
  navigate: (to: Route) => void
  navigateToEvent: (id: string) => void
}

export function StudioPage({ crystal, crystals, navigate, navigateToEvent }: StudioPageProps) {
  const [selectedId, setSelectedId] = useState<string>(crystal?.id ?? '')

  // Resolve which crystal to show, or fall back to running sample-001
  const activeCrystal = selectedId ? crystals.find((c) => c.id === selectedId) ?? crystal : crystal

  // If no crystal available, run a fresh pipeline on sample-001
  const sampleResult = (() => {
    if (!activeCrystal) {
      const input = getSampleEvent(0)
      const r = runObservationPipeline(input)
      const g = buildGuideText(r)
      const h = buildObservationHomeCheck(r)
      return { result: r, guide: g, homeCheck: h }
    }
    return {
      result: activeCrystal.pipelineResult,
      guide: activeCrystal.guideBundle,
      homeCheck: activeCrystal.homeCheck,
    }
  })()

  const vm = buildObservationViewModel(sampleResult.result, sampleResult.guide, sampleResult.homeCheck, activeCrystal ?? undefined)

  const cautionColor =
    vm.cautionSummary.level === 'high' ? 'text-red-400' :
    vm.cautionSummary.level === 'medium' ? 'text-amber-400' :
    'text-green-400'

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NavBar navigate={navigate} current="/studio" />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Atom size={18} className="text-blue-400" />
          <h1 className="text-lg font-bold text-white">Observation Studio</h1>
        </div>

        {/* Crystal selector */}
        {crystals.length > 0 && (
          <div className="relative mb-6">
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value)
                if (e.target.value) navigateToEvent(e.target.value)
              }}
              className="w-full appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm px-3 py-2 rounded-lg pr-8"
            >
              <option value="">— Sample event (not saved) —</option>
              {crystals.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.pipelineResult.activatedNodes[0]?.label.replace(/_/g, ' ')} · {new Date(c.createdAt).toLocaleString()}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        )}

        {/* Summary card */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-white font-semibold">{vm.summaryCard.title}</p>
              <p className="text-slate-400 text-sm">{vm.summaryCard.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <ConfidenceBadge value={parseFloat(vm.summaryCard.confidence) / 100} label="conf" size="md" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-700/50 rounded p-2 text-center">
              <p className="text-slate-400 mb-1">Particle</p>
              <p className="text-white font-mono">{vm.summaryCard.particleLikelihood}</p>
            </div>
            <div className="bg-slate-700/50 rounded p-2 text-center">
              <p className="text-slate-400 mb-1">Artifact risk</p>
              <p className="text-white font-mono">{vm.summaryCard.artifactRisk}</p>
            </div>
            <div className={`bg-slate-700/50 rounded p-2 text-center ${cautionColor}`}>
              <p className="text-slate-400 mb-1">Caution</p>
              <p className="font-semibold capitalize">{vm.cautionSummary.level}</p>
            </div>
          </div>
        </div>

        {/* Internal process log */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 mb-4 font-mono text-xs">
          <p className="text-slate-500 mb-2 uppercase tracking-wide">Pipeline Process Log</p>
          {vm.internalProcessLines.map((line) => (
            <div key={line.stage} className="flex gap-3 mb-1">
              <span className="text-slate-500 w-32 shrink-0">[{line.stage}]</span>
              <span className="text-slate-300 break-all">{line.content}</span>
            </div>
          ))}
        </div>

        {/* Active signals */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4">
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Active Signals ({vm.activeSignals.length})</p>
          <div className="space-y-2">
            {vm.activeSignals.map((s) => (
              <div key={s.id}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-slate-300 text-xs font-mono">{s.label.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs">{s.category}</span>
                    <span className="text-slate-400 text-xs font-mono">{(s.value * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-slate-600 text-xs">{s.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Patterns */}
        {vm.patternCards.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Lifted Patterns</p>
            {vm.patternCards.map((p) => (
              <div key={p.id} className="mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-semibold">{p.label}</span>
                  <span className="text-slate-400 font-mono text-xs">{(p.score * 100).toFixed(0)}%</span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">{p.description}</p>
                <p className="text-slate-600 text-xs mt-0.5">Nodes: {p.matchedNodes.join(', ')}</p>
              </div>
            ))}
          </div>
        )}

        {/* Caution notes */}
        <div className="bg-slate-800 border border-amber-800/40 rounded-lg p-3 mb-4">
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
            <AlertTriangle size={11} className="text-amber-400" /> Home Check
          </p>
          <ul className="space-y-1">
            {vm.cautionSummary.notes.map((note, i) => (
              <li key={i} className="text-slate-300 text-xs">• {note}</li>
            ))}
          </ul>
        </div>

        {/* Overlay hints */}
        {vm.overlayHints.length > 0 && (
          <div className="bg-slate-800 border border-blue-800/40 rounded-lg p-3">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Overlay Hints</p>
            {vm.overlayHints.map((hint, i) => (
              <p key={i} className="text-blue-300 text-xs">→ {hint}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
