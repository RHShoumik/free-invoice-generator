import { Image as ImageIcon, Minus, MousePointerClick, RotateCcw, Table2, Type, X } from 'lucide-react'
import type { DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { useFreeformBlock } from '../../templates/shared/FreeformBlockContext'
import type { FreeformFreeKind } from '../../types/invoice'
import { ELEMENT_DRAG_TYPE } from './elementDrag'

const OPTIONS: { kind: FreeformFreeKind; label: string; hint: string; Icon: typeof Type }[] = [
  { kind: 'text', label: 'Text', hint: 'A box you can type in', Icon: Type },
  { kind: 'table', label: 'Table', hint: 'Rows and columns', Icon: Table2 },
  { kind: 'image', label: 'Image', hint: 'Upload a picture', Icon: ImageIcon },
  { kind: 'divider', label: 'Divider', hint: 'A simple line', Icon: Minus },
]

interface ElementsDrawerProps {
  /** True when some section has been dragged away from where its design puts it. */
  canResetPositions: boolean
  onResetPositions: () => void
  onClose: () => void
}

/**
 * The Elements card, floating over the workspace's left edge on every layout
 * — drag a row onto the page to drop that element exactly where you let go,
 * or click it to drop it at a default spot, then move it like any other
 * block. Elements are free-floating, so they sit on top of whichever design
 * is active (see `FreeLayer`); on Freeform Canvas they're laid out by the
 * layout itself. Positioned by `EditorLayout`; closes with its ✕ or the
 * dock's Elements button. Renders nothing outside the live editor
 * (`useFreeformBlock()` is null).
 */
export function ElementsDrawer({ canResetPositions, onResetPositions, onClose }: ElementsDrawerProps) {
  const block = useFreeformBlock()
  if (!block) return null

  function handleDragStart(e: DragEvent<HTMLButtonElement>, kind: FreeformFreeKind) {
    e.dataTransfer.setData(ELEMENT_DRAG_TYPE, kind)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside className="flex max-h-full min-h-0 w-72 flex-col rounded-2xl bg-white shadow-[0_8px_32px_rgb(21_23_26/0.14)] ring-1 ring-black/5">
      <div className="flex items-start justify-between px-5 pb-1 pt-5">
        <div>
          <h2 className="text-base font-bold tracking-tight text-ink">Elements</h2>
          <p className="mt-0.5 text-xs text-slate-500">Drag onto the page, or click to add</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close elements panel"
          className="-mr-1.5 -mt-1 flex size-8 items-center justify-center rounded-full text-slate-400 outline-none transition-colors hover:bg-black/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-3 pb-4 pt-3">
        <ul className="space-y-1">
          {OPTIONS.map(({ kind, label, hint, Icon }) => (
            <li key={kind}>
              <button
                type="button"
                draggable
                onDragStart={(e) => handleDragStart(e, kind)}
                onClick={() => block.onAddElement(kind)}
                className="group flex w-full cursor-grab items-center gap-3.5 rounded-xl p-2.5 text-left outline-none transition-colors hover:bg-paper focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-paper text-ink transition-all group-hover:bg-ink group-hover:text-white">
                  <Icon className="size-5" strokeWidth={1.7} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{label}</span>
                  <span className="block text-xs text-slate-500">{hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mx-2 mt-4 flex gap-2.5 rounded-xl bg-paper p-3.5 text-xs leading-relaxed text-slate-600">
          <MousePointerClick className="mt-0.5 size-4 shrink-0 text-brand" />
          <p>Click anything on the page to change its size and color, and drag it wherever you like.</p>
        </div>

        {canResetPositions && (
          <Button type="button" variant="outline" className="mx-2 mt-3 w-[calc(100%-1rem)] rounded-xl" onClick={onResetPositions}>
            <RotateCcw /> Reset positions
          </Button>
        )}
      </div>
    </aside>
  )
}
