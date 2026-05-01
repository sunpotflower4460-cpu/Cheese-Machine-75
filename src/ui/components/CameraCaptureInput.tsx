import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Camera, CameraOff, Image as ImageIcon, RefreshCcw } from 'lucide-react'

type CameraCaptureInputProps = {
  onFrameCaptured: (imageUri: string, width: number, height: number) => void
  onClear?: () => void
}

type StreamStatus =
  | 'idle'
  | 'requesting'
  | 'stream-attached'
  | 'waiting-metadata'
  | 'ready'
  | 'denied'
  | 'unsupported'
  | 'busy'
  | 'error'

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function formatCameraError(err: unknown): { status: StreamStatus; message: string } {
  const name = err instanceof DOMException ? err.name : err instanceof Error ? err.name : ''
  const message = err instanceof Error ? err.message : String(err)
  const text = `${name} ${message}`.toLowerCase()

  if (text.includes('notallowed') || text.includes('permission') || text.includes('security')) {
    return {
      status: 'denied',
      message: 'Camera permission denied. Check browser settings and allow camera access.',
    }
  }

  if (text.includes('notreadable') || text.includes('trackstarterror') || text.includes('device in use')) {
    return {
      status: 'busy',
      message: 'Camera is busy or already in use by another app. Close other camera apps and retry.',
    }
  }

  if (text.includes('notfound') || text.includes('devicesnotfound')) {
    return {
      status: 'error',
      message: 'No camera was found for this browser session. Try another browser or device.',
    }
  }

  if (text.includes('overconstrained') || text.includes('constraint')) {
    return {
      status: 'error',
      message: 'The requested camera mode was not available. Retry with the fallback camera mode.',
    }
  }

  return {
    status: 'error',
    message: `Failed to start camera. ${message}`,
  }
}

