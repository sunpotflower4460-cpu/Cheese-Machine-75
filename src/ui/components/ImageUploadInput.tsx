// Image upload UI for Cheese Machine 75
// Allows users to select a local image file (jpg/png/webp) as a Raw input source.

import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

type ImageUploadInputProps = {
  onImageReady: (imageUri: string, width: number, height: number, fileName: string) => void
  onClear?: () => void
}

const ACCEPTED = 'image/jpeg,image/png,image/webp'

export function ImageUploadInput({ onImageReady, onClear }: ImageUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result
      if (typeof dataUrl !== 'string') return

      // Get image dimensions via a temporary Image element
      const img = new Image()
      img.onload = () => {
        setPreview(dataUrl)
        setFileName(file.name)
        onImageReady(dataUrl, img.naturalWidth, img.naturalHeight, file.name)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  const handleClear = () => {
    setPreview(null)
    setFileName(null)
    if (inputRef.current) inputRef.current.value = ''
    onClear?.()
  }

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative border border-slate-600 rounded-lg overflow-hidden bg-slate-900">
          <img
            src={preview}
            alt="Uploaded"
            className="w-full object-contain max-h-48"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={handleClear}
              className="flex items-center gap-1 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs px-2 py-1 rounded transition-colors"
              title="Clear image"
            >
              <X size={11} />
              Clear
            </button>
          </div>
          {fileName && (
            <p className="text-slate-500 text-xs px-2 py-1 truncate">{fileName}</p>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-600 hover:border-slate-400 rounded-lg p-5 text-center transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
        >
          <Upload size={20} className="text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-sm font-medium">Load image</p>
          <p className="text-slate-600 text-xs mt-0.5">jpg / png / webp — or drag &amp; drop</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
