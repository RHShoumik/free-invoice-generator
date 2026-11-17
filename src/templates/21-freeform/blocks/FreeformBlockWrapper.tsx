import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import { styleOverride } from '../../shared/elementStyle'
import { useFreeformBlock } from '../../shared/FreeformBlockContext'
import type { FreeformElementRect, FreeformElementStyle } from '../../../types/invoice'

const CANVAS_WIDTH = 794
const MIN_BLOCK_WIDTH = 80
const SNAP = 8

function snap(v: number): number {
  return Math.round(v / SNAP) * SNAP
}

/** Pointer travel (px) before a press on a block becomes a drag, for a mouse and for a finger (about the platform's own tap slop). */
const MOUSE_DRAG_SLOP = 4
const TOUCH_DRAG_SLOP = 10

function clampX(x: number): number {
  return Math.min(Math.max(0, x), CANVAS_WIDTH - MIN_BLOCK_WIDTH)
}

/**
 * Whether `target` is a text field that's already focused — a box you're
 * typing in. Pressing and dragging inside one should select text, as anywhere;
 * it's pressing on a box you *aren't* editing that drags the box. (The grip
 * handle still moves a box you're editing.)
 */
function isFocusedEditable(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return target === document.activeElement
  return target.closest('[contenteditable="true"]') === document.activeElement
}

function clampY(y: number): number {
  return Math.max(0, y)
}

/** `scale` is the block's size multiplier: a scaled block is `scale` times wider on the page than its layout width. */
function clampWidth(width: number, x: number, scale: number): number {
  return Math.max(MIN_BLOCK_WIDTH, Math.min(width, (CANVAS_WIDTH - x) / scale))
}

/**
 * Converts a pointer event's screen coordinates into canvas-space pixels,
 * accounting for `ZoomToFit`'s CSS `transform: scale()` on narrower windows.
 * `getBoundingClientRect()` always reports the post-transform visual size,
 * so this stays correct with no separate scale state to track — using raw
 * `movementX/Y` instead would make the dragged block visibly lag the cursor
 * whenever the window is narrow enough for ZoomToFit to actually scale.
 */
function toCanvasPoint(e: { clientX: number; clientY: number }, canvasEl: HTMLElement) {
  const rect = canvasEl.getBoundingClientRect()
  const scale = rect.width / CANVAS_WIDTH
  return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale }
}

interface FreeformBlockWrapperProps {
  id: string
  rect: FreeformElementRect
  canvasRef: React.RefObject<HTMLDivElement | null>
  onLiveChange: (rect: FreeformElementRect) => void
  onCommitChange: (rect: FreeformElementRect) => void
  onMeasuredHeight: (height: number) => void
  /**
   * Color/size/bold/italic override for a *bound* block (business info, line
   * items, …) — see `styleOverride`. Free elements (text/table/divider) style
   * themselves inside, so they're not passed this.
   */
  boundStyle?: FreeformElementStyle
  /**
   * Only what the content itself marks as grabbable (`pointer-events`) takes the
   * pointer; the rest of the block's box lets presses through to whatever is
   * underneath. For a drawing, whose box is mostly empty — a rectangle drawn
   * around the totals must not stop you clicking the totals.
   */
  passThrough?: boolean
  children: ReactNode
}

/**
 * Positions one element on the Freeform Canvas and — only when
 * `useFreeformBlock()` is non-null (the live editor, never a design-picker
 * thumbnail) — makes it draggable (grip handle, position only), resizable
 * (right-edge handle, width only, no height field exists to resize),
 * selectable, deletable, and duplicable. All the chrome is a decorative
 * sibling of the real content (never a border on the content itself, so it
 * can't bleed into an export) and marked `data-export-hide="true"`, reusing
 * the same mechanism already built for the line-item drag handle.
 */
