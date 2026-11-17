import { ImagePlus, ImageUp, Stamp, Trash2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { resizeImageFile } from '../../lib/image'
import { useInvoiceStore } from '../../store/invoiceStore'
import { useUploadsStore } from '../../store/uploadsStore'
import type { UploadedImage } from '../../store/uploadsStore'
import { useFreeformBlock } from '../../templates/shared/FreeformBlockContext'
import { UPLOAD_DRAG_TYPE } from './elementDrag'

/** Library images are kept smaller than a page image: there can be two dozen of them in localStorage. */
const UPLOAD_MAX_DIMENSION = 800

interface UploadsDrawerProps {
  onClose: () => void
}

/**
 * The Uploads card: every image you've brought in (logos, stamps, photos),
 * kept in this browser so it's there for the next invoice too. Drag one onto
 * the page to drop it exactly where you let go, or click it to drop it at a
 * default spot — either way it becomes an ordinary Image element you can
 * move, resize and fade. "Use as logo" sets the invoice's logo instead.
 * Sits where the Elements card does (`EditorLayout` shows one or the other).
 * Renders nothing outside the live editor.
 */
export function UploadsDrawer({ onClose }: UploadsDrawerProps) {
  const block = useFreeformBlock()
  const items = useUploadsStore((s) => s.items)
  const addUpload = useUploadsStore((s) => s.add)
  const removeUpload = useUploadsStore((s) => s.remove)
  const setLogo = useInvoiceStore((s) => s.setLogo)
  const logoDataUrl = useInvoiceStore((s) => s.invoice.logoDataUrl)
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (!block) return null

  async function handleFiles(files: FileList | null) {
    const picked = Array.from(files ?? [])
    if (picked.length === 0) return
    setError(null)
    setBusy(true)
    const skipped: string[] = []
    for (const file of picked) {
      if (!file.type.startsWith('image/')) {
        skipped.push(file.name)
        continue
      }
      try {
        addUpload({ name: file.name, dataUrl: await resizeImageFile(file, UPLOAD_MAX_DIMENSION) })
      } catch (err) {
        // The most useful message is the storage-full one `add` throws; anything else is "couldn't read it".
        setError(err instanceof Error && err.message.includes('storage') ? err.message : `Could not use ${file.name}.`)
        setBusy(false)
        return
      }
    }
    if (skipped.length > 0) setError(`${skipped.length === 1 ? skipped[0] : `${skipped.length} files`} ${skipped.length === 1 ? 'is' : 'are'} not an image.`)
    setBusy(false)
  }

  function handleDragStart(e: DragEvent<HTMLButtonElement>, image: UploadedImage) {
    e.dataTransfer.setData(UPLOAD_DRAG_TYPE, image.id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside className="flex max-h-full min-h-0 w-72 flex-col rounded-2xl bg-white shadow-[0_8px_32px_rgb(21_23_26/0.14)] ring-1 ring-black/5">
      <div className="flex items-start justify-between px-5 pb-1 pt-5">
        <div>
          <h2 className="text-base font-bold tracking-tight text-ink">Uploads</h2>
          <p className="mt-0.5 text-xs text-slate-500">Drag onto the page, or click to add</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close uploads panel"
          className="-mr-1.5 -mt-1 flex size-8 items-center justify-center rounded-full text-slate-400 outline-none transition-colors hover:bg-black/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-5 pb-5 pt-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white outline-none transition-colors hover:bg-ink/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <ImagePlus className="size-4" /> {busy ? 'Adding…' : 'Upload images'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        {error && (
          <p role="alert" className="mt-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}

        {items.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-paper px-4 py-8 text-center">
            <ImageUp className="size-7 text-slate-400" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-ink">No uploads yet</p>
            <p className="text-xs leading-relaxed text-slate-500">Logos, stamps and photos you add show up here, ready to reuse on any invoice.</p>
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-2.5">
            {items.map((image) => (
              <li key={image.id} className="group relative">
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => handleDragStart(e, image)}
                  onClick={() => block.onAddElement('image', undefined, { dataUrl: image.dataUrl })}
                  aria-label={`Add ${image.name} to the page`}
                  title={image.name}
                  className="block aspect-square w-full cursor-grab overflow-hidden rounded-xl bg-paper p-1.5 outline-none ring-1 ring-black/5 transition-shadow hover:ring-2 hover:ring-brand focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                >
                  <img src={image.dataUrl} alt="" draggable={false} className="size-full object-contain" />
                </button>

                {/* Always reachable by keyboard; only visible while hovering or focused so the grid stays clean. */}
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setLogo(image.dataUrl)}
                    aria-label={`Use ${image.name} as the logo`}
                    aria-pressed={logoDataUrl === image.dataUrl}
                    title="Use as logo"
                    className="flex size-7 items-center justify-center rounded-lg bg-white/95 text-ink shadow-sm outline-none ring-1 ring-black/10 transition-colors hover:bg-ink hover:text-white focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-brand aria-pressed:text-white"
                  >
                    <Stamp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeUpload(image.id)}
                    aria-label={`Delete ${image.name} from uploads`}
                    title="Delete from uploads"
                    className="flex size-7 items-center justify-center rounded-lg bg-white/95 text-slate-500 shadow-sm outline-none ring-1 ring-black/10 transition-colors hover:bg-red-600 hover:text-white focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-xs leading-relaxed text-slate-500">Uploads stay in this browser only — they're never sent anywhere.</p>
      </div>
    </aside>
  )
}
