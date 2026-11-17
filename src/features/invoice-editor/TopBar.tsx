import { ReceiptText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DownloadMenu } from './DownloadMenu'
import type { ExportFormat } from './DownloadMenu'
import { UndoRedo } from './toolbar/UndoRedo'

interface TopBarProps {
  designName: string
  exporting: ExportFormat | null
  error: string | null
  onExport: (format: ExportFormat) => void
}

/**
 * The editor's top bar: a slim, light strip with the way home, the design's
 * name and save state, undo/redo, and Download — the document-level controls,
 * kept off the working area. Everything else is on the floating dock and the
 * floating panels over the canvas.
 */
export function TopBar({ designName, exporting, error, onExport }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-4 border-b border-black/5 bg-white/85 px-4 backdrop-blur">
      <button
        type="button"
        onClick={() => navigate('/')}
        aria-label="Back to all designs"
        className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-3 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex size-8 items-center justify-center rounded-[10px] bg-ink text-white">
          <ReceiptText className="size-4" />
        </span>
        <span className="hidden text-sm font-bold tracking-tight text-ink sm:block">Invoice Generator</span>
      </button>

      <div className="hidden h-5 w-px bg-black/10 sm:block" />

      <div className="hidden min-w-0 leading-tight sm:block">
        <p className="truncate text-sm font-semibold text-ink">{designName}</p>
        <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="size-1.5 rounded-full bg-brand" /> Saved in this browser
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {error && (
          <p role="alert" className="max-w-xs truncate rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
            {error}
          </p>
        )}
        <UndoRedo />
        <DownloadMenu exporting={exporting} onExport={onExport} />
      </div>
    </header>
  )
}
