import type { Drawing, DrawingFill, DrawingTool, FreeformElementRect } from '../types/invoice'

/**
 * Everything geometric about the draw tools, kept free of React and the DOM so
 * it can be tested on its own: turning a mouse gesture into a stored
 * `Drawing`, and turning a `Drawing` into SVG marks. The marks are a plain
 * data list — `{ tag, attrs }` — that the on-page component renders as JSX.
 */

export type Point = [number, number]

export const DEFAULT_STROKE_COLOR = '#0f172a'
export const MIN_STROKE_WIDTH = 1
export const MAX_STROKE_WIDTH = 16
export const DEFAULT_STROKE_WIDTH = 3

/** Pointer travel (px) below which a press-and-release draws nothing — it was a click, not a drag. */
const MIN_GESTURE = 4
/** Fill opacity of the `tint` fill. */
const TINT_OPACITY = 0.14
/** Width of the invisible stroke around a shape that makes a thin line easy to grab. */
const HIT_STROKE_WIDTH = 14

const round1 = (n: number) => Math.round(n * 10) / 10

/** How far an arrow's head reaches past the shaft, and its half-width as a fraction of that. */
function arrowHeadLength(strokeWidth: number, shaftLength: number): number {
  return Math.min(Math.max(12, strokeWidth * 4), shaftLength * 0.6)
}

/** Room added around a shape's geometry so its stroke (and an arrow's head) is inside the element's box. */
function drawingPad(tool: DrawingTool, strokeWidth: number): number {
  return Math.ceil(tool === 'arrow' ? Math.max(12, strokeWidth * 4) * 0.5 + strokeWidth : strokeWidth / 2 + 1)
}

/** What a drag from `start` to `end` ends at when Shift is held: a square/circle, or a line on a 45° step. */
function constrainEnd(tool: DrawingTool, start: Point, end: Point): Point {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  if (tool === 'rectangle' || tool === 'ellipse') {
    const size = Math.max(Math.abs(dx), Math.abs(dy))
    return [start[0] + (dx < 0 ? -size : size), start[1] + (dy < 0 ? -size : size)]
  }
  const step = Math.PI / 4
  const angle = Math.round(Math.atan2(dy, dx) / step) * step
  const length = Math.hypot(dx, dy)
  return [start[0] + Math.cos(angle) * length, start[1] + Math.sin(angle) * length]
}

/** Ramer–Douglas–Peucker: drops the points of a hand-drawn stroke that lie within `tolerance` px of the line between their neighbours. */
export function simplifyPath(points: Point[], tolerance = 1): Point[] {
  if (points.length < 3) return points
  const keep = new Array<boolean>(points.length).fill(false)
  keep[0] = keep[points.length - 1] = true
  const stack: [number, number][] = [[0, points.length - 1]]
  while (stack.length > 0) {
    const [first, last] = stack.pop()!
    const [ax, ay] = points[first]
    const [bx, by] = points[last]
    const length = Math.hypot(bx - ax, by - ay)
    let farthest = -1
    let farthestDistance = tolerance
    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i]
      // Distance to the segment's line; to its start when the segment has no length (a stroke that returns to where it began).
      const distance = length === 0 ? Math.hypot(px - ax, py - ay) : Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length
      if (distance > farthestDistance) {
        farthest = i
        farthestDistance = distance
      }
    }
    if (farthest !== -1) {
      keep[farthest] = true
      stack.push([first, farthest], [farthest, last])
    }
  }
  return points.filter((_, i) => keep[i])
}

/** An SVG path through `points` that curves smoothly instead of showing a corner at every sample. */
export function smoothPath(points: Point[]): string {
  const at = ([x, y]: Point) => `${round1(x)} ${round1(y)}`
  if (points.length === 0) return ''
  if (points.length < 3) return `M${at(points[0])} L${at(points[points.length - 1])}`
  let d = `M${at(points[0])}`
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i]
    const [nx, ny] = points[i + 1]
    d += ` Q${at(points[i])} ${at([(x + nx) / 2, (y + ny) / 2])}`
  }
  return `${d} L${at(points[points.length - 1])}`
}

/** A mouse gesture on the page, in page px. */
export interface DrawGesture {
  tool: DrawingTool
  start: Point
  end: Point
  /** Every point the pointer visited, for the pencil. */
  path: Point[]
  strokeWidth: number
  fill: DrawingFill
  /** Shift held: square/circle, or a line on a 45° step. */
  constrain?: boolean
}

export interface BuiltDrawing {
  /** Where the element goes on the page. */
  rect: FreeformElementRect
  drawing: Drawing
}

/**
 * Turns a finished (or in-progress) gesture into the element to store: the
 * smallest box around the geometry plus room for the stroke, with the points
 * re-expressed in that box. `null` when it was too small to be a drawing
 * (just a click). `simplify: false` skips smoothing the pencil path — used
 * while the stroke is still being drawn, when it's rebuilt on every move.
 */
