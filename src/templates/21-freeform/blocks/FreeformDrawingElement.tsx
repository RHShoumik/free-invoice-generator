import { DEFAULT_STROKE_COLOR, drawingHitMarks, drawingMarks } from '../../../lib/drawing'
import type { Mark } from '../../../lib/drawing'
import type { Drawing, FreeformElement } from '../../../types/invoice'
import { useFreeformBlock } from '../../shared/FreeformBlockContext'

interface FreeformDrawingElementProps {
  element: Extract<FreeformElement, { kind: 'drawing' }>
}

const renderMark = (mark: Mark, i: number) => {
  const Tag = mark.tag
  return <Tag key={i} {...mark.attrs} />
}

interface DrawingSvgProps {
  drawing: Drawing
  color: string
  opacity?: number
  /** Add the invisible grab outline (the live editor only; see below). */
  grabbable?: boolean
}

/**
 * The drawing as an inline SVG that fills its container's width and keeps its
 * aspect ratio (a drawing element has no height of its own), so resizing the
 * element scales the drawing, lines included.
 *
 * It is click-through — the empty inside of a rectangle must not catch presses
 * meant for the page underneath. With `grabbable`, an invisible, wider copy of
 * the marks takes presses instead (see `drawingHitMarks`), so a 2px line is
 * still easy to pick up. That copy is `data-export-hide`.
 */
export function DrawingSvg({ drawing, color, opacity, grabbable }: DrawingSvgProps) {
  return (
    <svg
      viewBox={`0 0 ${drawing.w} ${drawing.h}`}
      width="100%"
      role="img"
      aria-label={`Drawing: ${drawing.tool}`}
      style={{ display: 'block', overflow: 'visible', pointerEvents: 'none', opacity }}
    >
      {drawingMarks(drawing, color).map(renderMark)}
      {grabbable && (
        <g data-export-hide="true" pointerEvents="visiblePainted">
          {drawingHitMarks(drawing, color).map(renderMark)}
        </g>
      )}
    </svg>
  )
}

/**
 * A shape or pencil stroke drawn on the page (see `DrawLayer`). The stroke
 * color is the element's `style.color`, its opacity `style.opacity`. Outside
 * the live editor (`useFreeformBlock()` null) it is just the picture.
 */
export function FreeformDrawingElement({ element }: FreeformDrawingElementProps) {
  const block = useFreeformBlock()
  const { drawing, style } = element
  return <DrawingSvg drawing={drawing} color={style?.color ?? DEFAULT_STROKE_COLOR} opacity={style?.opacity} grabbable={!!block} />
}
