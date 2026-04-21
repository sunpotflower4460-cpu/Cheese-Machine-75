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

export function CameraCaptureInput({ onFrameCaptured, onClear }: CameraCaptureInputProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [capturedUri, setCapturedUri] = useState<string | null>(null)

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStream(null)
    setError(null) // Clear errors on stop
  }, [stream])

  useEffect(() => {
    return () => {
      // Cleanup on unmount: stop any active stream
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [stream])

  const waitForVideoReady = useCallback((video: HTMLVideoElement): Promise<void> => {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (
          video.readyState >= 2 && // HAVE_CURRENT_DATA or higher
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          resolve()
        } else {
          requestAnimationFrame(checkReady)
        }
      }
      checkReady()
    })
  }, [])

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not supported. Try Safari or Chrome on mobile.')
      setStatus('unsupported')
      return
    }

    // Stop any existing stream first
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    // Clear stale errors when starting/retrying
    setError(null)
    setStatus('requesting')

    const constraintsList: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: 'environment' } } },
      { video: true },
    ]

    let lastError: unknown
    for (const constraints of constraintsList) {
      try {
        setStatus('requesting')
        const media = await navigator.mediaDevices.getUserMedia(constraints)

        if (!videoRef.current) {
          media.getTracks().forEach(t => t.stop())
          return
        }

        setStatus('stream-attached')
        setStream(media)
        videoRef.current.srcObject = media

        // Wait for metadata to load
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current
          if (!video) {
            reject(new Error('Video element lost'))
            return
          }

          const onMetadata = () => {
            video.removeEventListener('loadedmetadata', onMetadata)
            video.removeEventListener('error', onError)
            resolve()
          }

          const onError = () => {
            video.removeEventListener('loadedmetadata', onMetadata)
            video.removeEventListener('error', onError)
            reject(new Error('Failed to load video metadata'))
          }

          video.addEventListener('loadedmetadata', onMetadata)
          video.addEventListener('error', onError)
        })

        setStatus('waiting-metadata')

        // Play the video
        await videoRef.current.play()

        // Wait for video to actually be ready with dimensions
        await waitForVideoReady(videoRef.current)

        // Clear any stale errors and set to ready
        setError(null)
        setStatus('ready')
        return
      } catch (err) {
        lastError = err
      }
    }

    // Handle errors with specific messages
    const errorMsg = lastError instanceof Error ? lastError.message : String(lastError)

    if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
      setError('Camera permission denied. Check browser settings and allow camera access.')
      setStatus('denied')
    } else if (errorMsg.includes('NotReadableError') || errorMsg.includes('TrackStartError')) {
      setError('Camera is busy or in use by another app. Close other apps using the camera.')
      setStatus('busy')
    } else {
      setError(`Failed to start camera. ${errorMsg}`)
      setStatus('error')
    }
  }, [stream, waitForVideoReady])

  const handleCapture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    // Check stream status
    if (status !== 'ready') {
      setError('Camera not ready yet. Please wait for the camera to fully initialize.')
      return
    }

    // Check video dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera not ready yet. Video has no dimensions. Please wait and try again.')
      return
    }

    // Check stream tracks
    const tracks = stream?.getVideoTracks()
    if (!tracks || tracks.length === 0) {
      setError('No video stream available. Please restart the camera.')
      return
    }

    const track = tracks[0]
    if (track.readyState === 'ended') {
      setError('Camera stream ended. Please restart the camera.')
      return
    }

    if (track.muted) {
      setError('Camera stream is muted. Check permissions and restart.')
      return
    }

    try {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setError('Canvas context unavailable.')
        return
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/png')
      setCapturedUri(dataUrl)

      // Clear any stale errors on successful capture
      setError(null)

      onFrameCaptured(dataUrl, canvas.width, canvas.height)
    } catch (err) {
      setError(`Failed to capture frame: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [onFrameCaptured, status, stream])

  const handleClearCapture = () => {
    setCapturedUri(null)
    onClear?.()
  }

  // Helper to get user-friendly status message
  const getStatusMessage = () => {
    switch (status) {
      case 'idle':
        return 'Camera idle. Press Start to open the stream.'
      case 'requesting':
        return 'Requesting camera access...'
      case 'stream-attached':
        return 'Camera stream connected...'
      case 'waiting-metadata':
        return 'Loading camera feed...'
      case 'ready':
        return 'Live camera ready — capture the current frame.'
      case 'denied':
      case 'busy':
      case 'unsupported':
      case 'error':
        return '' // Error displayed separately
      default:
        return 'Starting camera...'
    }
  }

  const isReady = status === 'ready'
  const hasError = status === 'denied' || status === 'busy' || status === 'unsupported' || status === 'error'
  const isLoading = status === 'requesting' || status === 'stream-attached' || status === 'waiting-metadata'

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-amber-300" />
          <p className="text-sm text-white font-semibold">Browser camera</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startCamera}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCcw size={12} />
            {isLoading ? 'Starting...' : 'Start / Retry'}
          </button>
          <button
            onClick={() => { stopStream(); setStatus('idle') }}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <CameraOff size={12} />
            Stop
          </button>
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
        <video
          ref={videoRef}
          className="w-full h-64 sm:h-72 object-cover bg-slate-950"
          playsInline
          muted
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 to-transparent p-3">
          <div className="flex items-center justify-between gap-2">
            {!hasError && (
              <span className="text-xs sm:text-sm text-slate-200 flex-1">
                {getStatusMessage()}
              </span>
            )}
            {hasError && (
              <span className="text-xs sm:text-sm text-amber-300 flex-1">
                Camera unavailable. See error below.
              </span>
            )}
            <button
              onClick={handleCapture}
              disabled={!isReady}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isReady
                  ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/30'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <ImageIcon size={14} />
              Capture frame
            </button>
          </div>
        </div>
      </div>

      {capturedUri && (
        <div className="bg-slate-950 border border-slate-800 rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-green-400 font-medium">✓ Frame captured — ready to save as observation</p>
            <button
              onClick={handleClearCapture}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Clear
            </button>
          </div>
          <img src={capturedUri} alt="Captured frame" className="w-full max-h-48 object-contain rounded border border-slate-700" />
        </div>
      )}

      {hasError && error && (
        <div className="flex items-start gap-2 text-xs sm:text-sm text-amber-300 bg-amber-900/20 border border-amber-800/40 rounded-md p-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Camera error</p>
            <p className="text-amber-200/80 mt-1">{error}</p>
            <p className="text-amber-200/70 mt-2 text-xs">
              • Check camera permissions in browser settings<br />
              • Close other apps using the camera<br />
              • Try opening in Safari or Chrome (mobile)
            </p>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" aria-hidden />
    </div>
  )
}
