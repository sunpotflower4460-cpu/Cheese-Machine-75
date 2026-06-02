import { useState, useCallback } from 'react'
import type { Route } from '../../App'
import type { ObservationCrystal, ObservationInput } from '../../types/observation'
import { NavBar } from '../components/NavBar'
import { GuidePanel } from '../components/GuidePanel'
import { OverlayCanvas } from '../components/OverlayCanvas'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { ImageUploadInput } from '../components/ImageUploadInput'
import { CameraCaptureInput } from '../components/CameraCaptureInput'
import { runObservationPipeline } from '../../core/runObservationPipeline'
import { buildGuideText } from '../../core/guide/buildGuideText'
import { buildObservationHomeCheck } from '../../core/observation/buildObservationHomeCheck'
import { buildObservationCrystal, previewAnalysisProvenance } from '../../core/buildObservationCrystal'
import { buildOverlayHypothesis } from '../../core/simulation/buildOverlayHypothesis'
import { detectNextEvent, buildInputFromUploadedImage, buildInputFromCameraFrame } from '../../core/observation/detectObservationEvent'
import { extractEventFeatures } from '../../core/observation/extractEventFeatures'
import { ChevronRight, Save, Layers, Eye, Upload, Camera, AlertTriangle } from 'lucide-react'
import { MeasuredSourceBadge } from '../components/MeasuredSourceBadge'
import { deriveMeasuredSource } from '../../core/observation/measuredSource'
import { AnalysisProvenanceCard } from '../components/AnalysisProvenanceCard'

type LiveObservePageProps = {
  crystals: ObservationCrystal[]
  onSave: (crystal: ObservationCrystal) => void
  navigate: (to: Route) => void
}

type InputMode = 'sample' | 'upload' | 'camera'
type SetupChecklistKey = 'coverLens' | 'reduceLeaks' | 'keepStill' | 'avoidHeat' | 'treatAsCandidates'

const SETUP_GUIDE_HIDDEN_KEY = 'live-observe-setup-guide-hidden'

