import { useRef, useState } from 'react'
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
  const [focusedStep, setFocusedStep] = useState<'raw' | 'measured' | 'nodes' | 'state' | 'caution' | 'guide' | 'crystal'>('state')
  const rawRef = useRef<HTMLDivElement>(null)
  const measuredRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<HTMLDivElement>(null)
  const cautionRef = useRef<HTMLDivElement>(null)
  const guideRef = useRef<HTMLDivElement>(null)
  const crystalRef = useRef<HTMLDivElement>(null)

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

  const focusedStepInfo = vm.mappingFlow.find((step) => step.id === focusedStep) ?? vm.mappingFlow.find((step) => step.id === 'state') ?? vm.mappingFlow[0]

  const handleFlowSelect = (id: typeof focusedStep) => {
    setFocusedStep(id)
    const ref =
      id === 'raw' ? rawRef :
      id === 'measured' ? measuredRef :
      id === 'nodes' ? nodesRef :
      id === 'state' ? stateRef :
      id === 'caution' ? cautionRef :
      id === 'guide' ? guideRef :
      crystalRef
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const highlight = (id: typeof focusedStep) => (focusedStep === id ? 'ring-2 ring-blue-500/70 shadow-lg shadow-blue-500/20' : '')

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

        {/* Summary card (Raw focus) */}
        <div ref={rawRef} className={`bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4 ${highlight('raw')}`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-white font-semibold">{vm.summaryCard.title}</p>
              <p className="text-slate-400 text-sm">{vm.summaryCard.subtitle}</p>
              {/* Source type display */}
              {activeCrystal?.sourceType && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${
                    activeCrystal.sourceType === 'uploaded-image'
                      ? 'bg-blue-900/40 text-blue-300 border-blue-700/40'
                      : 'bg-slate-700 text-slate-400 border-slate-600'
                  }`}>
                    {activeCrystal.sourceType === 'uploaded-image' ? 'uploaded image' : activeCrystal.sourceType}
                  </span>
                  {activeCrystal.sourceType === 'uploaded-image' && (
                    <span className="text-slate-500 text-[10px]">Image-derived observation</span>
                  )}
                </div>
              )}
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

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 text-xs uppercase tracking-wide">Current Mapping Flow</p>
            <p className="text-[11px] text-slate-500 truncate max-w-[50%]">{vm.flowBlurb}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {vm.mappingFlow.map((step, index) => (
              <div key={step.label} className="contents">
                <button
                  type="button"
                  onClick={() => handleFlowSelect(step.id)}
                  className={`rounded-full border px-2.5 py-1 transition ${
                    focusedStep === step.id
                      ? 'border-blue-400 bg-blue-500/20 text-blue-50 shadow-blue-500/30 shadow'
                      : step.active
                        ? 'border-blue-500/40 bg-blue-500/10 text-blue-100'
                        : 'border-slate-700 bg-slate-800 text-slate-500'
                  }`}
                  aria-pressed={focusedStep === step.id}
                >
                  <span>{step.label}</span>
                  {step.mappingId && <span className="ml-1 text-[10px] text-slate-400">[{step.mappingId}]</span>}
                  {step.name && step.name !== step.label && <span className="ml-2 text-[10px] text-slate-400">{step.name}</span>}
                </button>
                {index < vm.mappingFlow.length - 1 && <span className="text-slate-600">→</span>}
              </div>
            ))}
          </div>
          <div className="mt-3 text-[11px] text-slate-400 bg-slate-800/60 border border-slate-700 rounded-md p-2">
            <p className="text-slate-200 font-semibold">
              {focusedStepInfo.label} {focusedStepInfo.mappingId && `[${focusedStepInfo.mappingId}]`} {focusedStepInfo.name && focusedStepInfo.name !== focusedStepInfo.label ? `· ${focusedStepInfo.name}` : ''}
            </p>
            {focusedStepInfo.description && <p className="text-slate-400 mt-1">{focusedStepInfo.description}</p>}
            {focusedStepInfo.outputLabel && <p className="text-slate-500 mt-1">Outputs: {focusedStepInfo.outputLabel}</p>}
            <p className="text-slate-500 mt-1">Click any step to jump to the related evidence below.</p>
          </div>
        </div>

        {/* Measured (M2) */}
        <div ref={measuredRef} className={`bg-slate-900 border border-slate-700 rounded-lg p-3 mb-4 ${highlight('measured')}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 text-xs uppercase tracking-wide">Measured [M2] — Extracted Features</p>
            {activeCrystal?.sourceType === 'uploaded-image' && (
              <span className="text-blue-400 text-[10px] bg-blue-900/30 px-2 py-0.5 rounded border border-blue-700/30">
                from uploaded image
              </span>
            )}
          </div>

          {/* Feature descriptions helper */}
          <div className="mb-3 bg-slate-800/60 border border-slate-700 rounded-md p-2">
            <p className="text-slate-400 text-[11px] leading-relaxed">
              <span className="font-semibold text-slate-300">Feature meanings:</span> linearity = straightness of track ·
              scatterScore = degree of signal scatter · noiseScore = noise contamination ·
              rarityScore = unusualness vs baseline · clusterScore = signal clustering density
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {vm.features.map((f) => {
              const descriptions: Record<string, string> = {
                brightness: 'Overall brightness',
                length: 'Track length',
                width: 'Track width',
                linearity: 'Straightness',
                curvature: 'Curvedness',
                scatterScore: 'Scatter degree',
                clusterScore: 'Cluster density',
                rarityScore: 'Unusualness',
                noiseScore: 'Noise level',
              }
              return (
                <div key={f.key} className="bg-slate-800/60 border border-slate-700 rounded p-2">
                  <p className="text-slate-400 text-[11px] uppercase tracking-wide">{f.label}</p>
                  <p className="text-white font-mono text-sm">{f.value.toFixed(2)}</p>
                  <p className="text-slate-600 text-[10px] mt-0.5">{descriptions[f.key] ?? f.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Nodes / Patterns (M4) */}
        <div ref={nodesRef} className={`space-y-4 ${highlight('nodes')}`}>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Nodes [M4] — Active Signals ({vm.activeSignals.length})</p>
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

          {vm.patternCards.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
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
        </div>

        {/* State vector with contributors (M6) */}
        <div ref={stateRef} className={`bg-slate-800 border border-slate-700 rounded-lg p-3 mt-4 ${highlight('state')}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 text-xs uppercase tracking-wide">State [M6] — Observation State Vector</p>
            <p className="text-slate-600 text-[10px]">Feature/Node → State relationships</p>
          </div>
          <div className="space-y-3">
            {vm.stateVectorItems.map((item) => (
              <div key={item.key} className="bg-slate-900/60 border border-slate-700 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-semibold">{item.label}</span>
                  <span className="text-slate-200 font-mono text-sm">{(item.value * 100).toFixed(0)}%</span>
                </div>
                {item.contributors.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {item.contributors.map((c, idx) => (
                      <div key={`${item.key}-${c.sourceId}-${idx}`} className="flex items-start justify-between bg-slate-800/80 border border-slate-700 rounded p-2">
                        <div>
                          <p className="text-slate-200 text-xs font-semibold">{c.label}</p>
                          <p className="text-slate-500 text-[11px]">{c.reason ?? `${c.sourceType} contributor`}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-[10px] uppercase">{c.sourceType}</p>
                          {c.weight !== undefined && (
                            <p className={`font-mono text-[11px] ${c.weight >= 0 ? 'text-blue-300' : 'text-amber-300'}`}>
                              {c.weight >= 0 ? '+' : ''}
                              {(c.weight * 100).toFixed(0)}%
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs mt-1">No contributors tracked.</p>
                )}
              </div>
            ))}
          </div>

          {/* Feature → State hints */}
          <div className="mt-3 bg-slate-800/60 border border-slate-700 rounded-md p-2">
            <p className="text-slate-500 text-[10px] font-semibold mb-1">Common feature → state relationships:</p>
            <ul className="text-slate-500 text-[10px] space-y-0.5">
              <li>• linearity → confidence, geometryClarity</li>
              <li>• noiseScore → artifactRisk, caution</li>
              <li>• rarityScore → raritySignal, claimStrength</li>
              <li>• clusterScore → particleLikelihood</li>
            </ul>
          </div>
        </div>

        {/* Internal process log */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 mt-4 mb-4 font-mono text-xs">
          <p className="text-slate-500 mb-2 uppercase tracking-wide">Pipeline Process Log</p>
          {vm.internalProcessLines.map((line) => (
            <div key={line.stage} className="flex gap-3 mb-1">
              <span className="text-slate-500 w-32 shrink-0">[{line.stage}]</span>
              <span className="text-slate-300 break-all">{line.content}</span>
            </div>
          ))}
        </div>

        {/* Caution notes */}
        <div ref={cautionRef} className={`bg-slate-800 border border-amber-800/40 rounded-lg p-3 mb-4 ${highlight('caution')}`}>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
            <AlertTriangle size={11} className="text-amber-400" /> Home Check
          </p>
          <ul className="space-y-1">
            {vm.cautionSummary.notes.map((note, i) => (
              <li key={i} className="text-slate-300 text-xs">• {note}</li>
            ))}
          </ul>
        </div>

        {/* Guide preview */}
        <div ref={guideRef} className={`bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4 ${highlight('guide')}`}>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Guide [M10]</p>
          <p className="text-white text-sm font-semibold mb-1">Quick</p>
          <p className="text-slate-300 text-sm mb-2">{vm.guidePreview.quickGuide}</p>
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Deep</p>
          <p className="text-slate-300 text-sm mb-2">{vm.guidePreview.deepGuide}</p>
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Bridge</p>
          <p className="text-slate-300 text-sm mb-2">{vm.guidePreview.bridgeGuide}</p>
          {vm.guidePreview.cautionNotes.length > 0 && (
            <div className="mt-2">
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Guide Cautions</p>
              <ul className="list-disc list-inside text-slate-400 text-xs space-y-1">
                {vm.guidePreview.cautionNotes.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Crystal layer */}
        <div ref={crystalRef} className={`bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4 ${highlight('crystal')}`}>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Crystal [M11]</p>
          {activeCrystal ? (
            <div className="text-slate-300 text-sm space-y-1">
              <p>ID: <span className="font-mono text-xs text-slate-400">{activeCrystal.id}</span></p>
              <p>Saved at: {new Date(activeCrystal.createdAt).toLocaleString()}</p>
              <p>Tags: {activeCrystal.tags.length > 0 ? activeCrystal.tags.join(', ') : 'None'}</p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Not saved yet — run the sample event or save a crystal to populate this layer.</p>
          )}
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
