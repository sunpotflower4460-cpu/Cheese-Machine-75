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
import { buildObservationCrystal } from '../../core/buildObservationCrystal'
import { buildOverlayHypothesis } from '../../core/simulation/buildOverlayHypothesis'
import { detectNextEvent, buildInputFromUploadedImage, buildInputFromCameraFrame } from '../../core/observation/detectObservationEvent'
import { extractEventFeatures } from '../../core/observation/extractEventFeatures'
import { ChevronRight, Save, Layers, Eye, Upload, Camera } from 'lucide-react'
import { MeasuredSourceBadge } from '../components/MeasuredSourceBadge'
import { deriveMeasuredSource } from '../../core/observation/measuredSource'

type LiveObservePageProps = {
  crystals: ObservationCrystal[]
  onSave: (crystal: ObservationCrystal) => void
  navigate: (to: Route) => void
}

type InputMode = 'sample' | 'upload' | 'camera'

export function LiveObservePage({ crystals, onSave, navigate }: LiveObservePageProps) {
  const [inputMode, setInputMode] = useState<InputMode>('camera')
  const [eventIndex, setEventIndex] = useState(0)
  const [uploadedInput, setUploadedInput] = useState<ObservationInput | null>(null)
  const [cameraInput, setCameraInput] = useState<ObservationInput | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  // Resolve active event based on mode
  const { event: sampleEvent } = detectNextEvent(eventIndex)
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
  const activeCameraEvent = cameraInput ?? cameraPlaceholder
  const event: ObservationInput =
    inputMode === 'upload' && uploadedInput
      ? uploadedInput
      : inputMode === 'camera'
        ? activeCameraEvent ?? sampleEvent
        : sampleEvent

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

  const handleImageReady = useCallback(
    (imageUri: string, width: number, height: number, fileName: string) => {
      setSavedId(null)
      setUploadedInput(buildInputFromUploadedImage(imageUri, width, height, `Uploaded: ${fileName}`))
    },
    [],
  )

  const handleCameraReady = useCallback((imageUri: string, width: number, height: number) => {
    setSavedId(null)
    setCameraInput(buildInputFromCameraFrame(imageUri, width, height))
  }, [])

  const handleImageClear = useCallback(() => {
    setUploadedInput(null)
    setSavedId(null)
  }, [])

  const handleCameraClear = useCallback(() => {
    setCameraInput(null)
    setSavedId(null)
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
                Save to archive as observation crystal
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

        {/* Image + overlay + State vector */}
        <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
          <div className="w-full sm:w-auto">
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
            {showOverlay && (
              <p className="mt-1 text-slate-600 text-xs text-center leading-tight">
                Solid: measured | Dashed: predicted | Dotted: simulated
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
            {savedId ? 'Saved ✓' : 'Save Crystal'}
          </button>
        </div>
      </div>
    </div>
  )
}
