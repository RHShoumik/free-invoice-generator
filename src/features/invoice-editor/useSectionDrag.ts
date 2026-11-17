import { useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent, RefObject } from 'react'
import type { SectionOffset, SectionOffsets } from '../../types/invoice'

const PAGE_WIDTH = 794
/** Pointer travel (px) before a press becomes a drag — below it, it's an ordinary click that focuses/edits. */
const DRAG_THRESHOLD = 4

export const SECTION_LABELS: Record<string, string> = {
  logo: 'Logo',
  from: 'From',
  to: 'Bill to',
  items: 'Line items',
  totals: 'Totals',
  signature: 'Signature',
  brand: 'Business name',
  title: 'Title',
  number: 'Invoice no.',
  meta: 'Dates',
  footer: 'Notes',
  headline: 'Headline',
  worklog: 'Work log',
  stamp: 'Stamp',
  watermark: 'Watermark',
}

/** A section's on-page box in canvas px (what `InvoicePreview` draws the hover/drag outline with). */
export interface SectionBox {
  id: string
  left: number
  top: number
  width: number
  height: number
  /** The section's offset when this box was measured — if it has since changed (undo, redo, reset), the box is stale and not drawn. */
  ox: number
  oy: number
}

interface UseSectionDragOptions {
  wrapperRef: RefObject<HTMLDivElement | null>
  /** Persisted offsets from the store. */
  offsets: SectionOffsets
  onCommit: (id: string, offset: SectionOffset) => void
  /** Called with a section's id when it's pressed, so the style toolbar can follow it. */
  onSelect?: (id: string) => void
  enabled: boolean
}

function sectionElementAt(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>('[data-section-id]') : null
}

function toBox(id: string, rect: DOMRect, wrapRect: DOMRect, scale: number, offset: SectionOffset | undefined): SectionBox {
  return {
    id,
    left: (rect.left - wrapRect.left) / scale,
    top: (rect.top - wrapRect.top) / scale,
    width: rect.width / scale,
    height: rect.height / scale,
    ox: Math.round(offset?.x ?? 0),
    oy: Math.round(offset?.y ?? 0),
  }
}

function sameBox(a: SectionBox | null, b: SectionBox | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return a.id === b.id && a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height && a.ox === b.ox && a.oy === b.oy
}

/**
 * Drag-any-section-anywhere for the 20 fixed layouts. Every shared primitive
 * (logo/from/to/items/totals/signature) tags its root with `data-section-id`
 * and shifts itself by its entry in `offsets` (see `SectionOffsetsContext`);
 * this hook turns a press-and-drag on any such element into a new offset. It
 * works by event delegation on the preview wrapper — one set of handlers, no
 * per-layout wiring, so all 20 layouts get it at once.
 *
 * Same click-vs-drag rule as `FreeformBlockWrapper`: a press that never
 * travels `DRAG_THRESHOLD` px is a normal click and is left completely alone
 * (the field focuses, the logo opens its file picker); only past it does the
 * gesture become a move, blurring whatever was focused so dragging never
 * fights with editing. A field that's *already* focused isn't dragged at all
 * — pressing and dragging inside it should select text, as anyone expects.
 *
 * The move is clamped so a section can't be dragged off the page, where the
 * PNG/PDF export (which captures exactly the page) would cut it off.
 */
