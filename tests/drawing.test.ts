import { describe, expect, it } from 'vitest'
import { buildDrawing, drawingHitMarks, drawingMarks, simplifyPath, smoothPath } from '../src/lib/drawing'
import type { DrawGesture, Point } from '../src/lib/drawing'
import type { Drawing } from '../src/types/invoice'

const gesture = (over: Partial<DrawGesture>): DrawGesture => ({
  tool: 'rectangle',
  start: [100, 200],
  end: [220, 260],
  path: [],
  strokeWidth: 4,
  fill: 'none',
  ...over,
})

describe('buildDrawing', () => {
  it('boxes a rectangle with room for the stroke and re-expresses its corners in that box', () => {
    const built = buildDrawing(gesture({}))!
    // pad for a 4px stroke = ceil(4/2 + 1) = 3
    expect(built.rect).toEqual({ x: 97, y: 197, width: 126 })
    expect(built.drawing).toMatchObject({ tool: 'rectangle', w: 126, h: 66, strokeWidth: 4, fill: 'none', points: [[3, 3], [123, 63]] })
  })

  it('is the same shape however the drag was made (up-left instead of down-right)', () => {
    const a = buildDrawing(gesture({ start: [220, 260], end: [100, 200] }))!
    expect(a.rect).toEqual({ x: 97, y: 197, width: 126 })
    // corners are kept in drag order; the renderer takes min/abs
    const marks = drawingMarks(a.drawing, '#000')
    expect(marks[0].attrs).toMatchObject({ x: 3, y: 3, width: 120, height: 60 })
  })

  it('keeps a rectangle or ellipse square when constrained, in the direction of the drag', () => {
    const built = buildDrawing(gesture({ start: [100, 100], end: [220, 130], constrain: true }))!
    const [a, b] = built.drawing.points
    expect(Math.abs(b[0] - a[0])).toBe(Math.abs(b[1] - a[1]))
    expect(b[0] - a[0]).toBe(120)
    const up = buildDrawing(gesture({ tool: 'ellipse', start: [100, 100], end: [60, 130], constrain: true }))!
    const [c, d] = up.drawing.points
    expect(d[0] - c[0]).toBe(-40)
    expect(d[1] - c[1]).toBe(40)
  })

  it('snaps a constrained line to a 45° step', () => {
    const horizontal = buildDrawing(gesture({ tool: 'line', start: [50, 50], end: [200, 62], constrain: true }))!
    const [a, b] = horizontal.drawing.points
    expect(b[1]).toBeCloseTo(a[1], 5)
    const diagonal = buildDrawing(gesture({ tool: 'arrow', start: [50, 50], end: [140, 130], constrain: true }))!
    const [c, d] = diagonal.drawing.points
    expect(Math.abs(d[0] - c[0])).toBeCloseTo(Math.abs(d[1] - c[1]), 0)
  })

  it('makes nothing from a click, or a drag too short to mean anything', () => {
    expect(buildDrawing(gesture({ end: [100, 200] }))).toBeNull()
    expect(buildDrawing(gesture({ end: [102, 201] }))).toBeNull()
    expect(buildDrawing(gesture({ tool: 'pencil', path: [[10, 10], [11, 11]] }))).toBeNull()
    expect(buildDrawing(gesture({ tool: 'pencil', path: [[10, 10]] }))).toBeNull()
  })

  it('gives a horizontal line a real height (the stroke), not zero', () => {
    const built = buildDrawing(gesture({ tool: 'line', start: [10, 100], end: [210, 100], strokeWidth: 2 }))!
    expect(built.drawing.h).toBeGreaterThan(0)
  })

  it('gives an arrow extra room for its head', () => {
    const line = buildDrawing(gesture({ tool: 'line', start: [10, 100], end: [210, 100] }))!
    const arrow = buildDrawing(gesture({ tool: 'arrow', start: [10, 100], end: [210, 100] }))!
    expect(arrow.drawing.h).toBeGreaterThan(line.drawing.h)
  })

  it('boxes a pencil stroke around all its points and simplifies a dense one', () => {
    const path: Point[] = Array.from({ length: 101 }, (_, i) => [50 + i, 80 + (i % 2 === 0 ? 0 : 0.3)])
    const built = buildDrawing(gesture({ tool: 'pencil', path }))!
    expect(built.drawing.points.length).toBeLessThan(10)
    expect(built.rect.x).toBeLessThan(50)
    expect(built.drawing.w).toBeGreaterThan(100)
    // the first and last points of the stroke are always kept
    expect(built.drawing.points[0][0]).toBeCloseTo(50 - built.rect.x, 1)
  })

  it('can skip simplifying while a stroke is still being drawn', () => {
    const path: Point[] = Array.from({ length: 30 }, (_, i) => [10 + i * 3, 50])
    expect(buildDrawing(gesture({ tool: 'pencil', path }), { simplify: false })!.drawing.points).toHaveLength(30)
  })

  it('stores the element width equal to the drawing\'s own width, so it starts at scale 1', () => {
    const built = buildDrawing(gesture({}))!
    expect(built.rect.width).toBe(built.drawing.w)
  })
})

