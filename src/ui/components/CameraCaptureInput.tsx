import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Camera, CameraOff, Image as ImageIcon, RefreshCcw } from 'lucide-react'

type CameraCaptureInputProps = {
  onFrameCaptured: (imageUri: string, width: number, height: number) => void
  onClear?: () => void
}

type StreamStatus = 'idle' | 'starting' | 'ready' | 'error'

export function CameraCaptureInput({ onFrameCaptured, onClear }: CameraCaptureInputProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [capturedUri, setCapturedUri] = useState<string | null>(null)

  const stopStream = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop())
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStream(null)
  }, [stream])

  useEffect(() => stopStream, [stopStream])
  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not available in this browser.')
      setStatus('error')
      return
    }

    setError(null)
    setStatus('starting')
    stopStream()

    const constraintsList: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: 'environment' } } },
      { video: true },
    ]

    let lastError: unknown
    for (const constraints of constraintsList) {
      try {
        const media = await navigator.mediaDevices.getUserMedia(constraints)
        if (videoRef.current) {
          videoRef.current.srcObject = media
          await videoRef.current.play()
        }
        setStream(media)
        setStatus('ready')
        return
      } catch (err) {
        lastError = err
      }
    }

    setStatus('error')
    setError(lastError instanceof Error ? lastError.message : 'Failed to start camera. Check permissions.')
  }, [stopStream])

  const handleCapture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera not ready yet. Wait a moment then try again.')
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/png')
    setCapturedUri(dataUrl)
    onFrameCaptured(dataUrl, canvas.width, canvas.height)
  }, [onFrameCaptured])

  const handleClearCapture = () => {
    setCapturedUri(null)
    onClear?.()
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-amber-300" />
          <p className="text-sm text-white font-semibold">Browser camera</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startCamera}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <RefreshCcw size={12} />
            Start / Retry
          </button>
          <button
            onClick={() => { stopStream(); setStatus('idle') }}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <CameraOff size={12} />
            Stop
          </button>
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
        <video
          ref={videoRef}
          className="w-full h-52 object-cover bg-slate-950"
          playsInline
          muted
        />
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-slate-300">
          <span className="bg-slate-900/70 px-2 py-1 rounded border border-slate-700">
            {status === 'ready' && 'Live camera ready — capture the current frame.'}
            {status === 'starting' && 'Starting camera...'}
            {status === 'error' && 'Camera unavailable. Retry or check permissions.'}
            {status === 'idle' && 'Camera idle. Press Start to open the stream.'}
          </span>
          <button
            onClick={handleCapture}
            disabled={status !== 'ready'}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              status === 'ready'
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <ImageIcon size={12} />
            Capture frame
          </button>
        </div>
      </div>

      {capturedUri && (
        <div className="bg-slate-950 border border-slate-800 rounded-md p-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">Captured frame preview</p>
            <button
              onClick={handleClearCapture}
              className="text-[11px] text-slate-400 hover:text-white underline"
            >
              Clear
            </button>
          </div>
          <img src={capturedUri} alt="Captured frame" className="w-full max-h-40 object-contain rounded" />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-xs text-amber-300 bg-amber-900/20 border border-amber-800/40 rounded-md p-2">
          <AlertTriangle size={14} className="shrink-0" />
          <div>
            <p className="font-semibold">Camera error</p>
            <p className="text-amber-200/80">{error}</p>
            <p className="text-amber-200/70 mt-1">
              Check browser permissions or another app using the camera, then retry.
            </p>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" aria-hidden />
    </div>
  )
}
