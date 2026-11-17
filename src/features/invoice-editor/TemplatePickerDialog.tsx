import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TemplatePickerGrid } from '../template-gallery/TemplatePickerGrid'

interface TemplatePickerDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (templateId: string) => void
  /** The design the invoice is on now; its card is marked. */
  currentId?: string
}

/**
 * The *Designs* tool: a large centered modal showing every design as a live,
 * full-size preview card, so each one is easy to judge before you pick it
 * (the old narrow slide-in panel squeezed the grid into thumbnails too small
 * to read). Picking one starts a fresh invoice with that design's sample
 * data — same as the full-page Gallery; see docs/ARCHITECTURE.md for why
 * that's intentional and not a preserve-data quick-switch like the Style
 * panel's "Design" dropdown.
 */
export function TemplatePickerDialog({ open, onClose, onSelect, currentId }: TemplatePickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="h-[min(90vh,60rem)] max-w-[min(72rem,calc(100%-2rem))] gap-0 overflow-hidden p-0">
        <DialogHeader className="px-7 pb-4 pt-6">
          <DialogTitle className="text-xl font-bold tracking-tight text-ink">Browse designs</DialogTitle>
          <DialogDescription>Picking one starts a new invoice with its sample data.</DialogDescription>
        </DialogHeader>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-7 pb-7">
          <TemplatePickerGrid onSelect={onSelect} layout="modal" currentId={currentId} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