export function LiveObservePage({ crystals, onSave, navigate }: LiveObservePageProps) {
  const [inputMode, setInputMode] = useState<InputMode>('camera')
  const [eventIndex, setEventIndex] = useState(0)
  const [uploadedInput, setUploadedInput] = useState<ObservationInput | null>(null)
  const [cameraInput, setCameraInput] = useState<ObservationInput | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [setupGuideHidden, setSetupGuideHidden] = useState(() => {
    if (typeof localStorage === 'undefined') {
      return false
    }
    try {
      return localStorage.getItem(SETUP_GUIDE_HIDDEN_KEY) === '1'
    } catch {
      return false
    }
  })
  const [setupGuideExpanded, setSetupGuideExpanded] = useState(false)
  const [setupChecklist, setSetupChecklist] = useState<Record<SetupChecklistKey, boolean>>({
    coverLens: false,
    reduceLeaks: false,
    keepStill: false,
    avoidHeat: false,
    treatAsCandidates: false,
  })

  // Resolve active event based on mode
  const { event: sampleEvent } = detectNextEvent(eventIndex)
  const uploadPlaceholder: ObservationInput | null =
    inputMode === 'upload' && !uploadedInput
      ? {
          eventId: 'upload-pending',
          features: extractEventFeatures({}),
          context: {
            deviceId: 'uploaded-image',
            sessionId: 'session-upload-pending',
            timestamp: new Date().toISOString(),
            exposureMs: 0,
            notes: 'Awaiting image upload',
          },
          rawImageUri: '',
          sourceType: 'uploaded-image',
          measuredSource: 'placeholder-dimension',
          notes: 'Waiting for image upload',
        }
      : null
  const cameraPlaceholder: ObservationInput | null =
    inputMode === 'camera' && !cameraInput
      ? {
          eventId: 'camera-pending',
          features: extractEventFeatures({}),
          context: {
            deviceId: 'browser-camera',
            sessionId: 'session-camera-pending',
            timestamp: new Date().toISOString(),
            exposureMs: 0,
            notes: 'Awaiting camera capture',
          },
          rawImageUri: '',
          sourceType: 'camera',
          measuredSource: 'placeholder-dimension',
          notes: 'Waiting for camera capture',
        }
      : null
  const activeUploadEvent = uploadedInput ?? uploadPlaceholder
  const activeCameraEvent = cameraInput ?? cameraPlaceholder
  const event: ObservationInput =
    inputMode === 'upload'
      ? activeUploadEvent ?? sampleEvent
      : inputMode === 'camera'
        ? activeCameraEvent ?? sampleEvent
        : sampleEvent

  const result = runObservationPipeline(event)
  const guide = buildGuideText(result)
  const homeCheck = buildObservationHomeCheck(result)
  const overlays = buildOverlayHypothesis(event.features, event.thresholdSignal)
  const sv = result.stateVector
  const currentMeasuredSource = event.measuredSource ?? deriveMeasuredSource(event.sourceType)
  const provenancePreview = previewAnalysisProvenance(currentMeasuredSource, event.sourceType)
  const qualityNotes = Array.from(new Set([...guide.cautionNotes, ...homeCheck.reasons, ...provenancePreview.warnings]))
  const hasCandidateInput = (inputMode === 'upload' && !!uploadedInput) || (inputMode === 'camera' && !!cameraInput)
  const showCandidateReview = inputMode !== 'sample' && hasCandidateInput
  const calibrationApplied = provenancePreview.calibrationStatus === 'applied'

  const handleNext = useCallback(() => {
    setSavedId(null)
    setEventIndex((i) => i + 1)
  }, [])

  const handleSave = useCallback(() => {
    const crystal = buildObservationCrystal(result, guide, homeCheck, crystals)
    onSave(crystal)
    setSavedId(crystal.id)
  }, [result, guide, homeCheck, crystals, onSave])

  const handleImageReady = useCallback(
    async (imageUri: string, width: number, height: number, fileName: string) => {
      setSavedId(null)
      const input = await buildInputFromUploadedImage(imageUri, width, height, `Uploaded: ${fileName}`)
      setUploadedInput(input)
    },
    [],
  )

  const handleCameraReady = useCallback(async (imageUri: string, width: number, height: number) => {
    setSavedId(null)
    const input = await buildInputFromCameraFrame(imageUri, width, height)
    setCameraInput(input)
  }, [])

  const handleImageClear = useCallback(() => {
    setUploadedInput(null)
    setSavedId(null)
  }, [])

  const handleCameraClear = useCallback(() => {
    setCameraInput(null)
    setSavedId(null)
  }, [])

  const handleDiscardCandidate = useCallback(() => {
    if (inputMode === 'camera') {
      handleCameraClear()
      return
    }
    if (inputMode === 'upload') {
      handleImageClear()
    }
  }, [inputMode, handleCameraClear, handleImageClear])

  const toggleSetupCheck = useCallback((key: SetupChecklistKey) => {
    setSetupChecklist((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleHideSetupGuide = useCallback(() => {
    setSetupGuideHidden(true)
    setSetupGuideExpanded(false)
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(SETUP_GUIDE_HIDDEN_KEY, '1')
      } catch {
        // no-op
      }
    }
  }, [])

  const handleShowSetupGuide = useCallback(() => {
    setSetupGuideHidden(false)
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(SETUP_GUIDE_HIDDEN_KEY)
      } catch {
        // no-op
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NavBar navigate={navigate} current="/observe" />

      <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Eye size={20} className="text-green-400" />
            Live Observe
          </h1>
          <div className="text-slate-500 text-xs font-mono">
            {inputMode === 'sample' && `Event ${(eventIndex % 5) + 1}/5`}
            {inputMode === 'upload' && 'uploaded-image'}
            {inputMode === 'camera' && 'camera'}
          </div>
        </div>

        {!setupGuideHidden ? (
          <div className="mb-4 bg-slate-900/80 border border-slate-700 rounded-lg p-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Setup Guide</p>
              <button
                onClick={handleHideSetupGuide}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Skip for now
              </button>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed mb-3">
              Covering the lens reduces ordinary visible light. This can make transient bright sensor events easier to inspect.
            </p>
            <p className="text-xs text-slate-400 mb-3">
              This app records candidates and uncertainty; a single frame cannot confirm particle origin.
            </p>
            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2 text-slate-300">
                <input type="checkbox" checked={setupChecklist.coverLens} onChange={() => toggleSetupCheck('coverLens')} className="mt-0.5" />
                <span>Cover the lens to reduce ordinary visible light.</span>
              </label>
              <label className="flex items-start gap-2 text-slate-300">
                <input type="checkbox" checked={setupChecklist.reduceLeaks} onChange={() => toggleSetupCheck('reduceLeaks')} className="mt-0.5" />
                <span>Reduce light leaks around the camera and enclosure.</span>
              </label>
              <label className="flex items-start gap-2 text-slate-300">
                <input type="checkbox" checked={setupChecklist.keepStill} onChange={() => toggleSetupCheck('keepStill')} className="mt-0.5" />
                <span>Keep the device stable while capturing or observing.</span>
              </label>
              <label className="flex items-start gap-2 text-slate-300">
                <input type="checkbox" checked={setupChecklist.avoidHeat} onChange={() => toggleSetupCheck('avoidHeat')} className="mt-0.5" />
                <span>Avoid heat buildup when possible to reduce sensor noise.</span>
              </label>
              <label className="flex items-start gap-2 text-slate-300">
                <input type="checkbox" checked={setupChecklist.treatAsCandidates} onChange={() => toggleSetupCheck('treatAsCandidates')} className="mt-0.5" />
                <span>Treat outputs as candidates that need recheck, not confirmed detections.</span>
              </label>
              <p className="text-slate-400">
                Calibration status:{' '}
                <span className={calibrationApplied ? 'text-green-400' : 'text-amber-300'}>
                  {calibrationApplied ? 'Applied' : 'Not applied'}
                </span>
                . Calibration helps identify repeated sensor artifacts.
              </p>
              <p className="text-slate-400">
                Current analysis mode:{' '}
                <span className="font-mono text-slate-300">{currentMeasuredSource}</span>
                {' • '}
                <span className="font-mono text-slate-300">{provenancePreview.algorithmId}</span>
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                onClick={() => setSetupGuideExpanded((v) => !v)}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                {setupGuideExpanded ? 'Hide details' : 'Why this matters'}
              </button>
              <button
                onClick={handleHideSetupGuide}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
              >
                Continue to Capture/Observe
              </button>
            </div>
            {setupGuideExpanded && (
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                Dark setup reduces ordinary light and repeatable artifacts so candidate features are easier to inspect. Even with careful setup, event origin stays uncertain from a single frame.
              </p>
            )}
          </div>
        ) : (
          <div className="mb-4 flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-lg p-2.5">
            <p className="text-xs text-slate-500">Setup Guide hidden for returning observation sessions.</p>
            <button onClick={handleShowSetupGuide} className="text-xs text-slate-300 hover:text-white transition-colors">
              Show guide
            </button>
          </div>
        )}

        {/* Camera-first mode: show camera panel prominently */}
        {inputMode === 'camera' && (
          <div className="space-y-4 mb-4">
            <CameraCaptureInput onFrameCaptured={handleCameraReady} onClear={handleCameraClear} />
            {!cameraInput && (
              <p className="text-slate-500 text-xs sm:text-sm text-center">
                Open the camera and capture a frame to use it as Raw input
              </p>
            )}
            {cameraInput && (
              <div className="text-xs sm:text-sm text-amber-200 bg-amber-900/30 border border-amber-800/50 rounded-md p-3 text-center">
                ✓ Frame captured as <span className="font-mono font-medium">sourceType: camera</span>
                <br className="sm:hidden" />
                <span className="hidden sm:inline"> — </span>
                candidate ready for review (requires recheck before save)
              </div>
            )}
          </div>
        )}

        {/* Upload mode */}
        {inputMode === 'upload' && (
          <div className="mb-4 space-y-3">
            <ImageUploadInput onImageReady={handleImageReady} onClear={handleImageClear} />
            {!uploadedInput && (
              <p className="text-slate-500 text-xs sm:text-sm text-center">
                Select an image to use it as a Raw observation input
              </p>
            )}
            {uploadedInput && (
              <div className="text-xs sm:text-sm text-blue-200 bg-blue-900/30 border border-blue-800/50 rounded-md p-3 text-center">
                Uploaded candidate ready for review (measured bright pixels and track-like morphology require recheck)
              </div>
            )}
          </div>
        )}

        {/* Sample mode */}
        {inputMode === 'sample' && (
          <div className="mb-4">
            <p className="text-slate-500 text-xs sm:text-sm mb-3 text-center">
              Cycling through built-in sample particle detection events
            </p>
          </div>
        )}

        {/* Input mode selector - now in a more compact, mobile-friendly form */}
        <div className="mb-4">
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Input Source</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { setInputMode('camera'); setSavedId(null) }}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm px-3 py-2.5 sm:py-2 rounded-lg border transition-colors ${
                inputMode === 'camera'
                  ? 'bg-amber-800/60 border-amber-600 text-amber-100 shadow-lg shadow-amber-900/30'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              <Camera size={16} />
              <span className="font-medium">Camera</span>
            </button>
            <button
              onClick={() => { setInputMode('upload'); setSavedId(null) }}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm px-3 py-2.5 sm:py-2 rounded-lg border transition-colors ${
                inputMode === 'upload'
                  ? 'bg-blue-800/60 border-blue-600 text-blue-200'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              <Upload size={16} />
              <span className="font-medium">Upload</span>
            </button>
            <button
              onClick={() => { setInputMode('sample'); setSavedId(null) }}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm px-3 py-2.5 sm:py-2 rounded-lg border transition-colors ${
                inputMode === 'sample'
                  ? 'bg-green-800/60 border-green-600 text-green-200'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              <Eye size={16} />
              <span className="font-medium">Sample</span>
            </button>
          </div>
        </div>

        {/* Event ID + context */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 sm:p-3 mb-2 text-xs text-slate-400 font-mono">
          <span className="text-slate-500">id:</span> {event.eventId} &nbsp;|&nbsp;
          <span className="text-slate-500">src:</span>{' '}
          <span
            className={
              event.sourceType === 'uploaded-image'
                ? 'text-blue-400'
                : event.sourceType === 'camera'
                  ? 'text-amber-300'
                  : 'text-slate-400'
            }
          >
            {event.sourceType ?? 'sample'}
          </span>
          &nbsp;|&nbsp;
          <span className="text-slate-500">device:</span> {event.context.deviceId}
          {event.notes && <span className="block mt-1 text-slate-500 text-[11px]">{event.notes}</span>}
        </div>

        {/* Measured source badge — always show so the user never assumes placeholder = real pixels */}
        <div className="mb-4">
          <MeasuredSourceBadge source={event.measuredSource ?? deriveMeasuredSource(event.sourceType)} showDescription />
        </div>

        {/* Candidate review posture */}
        {inputMode !== 'sample' && (
          <div className={`mb-4 rounded-lg border p-3 text-xs ${showCandidateReview ? 'border-slate-700 bg-slate-900/70 text-slate-200' : 'border-slate-800 bg-slate-900/40 text-slate-500'}`}>
            <p className="font-semibold uppercase tracking-wide mb-1">Candidate Review</p>
            <p>
              Inspect measured bright pixels and track-like morphology before saving.
              {showCandidateReview
                ? ' This candidate requires recheck and should not be treated as confirmed evidence.'
                : ' Capture or upload input to start review.'}
            </p>
          </div>
        )}

        {/* Image + overlay + State vector */}
        <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
          <div className="w-full sm:w-auto">
            <OverlayCanvas
              key={event.eventId}
              rawImageUri={event.rawImageUri}
              hypotheses={overlays}
              thresholdSignal={event.thresholdSignal}
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
              {showOverlay ? 'Hide overlay layers' : 'Show overlay layers'}
            </button>
            {showOverlay && (
              <p className="mt-1 text-slate-600 text-xs text-center leading-tight">
                Raw stays visible underneath. Toggle measured, inferred, simulated, and rejected layers below.
              </p>
            )}
          </div>

          {/* State vector mini */}
          <div className="flex-1 w-full space-y-2">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <p className="text-slate-500 text-xs mb-2 uppercase tracking-wide">State Vector</p>
              {(
                [
                  ['Confidence', sv.confidence],
                  ['Track-like morphology likelihood', sv.particleLikelihood],
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
              <ConfidenceBadge value={sv.particleLikelihood} label="track-like" size="md" />
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

        {/* Provenance summary — Candidate Review: shows what will be recorded before saving */}
        <div className="mb-4">
          <AnalysisProvenanceCard provenance={provenancePreview} />
        </div>

        {/* Quality notes / warnings */}
        <div className="bg-slate-800 border border-amber-900/50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <p className="text-amber-200 text-xs uppercase tracking-wide font-semibold">Quality notes</p>
          </div>
          {qualityNotes.length > 0 ? (
            <ul className="space-y-1">
              {qualityNotes.map((note) => (
                <li key={note} className="text-amber-100/80 text-xs leading-relaxed">• {note}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-xs">No additional warnings recorded. Candidate still requires recheck before saving.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {inputMode === 'sample' && (
            <button
              onClick={handleNext}
              className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              <ChevronRight size={16} />
              Next Event
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={
              savedId !== null ||
              (inputMode === 'upload' && !uploadedInput) ||
              (inputMode === 'camera' && !cameraInput)
            }
            className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            <Save size={16} />
            {savedId ? 'Saved ✓' : 'Save as Observation Crystal'}
          </button>
          {inputMode !== 'sample' && (
            <button
              onClick={handleDiscardCandidate}
              disabled={!hasCandidateInput || savedId !== null}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-slate-200 px-4 py-3 rounded-lg text-sm font-medium transition-colors border border-slate-700"
            >
              {inputMode === 'camera' ? 'Retake' : 'Discard'}
            </button>
          )}
          {savedId && (
            <>
              <button
                onClick={() => navigate(`/event/${savedId}`)}
                className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                Open Details
              </button>
              <button
                onClick={() => navigate('/studio')}
                className="flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                Open Studio
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
