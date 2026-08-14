import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import toast from 'react-hot-toast'

import { Progress } from '@/components/ui/progress'
import { ACCEPTED_MATERIAL_TYPES, MAX_MATERIAL_FILE_SIZE_MB } from '@/constants/storage'
import { cn } from '@/lib/utils'

/**
 * Drag-and-drop (or click-to-browse) uploader. `onUpload(file, onProgress)`
 * does the actual upload — this component only handles selection,
 * validation, and per-file progress display.
 */
export function FileUploader({ onUpload, disabled }) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploads, setUploads] = useState([]) // [{ name, progress, error }]

  const validate = (file) => {
    if (!ACCEPTED_MATERIAL_TYPES[file.type]) {
      return `${file.name}: unsupported file type`
    }
    if (file.size > MAX_MATERIAL_FILE_SIZE_MB * 1024 * 1024) {
      return `${file.name}: exceeds ${MAX_MATERIAL_FILE_SIZE_MB}MB limit`
    }
    return null
  }

  const handleFiles = async (fileList) => {
    for (const file of Array.from(fileList)) {
      const error = validate(file)
      if (error) {
        toast.error(error)
        continue
      }

      setUploads((prev) => [...prev, { name: file.name, progress: 0 }])
      try {
        await onUpload(file, (progress) => {
          setUploads((prev) =>
            prev.map((u) => (u.name === file.name ? { ...u, progress } : u))
          )
        })
        setUploads((prev) => prev.filter((u) => u.name !== file.name))
      } catch {
        toast.error(`Failed to upload ${file.name}`)
        setUploads((prev) => prev.filter((u) => u.name !== file.name))
      }
    }
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          if (!disabled) handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary/40 hover:bg-primary/5',
          dragActive && 'border-primary/40 bg-primary/5'
        )}
      >
        <UploadCloud className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Drag & drop files, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, DOC, PPT, ZIP, JPG, PNG — up to {MAX_MATERIAL_FILE_SIZE_MB}MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {uploads.map((upload) => (
        <div key={upload.name} className="space-y-1">
          <p className="truncate text-xs text-muted-foreground">{upload.name}</p>
          <Progress value={upload.progress} className="h-1.5" />
        </div>
      ))}
    </div>
  )
}