export function buildDrawing(gesture: DrawGesture, { simplify = true } = {}): BuiltDrawing | null {
  const { tool, strokeWidth, fill } = gesture
  let points: Point[]
  if (tool === 'pencil') {
    points = simplify ? simplifyPath(gesture.path) : gesture.path
  } else {
    points = [gesture.start, gesture.constrain ? constrainEnd(tool, gesture.start, gesture.end) : gesture.end]
  }
  if (points.length < 2) return null

  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  if (Math.max(maxX - minX, maxY - minY) < MIN_GESTURE) return null

  const pad = drawingPad(tool, strokeWidth)
  const x = minX - pad
  const y = minY - pad
  const w = round1(maxX - minX + pad * 2)
  const h = round1(maxY - minY + pad * 2)
  return {
    rect: { x: round1(x), y: round1(y), width: w },
    drawing: { tool, w, h, points: points.map(([px, py]) => [round1(px - x), round1(py - y)]), strokeWidth, fill },
  }
}

export interface Mark {
  tag: 'rect' | 'ellipse' | 'line' | 'path' | 'polygon'
  /** camelCase SVG attributes, as React takes them. */
  attrs: Record<string, string | number>
}

function fillAttrs(fill: DrawingFill, color: string): Record<string, string | number> {
  if (fill === 'solid') return { fill: color }
  if (fill === 'tint') return { fill: color, fillOpacity: TINT_OPACITY }
  return { fill: 'none' }
}

/** What to draw for `drawing` in `color`, as SVG marks in its own `0 0 w h` space. */
export function drawingMarks(drawing: Drawing, color: string): Mark[] {
  const { tool, points, strokeWidth: sw, fill } = drawing
  const stroke = { stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const [a, b] = [points[0], points[points.length - 1]]
  if (!a || !b) return []

  switch (tool) {
    case 'pencil':
      return [{ tag: 'path', attrs: { d: smoothPath(points), fill: 'none', ...stroke } }]
    case 'line':
      return [{ tag: 'line', attrs: { x1: a[0], y1: a[1], x2: b[0], y2: b[1], ...stroke } }]
    case 'rectangle':
      return [
        {
          tag: 'rect',
          attrs: { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), width: Math.abs(b[0] - a[0]), height: Math.abs(b[1] - a[1]), ...fillAttrs(fill, color), ...stroke },
        },
      ]
    case 'ellipse':
      return [
        {
          tag: 'ellipse',
          attrs: {
            cx: (a[0] + b[0]) / 2,
            cy: (a[1] + b[1]) / 2,
            rx: Math.abs(b[0] - a[0]) / 2,
            ry: Math.abs(b[1] - a[1]) / 2,
            ...fillAttrs(fill, color),
            ...stroke,
          },
        },
      ]
    case 'arrow': {
      const length = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (length === 0) return []
      const [ux, uy] = [(b[0] - a[0]) / length, (b[1] - a[1]) / length]
      const head = arrowHeadLength(sw, length)
      const [bx, by] = [b[0] - ux * head, b[1] - uy * head]
      const half = head * 0.5
      const [nx, ny] = [-uy * half, ux * half]
      const shaftEnd: Point = [b[0] - ux * head * 0.8, b[1] - uy * head * 0.8]
      return [
        { tag: 'line', attrs: { x1: a[0], y1: a[1], x2: round1(shaftEnd[0]), y2: round1(shaftEnd[1]), ...stroke } },
        { tag: 'polygon', attrs: { points: `${round1(b[0])},${round1(b[1])} ${round1(bx + nx)},${round1(by + ny)} ${round1(bx - nx)},${round1(by - ny)}`, fill: color, ...stroke } },
      ]
    }
  }
}

/**
 * Invisible, wider copies of the marks: what the editor makes grabbable, so
 * a 2px line is easy to pick up and an unfilled rectangle can be dragged by
 * its outline while the empty inside stays click-through to the page below.
 * (A filled shape is grabbable inside too.)
 */
export function drawingHitMarks(drawing: Drawing, color: string): Mark[] {
  const style = new Set(['stroke', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin', 'fill', 'fillOpacity'])
  return drawingMarks(drawing, color).map((mark) => {
    const geometry = Object.fromEntries(Object.entries(mark.attrs).filter(([key]) => !style.has(key)))
    const painted = mark.attrs.fill !== undefined && mark.attrs.fill !== 'none'
    return {
      tag: mark.tag,
      attrs: {
        ...geometry,
        fill: painted ? 'transparent' : 'none',
        stroke: 'transparent',
        strokeWidth: Math.max(drawing.strokeWidth, HIT_STROKE_WIDTH),
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    }
  })
}