describe('simplifyPath', () => {
  it('keeps a straight run to its two ends', () => {
    expect(simplifyPath([[0, 0], [5, 0], [10, 0], [20, 0]])).toEqual([[0, 0], [20, 0]])
  })

  it('keeps a real corner', () => {
    expect(simplifyPath([[0, 0], [10, 0], [20, 0], [20, 10], [20, 20]])).toEqual([[0, 0], [20, 0], [20, 20]])
  })

  it('survives a stroke that ends where it began', () => {
    const loop: Point[] = [[0, 0], [10, 10], [20, 0], [10, -10], [0, 0]]
    expect(simplifyPath(loop).length).toBeGreaterThanOrEqual(3)
  })
})

describe('smoothPath', () => {
  it('is empty for no points, a straight line for two, and curves through three or more', () => {
    expect(smoothPath([])).toBe('')
    expect(smoothPath([[0, 0], [10, 10]])).toBe('M0 0 L10 10')
    const d = smoothPath([[0, 0], [10, 0], [10, 10]])
    expect(d.startsWith('M0 0')).toBe(true)
    expect(d).toContain('Q10 0')
    expect(d.endsWith('L10 10')).toBe(true)
  })
})

describe('drawingMarks', () => {
  const base = { w: 100, h: 60, strokeWidth: 3, fill: 'none' } as const
  const rect: Drawing = { ...base, tool: 'rectangle', points: [[4, 4], [96, 56]] }

  it('draws a rectangle, an ellipse and a line from their two points', () => {
    expect(drawingMarks(rect, '#f00')[0]).toMatchObject({ tag: 'rect', attrs: { x: 4, y: 4, width: 92, height: 52, stroke: '#f00', strokeWidth: 3 } })
    expect(drawingMarks({ ...rect, tool: 'ellipse' }, '#f00')[0]).toMatchObject({ tag: 'ellipse', attrs: { cx: 50, cy: 30, rx: 46, ry: 26 } })
    expect(drawingMarks({ ...rect, tool: 'line' }, '#f00')[0]).toMatchObject({ tag: 'line', attrs: { x1: 4, y1: 4, x2: 96, y2: 56 } })
  })

  it('fills none, tint or solid', () => {
    expect(drawingMarks(rect, '#f00')[0].attrs).toMatchObject({ fill: 'none' })
    expect(drawingMarks({ ...rect, fill: 'tint' }, '#f00')[0].attrs).toMatchObject({ fill: '#f00', fillOpacity: 0.14 })
    expect(drawingMarks({ ...rect, fill: 'solid' }, '#f00')[0].attrs).toMatchObject({ fill: '#f00' })
    expect(drawingMarks({ ...rect, fill: 'solid' }, '#f00')[0].attrs).not.toHaveProperty('fillOpacity')
  })

  it('draws an arrow as a shaft that stops short of a filled head ending exactly at the tip', () => {
    const [shaft, head] = drawingMarks({ ...base, tool: 'arrow', points: [[4, 30], [96, 30]] }, '#00f')
    expect(shaft.tag).toBe('line')
    expect(shaft.attrs.x2 as number).toBeLessThan(96)
    expect(head.tag).toBe('polygon')
    expect(String(head.attrs.points).startsWith('96,30 ')).toBe(true)
    expect(head.attrs.fill).toBe('#00f')
  })

  it('draws nothing for a zero-length arrow or a drawing with no points', () => {
    expect(drawingMarks({ ...base, tool: 'arrow', points: [[5, 5], [5, 5]] }, '#000')).toEqual([])
    expect(drawingMarks({ ...base, tool: 'pencil', points: [] }, '#000')).toEqual([])
  })
})

describe('drawingHitMarks', () => {
  it('copies each mark\'s geometry as an invisible, wider stroke', () => {
    const drawing: Drawing = { tool: 'line', w: 100, h: 20, points: [[4, 10], [96, 10]], strokeWidth: 2, fill: 'none' }
    const [hit] = drawingHitMarks(drawing, '#f00')
    expect(hit).toMatchObject({ tag: 'line', attrs: { x1: 4, x2: 96, stroke: 'transparent', fill: 'none' } })
    expect(hit.attrs.strokeWidth as number).toBeGreaterThan(2)
  })

  it('lets a filled shape be grabbed inside, but not an unfilled one', () => {
    const rect: Drawing = { tool: 'rectangle', w: 100, h: 60, points: [[4, 4], [96, 56]], strokeWidth: 3, fill: 'none' }
    expect(drawingHitMarks(rect, '#f00')[0].attrs.fill).toBe('none')
    expect(drawingHitMarks({ ...rect, fill: 'tint' }, '#f00')[0].attrs.fill).toBe('transparent')
  })

  it('never carries the visible color or fill opacity', () => {
    const rect: Drawing = { tool: 'rectangle', w: 100, h: 60, points: [[4, 4], [96, 56]], strokeWidth: 3, fill: 'tint' }
    const attrs = drawingHitMarks(rect, '#ff0000')[0].attrs
    expect(JSON.stringify(attrs)).not.toContain('#ff0000')
    expect(attrs).not.toHaveProperty('fillOpacity')
  })
})
