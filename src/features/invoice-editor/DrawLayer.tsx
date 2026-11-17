import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { buildDrawing } from '../../lib/drawing'
import type { BuiltDrawing, DrawGesture, Point } from '../../lib/drawing'
import { useInvoiceStore } from '../../store/invoiceStore'
import { DrawingSvg } from '../../templates/21-freeform/blocks/FreeformDrawingElement'
import type { DrawSettings } from './drawSettings'

const PAGE_WIDTH = 794
/** The pencil skips samples closer than this to the last one kept, so a slow stroke doesn't store a point per pixel. */
const MIN_POINT_SPACING = 1.5

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/**
 * Draw mode's surface: a transparent sheet over the whole page that takes
 * every press, so drawing never grabs or edits what's underneath. Dragging
 * shows the shape as it grows, in the real renderer; releasing stores it as
 * a `drawing` element (one undo step per shape or stroke). Holding Shift
 * keeps a rectangle/ellipse square and a line on 45° steps. A press that
 * never travels far enough to be a drag draws nothing.
 *
 * Points are converted to page px with `getBoundingClientRect` (as for
 * dragging blocks), so it's right under `ZoomToFit`'s scaling. The layer is
 * `data-export-hide` — it's never in an export, even if one starts mid-stroke.
 */
export function DrawLayer({ settings }: { settings: DrawSettings }) {
  const addDrawing = useInvoiceStore((s) => s.addDrawing)
  const layerRef = useRef<HTMLDivElement>(null)
  // The gesture lives in a ref so a burst of move events (React batches renders between them) never works from a stale copy.
  const gesture = useRef<DrawGesture | null>(null)
  const [preview, setPreview] = useState<BuiltDrawing | null>(null)

  function pagePoint(e: { clientX: number; clientY: number }): Point {
    const rect = layerRef.current!.getBoundingClientRect()
    const scale = rect.width / PAGE_WIDTH || 1
    return [clamp((e.clientX - rect.left) / scale, 0, PAGE_WIDTH), clamp((e.clientY - rect.top) / scale, 0, rect.height / scale)]
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const p = pagePoint(e)
    gesture.current = { tool: settings.tool, start: p, end: p, path: [p], strokeWidth: settings.strokeWidth, fill: settings.fill, constrain: e.shiftKey }
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const g = gesture.current
    if (!g) return
    const p = pagePoint(e)
    g.end = p
    g.constrain = e.shiftKey
    const last = g.path[g.path.length - 1]
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= MIN_POINT_SPACING) g.path.push(p)
    setPreview(buildDrawing(g, { simplify: false }))
  }

  function finish(commit: boolean) {
    const g = gesture.current
    gesture.current = null
    setPreview(null)
    if (!commit || !g) return
    const built = buildDrawing(g)
    if (built) addDrawing(built.rect, built.drawing, settings.color)
  }

  return (
    <div
      ref={layerRef}
      data-export-hide="true"
      data-draw-layer
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => finish(true)}
      onPointerCancel={() => finish(false)}
      style={{ position: 'absolute', inset: 0, zIndex: 20, cursor: 'crosshair', touchAction: 'none' }}
    >
      {preview && (
        <div style={{ position: 'absolute', left: preview.rect.x, top: preview.rect.y, width: preview.rect.width, pointerEvents: 'none' }}>
          <DrawingSvg drawing={preview.drawing} color={settings.color} />
        </div>
      )}
    </div>
  )
}