export function FreeformBlockWrapper({
  id,
  rect,
  canvasRef,
  onLiveChange,
  onCommitChange,
  onMeasuredHeight,
  boundStyle,
  passThrough,
  children,
}: FreeformBlockWrapperProps) {
  const block = useFreeformBlock()
  const contentRef = useRef<HTMLDivElement>(null)
  const override = styleOverride(boundStyle)
  const scale = override.scale
  const measuredRef = useRef(onMeasuredHeight)
  const scaleRef = useRef(scale)
  const [contentHeight, setContentHeight] = useState(0)
  useEffect(() => {
    measuredRef.current = onMeasuredHeight
    scaleRef.current = scale
  }, [onMeasuredHeight, scale])

  const roRef = useRef<ResizeObserver | null>(null)
  const attachContentRef = useCallback((el: HTMLDivElement | null) => {
    contentRef.current = el
    roRef.current?.disconnect()
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height
      if (height === undefined) return
      setContentHeight(height)
      // The observer reports the layout height; a scaled block is that much taller on the page.
      measuredRef.current(height * scaleRef.current)
    })
    ro.observe(el)
    roRef.current = ro
  }, [])

  const selected = block?.selectedId === id

  function beginDrag(e: PointerEvent<HTMLElement>) {
    if (!block) return
    e.preventDefault()
    e.stopPropagation()
    block.onSelect(id)
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    const start = toCanvasPoint(e, canvasEl)
    const startRect = rect

    function handleMove(ev: globalThis.PointerEvent) {
      const p = toCanvasPoint(ev, canvasEl!)
      onLiveChange({
        ...startRect,
        x: clampX(snap(startRect.x + (p.x - start.x))),
        y: clampY(snap(startRect.y + (p.y - start.y))),
      })
    }

    function handleUp(ev: globalThis.PointerEvent) {
      const p = toCanvasPoint(ev, canvasEl!)
      onCommitChange({
        ...startRect,
        x: clampX(snap(startRect.x + (p.x - start.x))),
        y: clampY(snap(startRect.y + (p.y - start.y))),
      })
      target.removeEventListener('pointermove', handleMove)
      target.removeEventListener('pointerup', handleUp)
    }

    target.addEventListener('pointermove', handleMove)
    target.addEventListener('pointerup', handleUp)
  }

  function beginResize(e: PointerEvent<HTMLElement>) {
    if (!block) return
    e.preventDefault()
    e.stopPropagation()
    block.onSelect(id)
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    const start = toCanvasPoint(e, canvasEl)
    const startRect = rect

    function handleMove(ev: globalThis.PointerEvent) {
      const p = toCanvasPoint(ev, canvasEl!)
      onLiveChange({ ...startRect, width: clampWidth(snap(startRect.width + (p.x - start.x) / scale), startRect.x, scale) })
    }

    function handleUp(ev: globalThis.PointerEvent) {
      const p = toCanvasPoint(ev, canvasEl!)
      onCommitChange({ ...startRect, width: clampWidth(snap(startRect.width + (p.x - start.x) / scale), startRect.x, scale) })
      target.removeEventListener('pointermove', handleMove)
      target.removeEventListener('pointerup', handleUp)
    }

    target.addEventListener('pointermove', handleMove)
    target.addEventListener('pointerup', handleUp)
  }

  /**
   * Lets the whole block be dragged by grabbing anywhere on it — including
   * directly on an editable field's text, which is the first thing most
   * people try. A plain click still focuses/edits the field normally
   * (nothing is prevented until the gesture proves itself a drag); only
   * once the pointer moves past a small threshold do we commit to a move —
   * blurring whatever was focused and clearing any text selection that
   * started, so dragging a block never fights with editing its own text.
   * Below the threshold this never calls `preventDefault`/`stopPropagation`
   * at all, so a plain click's native focus/selection behavior is untouched.
   */
  function handleContentPointerDown(e: PointerEvent<HTMLDivElement>) {
    const activeBlock = block
    if (!activeBlock) return
    if (isFocusedEditable(e.target)) {
      // A press to select text, not to drag the box — but still a press *on* this element. The page
      // deselects on every mouse-down, so put the selection back on release, as for any click.
      window.addEventListener('pointerup', () => activeBlock.onSelect(id), { once: true })
      return
    }
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const startClientX = e.clientX
    const startClientY = e.clientY
    // A finger drifts more than a mouse in an ordinary tap, so it needs to travel further to be a drag.
    const dragSlop = e.pointerType === 'touch' ? TOUCH_DRAG_SLOP : MOUSE_DRAG_SLOP
    const start = toCanvasPoint(e, canvasEl)
    const startRect = rect
    let dragging = false

    function handleMove(ev: globalThis.PointerEvent) {
      if (!dragging) {
        const dx = ev.clientX - startClientX
        const dy = ev.clientY - startClientY
        if (Math.hypot(dx, dy) < dragSlop) return
        dragging = true
        activeBlock!.onSelect(id)
        window.getSelection()?.removeAllRanges()
        const active = document.activeElement
        if (active instanceof HTMLElement && active !== document.body) active.blur()
      }
      const p = toCanvasPoint(ev, canvasEl!)
      onLiveChange({
        ...startRect,
        x: clampX(snap(startRect.x + (p.x - start.x))),
        y: clampY(snap(startRect.y + (p.y - start.y))),
      })
    }

    function handleUp(ev: globalThis.PointerEvent) {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      if (!dragging) {
        activeBlock!.onSelect(id)
        return
      }
      const p = toCanvasPoint(ev, canvasEl!)
      onCommitChange({
        ...startRect,
        x: clampX(snap(startRect.x + (p.x - start.x))),
        y: clampY(snap(startRect.y + (p.y - start.y))),
      })
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        zIndex: selected ? 50 : 1,
        // The free-element overlay on fixed layouts is click-through so it
        // can't block the design underneath; each element opts back in.
        pointerEvents: passThrough ? 'none' : 'auto',
      }}
    >
      <div
        ref={attachContentRef}
        {...override.attrs}
        style={{
          position: 'relative',
          cursor: block ? 'grab' : undefined,
          touchAction: block ? 'none' : undefined,
          ...override.vars,
          ...(scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: 'top left' } : {}),
        }}
        onPointerDown={block ? handleContentPointerDown : undefined}
      >
        {children}
      </div>

      {block && (
        <div
          data-export-hide="true"
          // The chrome (outline, buttons, resize handle) tracks the block's *visible* box, which a scale
          // changes without changing its layout box — so it's sized from the scaled width/height.
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            ...(scale !== 1 && contentHeight > 0
              ? { width: rect.width * scale, height: contentHeight * scale }
              : { right: 0, bottom: 0 }),
          }}
        >
          {selected && (
            <div
              style={{
                position: 'absolute',
                inset: -2,
                border: '1.5px solid var(--brand)',
                borderRadius: 4,
              }}
            />
          )}
          <button
            type="button"
            onPointerDown={beginDrag}
            aria-label="Drag to move"
            style={{
              position: 'absolute',
              top: -22,
              left: -2,
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              border: selected ? '1px solid var(--brand)' : '1px solid transparent',
              background: selected ? 'var(--brand)' : 'rgba(100, 116, 139, 0.35)',
              color: '#fff',
              fontSize: 11,
              lineHeight: 1,
              cursor: 'grab',
              pointerEvents: 'auto',
              touchAction: 'none',
            }}
          >
            ⠿
          </button>
          {selected && (
            <div
              // These buttons only exist while the element is selected, and the page deselects on
              // any mouse-down it sees (click empty space to deselect). Without this, pressing ✕ or
              // ⧉ deselects first, which unmounts the button before the mouse comes back up — so
              // the click never fires and nothing is deleted or duplicated.
              onMouseDown={(e) => e.stopPropagation()}
              style={{ position: 'absolute', top: -22, right: -2, display: 'flex', gap: 2, pointerEvents: 'auto' }}
            >
              <button
                type="button"
                onClick={() => block.onDuplicate(id)}
                aria-label="Duplicate element"
                style={{
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  border: '1px solid var(--brand)',
                  background: 'var(--brand)',
                  color: '#fff',
                  fontSize: 11,
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
              >
                ⧉
              </button>
              <button
                type="button"
                onClick={() => block.onDelete(id)}
                aria-label="Delete element"
                style={{
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  border: '1px solid #dc2626',
                  background: '#dc2626',
                  color: '#fff',
                  fontSize: 11,
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          )}
          <div
            onPointerDown={beginResize}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: -4,
              width: 8,
              display: selected ? 'block' : 'none',
              cursor: 'ew-resize',
              pointerEvents: 'auto',
              touchAction: 'none',
            }}
          />
        </div>
      )}
    </div>
  )
}
