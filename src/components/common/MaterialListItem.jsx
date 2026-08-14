import { FileText, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

function formatSize(bytes) {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

export function MaterialListItem({ material, onDownload, onRemove, removing }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onDownload(material)}
          className="truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
        >
          {material.fileName}
        </button>
        <p className="text-xs text-muted-foreground">{formatSize(material.size)}</p>
      </div>
      {onRemove ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(material)}
          disabled={removing}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      ) : null}
    </div>
  )
}
