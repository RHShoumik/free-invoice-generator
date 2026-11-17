import { ImagePlus, RotateCcw, Trash2, X } from 'lucide-react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/Field'
import { useInvoiceStore } from '../../store/invoiceStore'
import type { PictureTarget } from '../../templates/shared/ItemTarget'
import { useLogoUpload } from './useLogoUpload'

interface ItemDrawerProps {
  target: PictureTarget
  onClose: () => void
}

/** A picture added on the page can be large; a logo's 480px is small for it (same as the style bar's image upload). */
const IMAGE_MAX_DIMENSION = 960

/**
 * What clicking a picture on the invoice opens, floating over the workspace's
 * left edge — the picture itself with Replace / Remove, or an Upload button
 * while there is none. Text is not edited here: a click on text edits it right
 * where it is on the page (`ItemText`). It reads and writes the store itself
 * (`BusinessDrawer`, its sibling, is presentational because it edits a logo
 * that lives in two different places; nothing here does). The caller keys it by
 * the target, so each new picture starts fresh.
 */
export function ItemDrawer({ target, onClose }: ItemDrawerProps) {
  switch (target.kind) {
    case 'image':
      return <ImageItem elementId={target.elementId} onClose={onClose} />
    case 'watermark':
      return <WatermarkItem onClose={onClose} />
  }
}

function Shell({ title, hint, onClose, children }: { title: string; hint?: string; onClose: () => void; children: ReactNode }) {
  return (
    <aside
      aria-label="Item"
      className="flex max-h-full min-h-0 w-72 flex-col rounded-2xl bg-white shadow-[0_8px_32px_rgb(21_23_26/0.14)] ring-1 ring-black/5"
    >
      <div className="flex items-start justify-between px-5 pb-1 pt-5">
        <div>
          <h2 className="text-base font-bold tracking-tight text-ink">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close item panel"
          className="-mr-1.5 -mt-1 flex size-8 items-center justify-center rounded-full text-slate-400 outline-none transition-colors hover:bg-black/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto px-5 pb-5 pt-3">{children}</div>
    </aside>
  )
}

/** The picture itself: a preview with Replace and Remove, or an Upload button while there is none. */
function ImagePanel({ image, onChange, onRemove }: { image: string | null; onChange: (dataUrl: string) => void; onRemove?: () => void }) {
  const upload = useLogoUpload(onChange, IMAGE_MAX_DIMENSION)
  return (
    <div>
      {image ? (
        <div className="space-y-3">
          <span className="flex items-center justify-center rounded-xl bg-paper p-2 ring-1 ring-black/5">
            <img src={image} alt="Image preview" className="max-h-44 max-w-full rounded-md object-contain" />
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="flex-1 rounded-xl" onClick={upload.pick} aria-label="Replace image">
              <ImagePlus /> Replace
            </Button>
            {onRemove && (
              <Button type="button" variant="outline" size="sm" className="flex-1 rounded-xl" onClick={onRemove} aria-label="Remove image">
                <Trash2 /> Remove
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" className="w-full rounded-xl" onClick={upload.pick} aria-label="Upload image">
          <ImagePlus /> Upload image
        </Button>
      )}
      {upload.error && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">
          {upload.error}
        </p>
      )}
      {upload.fileInput}
    </div>
  )
}

function ImageItem({ elementId, onClose }: { elementId: string; onClose: () => void }) {
  const element = useInvoiceStore((s) => s.invoice.freeformLayout.find((el) => el.id === elementId && el.kind === 'image'))
  const update = useInvoiceStore((s) => s.updateFreeformElementContent)
  // The image was deleted (or undone away) while its drawer was open: nothing left to edit.
  const gone = !element
  useEffect(() => {
    if (gone) onClose()
  }, [gone, onClose])
  if (!element || element.kind !== 'image') return null
  return (
    <Shell title="Image" hint="Drag the handle on its right edge to resize it." onClose={onClose}>
      <ImagePanel
        image={element.dataUrl}
        onChange={(dataUrl) => update(elementId, { dataUrl })}
        onRemove={element.dataUrl ? () => update(elementId, { dataUrl: null }) : undefined}
      />
    </Shell>
  )
}

function WatermarkItem({ onClose }: { onClose: () => void }) {
  const text = useInvoiceStore((s) => s.invoice.watermarkText)
  const image = useInvoiceStore((s) => s.invoice.watermarkImage ?? null)
  const updateField = useInvoiceStore((s) => s.updateField)
  const resetWatermark = useInvoiceStore((s) => s.resetWatermark)
  const overridden = text !== undefined || image !== null
  return (
    <Shell title="Watermark" hint="A picture replaces the text. Click the text on the page to change it." onClose={onClose}>
      <Field label="Picture">
        <ImagePanel
          image={image}
          onChange={(dataUrl) => updateField('watermarkImage', dataUrl)}
          onRemove={image ? () => updateField('watermarkImage', undefined) : undefined}
        />
      </Field>
      {overridden && (
        <Button type="button" variant="ghost" size="sm" onClick={resetWatermark} aria-label="Reset watermark">
          <RotateCcw /> Reset
        </Button>
      )}
    </Shell>
  )
}
