import { Redo2, Undo2 } from 'lucide-react'
import { useInvoiceStore } from '../../../store/invoiceStore'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
const MOD = isMac ? '⌘' : 'Ctrl+'

const buttonClass =
  'flex size-9 items-center justify-center rounded-full text-slate-600 outline-none transition-colors hover:bg-black/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:text-slate-300'

/** Undo / redo for every edit to the invoice, on the top bar. Dimmed when there's nothing to step to. */
export function UndoRedo() {
  const canUndo = useInvoiceStore((s) => s.past.length > 0)
  const canRedo = useInvoiceStore((s) => s.future.length > 0)
  const undo = useInvoiceStore((s) => s.undo)
  const redo = useInvoiceStore((s) => s.redo)

  return (
    <div className="flex items-center">
      <button type="button" onClick={undo} disabled={!canUndo} aria-label="Undo" title={`Undo (${MOD}Z)`} className={buttonClass}>
        <Undo2 className="size-[18px]" />
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Redo"
        title={`Redo (${MOD}${isMac ? '⇧Z' : 'Y'})`}
        className={buttonClass}
      >
        <Redo2 className="size-[18px]" />
      </button>
    </div>
  )
}