export function useSectionDrag({ wrapperRef, offsets, onCommit, onSelect, enabled }: UseSectionDragOptions) {
  const [live, setLive] = useState<{ id: string; x: number; y: number } | null>(null)
  const [box, setBox] = useState<SectionBox | null>(null)
  const draggingRef = useRef(false)

  const merged: SectionOffsets = live ? { ...offsets, [live.id]: { x: live.x, y: live.y } } : offsets

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!enabled || draggingRef.current) return
    const wrapper = wrapperRef.current
    const el = sectionElementAt(e.target)
    if (!wrapper || !el) {
      setBox(null)
      return
    }
    const wrapRect = wrapper.getBoundingClientRect()
    const id = el.dataset.sectionId ?? ''
    const next = toBox(id, el.getBoundingClientRect(), wrapRect, wrapRect.width / PAGE_WIDTH, offsets[id])
    setBox((prev) => (sameBox(prev, next) ? prev : next))
  }

  function handlePointerLeave() {
    if (!draggingRef.current) setBox(null)
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!enabled || e.button !== 0) return
    const wrapper = wrapperRef.current
    const target = e.target
    if (!wrapper || !(target instanceof Element)) return
    const el = sectionElementAt(target)
    const foundId = el?.dataset.sectionId
    if (!el || !foundId) {
      setBox(null)
      return
    }
    // Re-bound as a plain `string`: narrowing from the guard above doesn't
    // carry into the hoisted handler functions below.
    const id: string = foundId

    // Pressing anything in a section selects it — even a button or a field that's already
    // being edited, which aren't draggable — so the style toolbar always follows the click.
    onSelect?.(id)
    if (target.closest('[data-no-section-drag], button')) return
    if ((target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) && target === document.activeElement) {
      return
    }

    const startX = e.clientX
    const startY = e.clientY
    const startOffset = offsets[id] ?? { x: 0, y: 0 }
    const wrapRect = wrapper.getBoundingClientRect()
    const scale = wrapRect.width / PAGE_WIDTH
    const startBox = toBox(id, el.getBoundingClientRect(), wrapRect, scale, startOffset)
    let dragging = false
    let dx = 0
    let dy = 0

    function handleMove(ev: globalThis.PointerEvent) {
      if (!dragging) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD) return
        dragging = true
        draggingRef.current = true
        window.getSelection()?.removeAllRanges()
        const active = document.activeElement
        if (active instanceof HTMLElement && active !== document.body) active.blur()
        document.body.style.userSelect = 'none'
      }
      const rawX = (ev.clientX - startX) / scale
      const rawY = (ev.clientY - startY) / scale
      const maxX = PAGE_WIDTH - startBox.width - startBox.left
      const maxY = wrapRect.height / scale - startBox.height - startBox.top
      dx = Math.max(-startBox.left, Math.min(maxX, rawX))
      dy = Math.max(-startBox.top, Math.min(maxY, rawY))
      setLive({ id, x: startOffset.x + dx, y: startOffset.y + dy })
      setBox({
        ...startBox,
        left: startBox.left + dx,
        top: startBox.top + dy,
        ox: Math.round(startOffset.x + dx),
        oy: Math.round(startOffset.y + dy),
      })
    }

    function finish(commit: boolean) {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleCancel)
      document.body.style.userSelect = ''
      if (!dragging) return
      draggingRef.current = false
      if (commit) onCommit(id, { x: Math.round(startOffset.x + dx), y: Math.round(startOffset.y + dy) })
      setLive(null)
      // The press ends on the element it began on, so the browser fires a
      // click right after the drag — swallow it, or dropping the logo would
      // pop open its file picker.
      const swallow = (ev: MouseEvent) => ev.stopPropagation()
      window.addEventListener('click', swallow, { capture: true, once: true })
      setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 50)
    }
    function handleUp() {
      finish(true)
    }
    function handleCancel() {
      finish(false)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleCancel)
  }

  // Hide the outline once its section has moved by some other route (undo, redo, reset).
  const current = box ? merged[box.id] : undefined
  const boxIsCurrent = box !== null && Math.round(current?.x ?? 0) === box.ox && Math.round(current?.y ?? 0) === box.oy

  return {
    /** Persisted offsets with the in-flight drag merged in — hand this to `SectionOffsetsProvider`. */
    offsets: merged,
    box: boxIsCurrent ? box : null,
    handlers: { onPointerDown: handlePointerDown, onPointerMove: handlePointerMove, onPointerLeave: handlePointerLeave },
  }
}

/**
 * Where the *selected* section is on the page, for drawing its outline.
 * Re-measured after every edit (`trigger`) because anything — typing,
 * restyling, undo — can change a section's size or position, and read from
 * the DOM rather than tracked, so it can't drift from what's actually shown.
 * Measured a frame later so React has committed the change first; and drawn
 * as an overlay (never as an outline on the section itself) so it can't be
 * baked into an export.
 */
export function useElementBox(wrapperRef: RefObject<HTMLDivElement | null>, id: string | null, trigger: unknown): SectionBox | null {
  const [box, setBox] = useState<SectionBox | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const wrapper = wrapperRef.current
      const el = wrapper && id ? wrapper.querySelector<HTMLElement>(`[data-section-id="${CSS.escape(id)}"]`) : null
      if (!wrapper || !el || !id) {
        setBox(null)
        return
      }
      const wrapRect = wrapper.getBoundingClientRect()
      const next = toBox(id, el.getBoundingClientRect(), wrapRect, wrapRect.width / PAGE_WIDTH, undefined)
      setBox((prev) => (sameBox(prev, next) ? prev : next))
    }
    const frame = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(frame)
  }, [wrapperRef, id, trigger])

  return box
}