export function CameraCaptureInput({ onFrameCaptured, onClear }: CameraCaptureInputProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const probeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const startTokenRef = useRef(0)
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [capturedUri, setCapturedUri] = useState<string | null>(null)

  const stopCurrentStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    const video = videoRef.current
    if (video) {
      video.pause()
      video.srcObject = null
      video.removeAttribute('src')
      video.load()
    }
  }, [])

  const stopStream = useCallback(() => {
    startTokenRef.current += 1
    stopCurrentStream()
    setStatus('idle')
    setError(null)
  }, [stopCurrentStream])

  useEffect(() => {
    return () => {
      startTokenRef.current += 1
      stopCurrentStream()
    }
  }, [stopCurrentStream])

  const waitForMetadata = useCallback(async (video: HTMLVideoElement, token: number) => {
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.videoWidth > 0 && video.videoHeight > 0) {
      return
    }

    await new Promise<void>((resolve, reject) => {
      let timeoutId: number | undefined

      const cleanup = () => {
        if (timeoutId) window.clearTimeout(timeoutId)
        video.removeEventListener('loadedmetadata', onReady)
        video.removeEventListener('canplay', onReady)
        video.removeEventListener('error', onError)
      }

      const onReady = () => {
        if (startTokenRef.current !== token) return
        cleanup()
        resolve()
      }

      const onError = () => {
        cleanup()
        reject(new Error('Failed to load video metadata.'))
      }

      timeoutId = window.setTimeout(() => {
        cleanup()
        reject(new Error('Timed out while waiting for camera metadata.'))
      }, 6000)

      video.addEventListener('loadedmetadata', onReady, { once: true })
      video.addEventListener('canplay', onReady, { once: true })
      video.addEventListener('error', onError, { once: true })
    })
  }, [])

  const canDrawVideoFrame = useCallback((video: HTMLVideoElement) => {
    try {
      const probe = probeCanvasRef.current ?? document.createElement('canvas')
      probeCanvasRef.current = probe
      probe.width = 2
      probe.height = 2
      const ctx = probe.getContext('2d', { willReadFrequently: true })
      if (!ctx) return false
      ctx.drawImage(video, 0, 0, 2, 2)
      ctx.getImageData(0, 0, 1, 1)
      return true
    } catch {
      return false
    }
  }, [])

  const waitForDrawableFrame = useCallback(
    async (video: HTMLVideoElement, token: number) => {
      const deadline = Date.now() + 7000

      while (Date.now() < deadline) {
        if (startTokenRef.current !== token) {
          throw new Error('Camera start was cancelled.')
        }

        const activeTrack = streamRef.current?.getVideoTracks()[0]
        if (!activeTrack || activeTrack.readyState === 'ended') {
          throw new Error('Camera stream ended before a frame was available.')
        }

        if (
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          canDrawVideoFrame(video)
        ) {
          return
        }

        await sleep(120)
      }

      throw new Error('Timed out while waiting for a drawable camera frame.')
    },
    [canDrawVideoFrame],
  )

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not supported in this browser. Try Safari or Chrome directly.')
      setStatus('unsupported')
      return
    }

    const token = startTokenRef.current + 1
    startTokenRef.current = token

    stopCurrentStream()
    setCapturedUri(null)
    onClear?.()
    setError(null)
    setStatus('requesting')

    const constraintsList: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: { facingMode: 'environment' }, audio: false },
      { video: true, audio: false },
    ]

    let lastError: unknown

    for (const constraints of constraintsList) {
      let media: MediaStream | null = null

      try {
        if (startTokenRef.current !== token) return
        setStatus('requesting')

        media = await navigator.mediaDevices.getUserMedia(constraints)

        if (startTokenRef.current !== token) {
          media.getTracks().forEach((track) => track.stop())
          return
        }

        const video = videoRef.current
        if (!video) {
          media.getTracks().forEach((track) => track.stop())
          return
        }

        video.muted = true
        video.autoplay = true
        video.playsInline = true
        video.setAttribute('playsinline', 'true')
        video.setAttribute('webkit-playsinline', 'true')

        streamRef.current = media
        setStatus('stream-attached')
        video.srcObject = media

        setStatus('waiting-metadata')
        await waitForMetadata(video, token)
        await video.play()
        await waitForDrawableFrame(video, token)

        if (startTokenRef.current !== token) {
          media.getTracks().forEach((track) => track.stop())
          return
        }

        setError(null)
        setStatus('ready')
        return
      } catch (err) {
        lastError = err
        media?.getTracks().forEach((track) => track.stop())
        if (streamRef.current === media) streamRef.current = null
        if (videoRef.current) {
          videoRef.current.pause()
          videoRef.current.srcObject = null
        }
      }
    }

    const formatted = formatCameraError(lastError)
    setError(formatted.message)
    setStatus(formatted.status)
  }, [onClear, stopCurrentStream, waitForDrawableFrame, waitForMetadata])

  const handleCapture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    setError(null)

    if (status !== 'ready') {
      setError('Camera is not ready yet. Wait until the live preview appears, then capture again.')
      setStatus('error')
      return
    }

    if (video.videoWidth === 0 || video.videoHeight === 0 || !canDrawVideoFrame(video)) {
      setError('Camera preview is not drawable yet. Wait a moment, then try Capture again.')
      setStatus('error')
      return
    }

    const tracks = streamRef.current?.getVideoTracks()
    if (!tracks || tracks.length === 0) {
      setError('No video stream available. Please restart the camera.')
      setStatus('error')
      return
    }

    const track = tracks[0]
    if (track.readyState === 'ended') {
      setError('Camera stream ended. Please restart the camera.')
      setStatus('error')
      return
    }

    if (track.muted) {
      setError('Camera stream is muted. Check permissions and restart.')
      setStatus('error')
      return
    }

    try {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setError('Canvas context unavailable.')
        setStatus('error')
        return
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/png')
      setCapturedUri(dataUrl)
      setError(null)
      setStatus('ready')

      onFrameCaptured(dataUrl, canvas.width, canvas.height)
    } catch (err) {
      setError(`Failed to capture frame: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setStatus('error')
    }
  }, [canDrawVideoFrame, onFrameCaptured, status])

  const handleClearCapture = () => {
    setCapturedUri(null)
    setError(null)
    onClear?.()
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'idle':
        return 'Tap Start to open the camera.'
      case 'requesting':
        return 'Requesting camera access...'
      case 'stream-attached':
        return 'Camera stream connected. Preparing preview...'
      case 'waiting-metadata':
        return 'Waiting for a drawable camera frame...'
      case 'ready':
        return 'Live preview ready — capture the current frame.'
      case 'denied':
      case 'busy':
      case 'unsupported':
      case 'error':
        return 'Camera unavailable. See the note below.'
      default:
        return 'Starting camera...'
    }
  }

  const isReady = status === 'ready' && !error
  const hasError = status === 'denied' || status === 'busy' || status === 'unsupported' || status === 'error'
  const isLoading = status === 'requesting' || status === 'stream-attached' || status === 'waiting-metadata'

  return (
    <section className="rounded-2xl border border-amber-500/25 bg-slate-900/95 p-3 shadow-xl shadow-black/20 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-amber-500/15 p-2">
            <Camera size={18} className="text-amber-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Camera observation</p>
            <p className="text-xs text-slate-400">Single-frame Raw input</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={startCamera}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-100 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw size={12} />
            {isLoading ? 'Starting...' : 'Start'}
          </button>
          <button
            onClick={stopStream}
            className="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-100 transition-colors hover:bg-slate-700"
          >
            <CameraOff size={12} />
            Stop
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
        <video
          ref={videoRef}
          className="h-[54vh] min-h-[320px] max-h-[560px] w-full bg-slate-950 object-cover sm:h-80"
          autoPlay
          playsInline
          muted
        />

        {!isReady && !hasError && (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/80 px-6 text-center">
            <div>
              <p className="text-sm font-medium text-slate-200">{getStatusMessage()}</p>
              <p className="mt-2 text-xs text-slate-500">The app will only mark the camera ready after a drawable frame is available.</p>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className={`text-xs sm:text-sm ${isReady ? 'text-green-300' : hasError ? 'text-amber-300' : 'text-slate-300'}`}>
              {getStatusMessage()}
            </span>
            <button
              onClick={handleCapture}
              disabled={!isReady}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all ${
                isReady
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 hover:bg-amber-300'
                  : 'cursor-not-allowed bg-slate-800 text-slate-500'
              }`}
            >
              <ImageIcon size={16} />
              Capture frame
            </button>
          </div>
        </div>
      </div>

      {capturedUri && (
        <div className="mt-3 rounded-xl border border-green-700/40 bg-green-950/20 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-green-300">Frame captured — ready to save as observation</p>
            <button onClick={handleClearCapture} className="text-xs text-slate-400 underline hover:text-white">
              Clear
            </button>
          </div>
          <img src={capturedUri} alt="Captured camera frame" className="max-h-52 w-full rounded-lg border border-slate-700 object-contain" />
        </div>
      )}

      {hasError && error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-700/50 bg-amber-950/20 p-3 text-xs text-amber-200 sm:text-sm">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-300" />
          <div className="flex-1">
            <p className="font-semibold text-amber-300">Camera needs attention</p>
            <p className="mt-1 text-amber-100/85">{error}</p>
            <p className="mt-2 text-xs text-amber-100/65">
              Check camera permission, close other camera apps, then retry. If this is an in-app browser, open the URL in Safari or Chrome directly.
            </p>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" aria-hidden />
    </section>
  )
}
