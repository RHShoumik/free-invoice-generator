import { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DrawBar } from '../src/features/invoice-editor/DrawBar'
import { DrawLayer } from '../src/features/invoice-editor/DrawLayer'
import { DEFAULT_DRAW_SETTINGS } from '../src/features/invoice-editor/drawSettings'
import type { DrawSettings } from '../src/features/invoice-editor/drawSettings'
import { resolveStyleSelection } from '../src/features/invoice-editor/styleSelection'
import { createBlankInvoice, useInvoiceStore } from '../src/store/invoiceStore'
import { FreeformDrawingElement } from '../src/templates/21-freeform/blocks/FreeformDrawingElement'
import type { Drawing, FreeformElement } from '../src/types/invoice'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

const rectangle: Drawing = { tool: 'rectangle', w: 126, h: 66, points: [[3, 3], [123, 63]], strokeWidth: 4, fill: 'none' }
const drawn = (over: Partial<FreeformElement> = {}) => ({ id: 'd1', kind: 'drawing', x: 40, y: 60, width: 126, drawing: rectangle, style: { color: '#dc2626' }, ...over }) as Extract<FreeformElement, { kind: 'drawing' }>

describe('adding a drawing', () => {
  beforeEach(() => useInvoiceStore.setState({ invoice: createBlankInvoice('classic') }))
  const drawings = () => useInvoiceStore.getState().invoice.freeformLayout.filter((el) => el.kind === 'drawing')

  it('puts it at exactly the rect it was drawn in, with its color, and returns the id', () => {
    const id = useInvoiceStore.getState().addDrawing({ x: 97, y: 197, width: 126 }, rectangle, '#2563eb')
    expect(drawings()).toEqual([{ id, kind: 'drawing', x: 97, y: 197, width: 126, drawing: rectangle, style: { color: '#2563eb' } }])
  })

  it('is one undo step each, and structural, so two strokes in a row are not merged', () => {
    useInvoiceStore.getState().startNewInvoice('classic')
    const { addDrawing, undo, redo } = useInvoiceStore.getState()
    addDrawing({ x: 0, y: 0, width: 126 }, rectangle, '#000')
    addDrawing({ x: 50, y: 50, width: 126 }, rectangle, '#000')
    expect(drawings()).toHaveLength(2)
    undo()
    expect(drawings()).toHaveLength(1)
    undo()
    expect(drawings()).toHaveLength(0)
    redo()
    expect(drawings()).toHaveLength(1)
  })

  it('does not move where the next click-added element lands', () => {
    const { addDrawing, addFreeformElement } = useInvoiceStore.getState()
    addDrawing({ x: 0, y: 0, width: 126 }, rectangle, '#000')
    addFreeformElement('text')
    const text = useInvoiceStore.getState().invoice.freeformLayout.find((el) => el.kind === 'text')
    expect(text).toMatchObject({ x: 48, y: 160 })
  })

  it('can be restyled and have its thickness changed, like any element', () => {
    const id = useInvoiceStore.getState().addDrawing({ x: 0, y: 0, width: 126 }, rectangle, '#000')
    useInvoiceStore.getState().updateFreeformElementStyle(id, { color: '#16a34a', opacity: 0.5 })
    useInvoiceStore.getState().updateFreeformElementContent(id, { drawing: { ...rectangle, strokeWidth: 8, fill: 'tint' } })
    expect(drawings()[0]).toMatchObject({ style: { color: '#16a34a', opacity: 0.5 }, drawing: { strokeWidth: 8, fill: 'tint' } })
  })
})

describe('the style pill for a selected drawing', () => {
  const base = createBlankInvoice('classic')
  const layout = [...base.freeformLayout, drawn()]
  const input = { selectedId: 'd1', layoutId: 'classic', isFreeform: false, freeformLayout: layout, sectionStyles: {} }

  it('offers color, opacity and the drawing\'s own settings — and no size or text style', () => {
    expect(resolveStyleSelection(input)).toMatchObject({ label: 'Drawing', target: 'element', sizing: 'none', color: true, textStyle: false, opacity: true, drawing: rectangle })
  })

  it('is selectable on Freeform Canvas too', () => {
    expect(resolveStyleSelection({ ...input, layoutId: 'freeform', isFreeform: true })?.drawing).toEqual(rectangle)
  })

  it('has no drawing controls for anything else', () => {
    expect(resolveStyleSelection({ ...input, selectedId: 'to' })?.drawing).toBeNull()
  })
})

describe('FreeformDrawingElement', () => {
  it('draws the shape in its color, in a box that scales with the element\'s width', () => {
    const html = renderToStaticMarkup(<FreeformDrawingElement element={drawn()} />)
    expect(html).toContain('viewBox="0 0 126 66"')
    expect(html).toContain('width="100%"')
    expect(html).toContain('stroke="#dc2626"')
    expect(html).toContain('pointer-events:none')
  })

  it('applies the element\'s opacity', () => {
    expect(renderToStaticMarkup(<FreeformDrawingElement element={drawn({ style: { color: '#000', opacity: 0.4 } })} />)).toContain('opacity:0.4')
  })

  it('falls back to the default ink when it has no color', () => {
    expect(renderToStaticMarkup(<FreeformDrawingElement element={drawn({ style: undefined })} />)).toContain('stroke="#0f172a"')
  })

  it('has no grab outline outside the editor (a thumbnail or export)', () => {
    expect(renderToStaticMarkup(<FreeformDrawingElement element={drawn()} />)).not.toContain('data-export-hide')
  })
})

describe('draw mode UI', () => {
  let root: Root | null = null
  let container: HTMLElement | null = null
  afterEach(() => {
    act(() => root?.unmount())
    container?.remove()
    root = container = null
  })
  function mount(node: React.ReactNode) {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => root!.render(node))
    return container
  }

  describe('DrawBar', () => {
    const settings: DrawSettings = { ...DEFAULT_DRAW_SETTINGS }
    const q = (label: string) => container!.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!

    it('lists the five tools, marks the current one, and switches tool', () => {
      const onChange = vi.fn()
      mount(<DrawBar settings={settings} onChange={onChange} onDone={vi.fn()} />)
      for (const tool of ['Pencil', 'Line', 'Arrow', 'Rectangle', 'Ellipse']) expect(q(tool)).not.toBeNull()
      expect(q('Pencil').getAttribute('aria-pressed')).toBe('true')
      act(() => q('Arrow').click())
      expect(onChange).toHaveBeenCalledWith({ tool: 'arrow' })
    })

    it('offers a fill only for rectangles and ellipses', () => {
      mount(<DrawBar settings={{ ...settings, tool: 'line' }} onChange={vi.fn()} onDone={vi.fn()} />)
      expect(container!.querySelector('[aria-label="Fill"]')).toBeNull()
      act(() => root!.render(<DrawBar settings={{ ...settings, tool: 'ellipse' }} onChange={vi.fn()} onDone={vi.fn()} />))
      expect(container!.querySelector('[aria-label="Fill"]')).not.toBeNull()
    })

    it('changes thickness within its limits and picks colors', () => {
      const onChange = vi.fn()
      mount(<DrawBar settings={{ ...settings, strokeWidth: 16 }} onChange={onChange} onDone={vi.fn()} />)
      expect(q('Thicker line').disabled).toBe(true)
      act(() => q('Thinner line').click())
      expect(onChange).toHaveBeenCalledWith({ strokeWidth: 15 })
      act(() => q('Use #dc2626').click())
      expect(onChange).toHaveBeenCalledWith({ color: '#dc2626' })
    })

    it('finishes with Done', () => {
      const onDone = vi.fn()
      mount(<DrawBar settings={settings} onChange={vi.fn()} onDone={onDone} />)
      act(() => [...container!.querySelectorAll('button')].find((b) => b.textContent?.includes('Done'))!.click())
      expect(onDone).toHaveBeenCalled()
    })
  })

  describe('DrawLayer', () => {
    beforeEach(() => useInvoiceStore.setState({ invoice: createBlankInvoice('classic') }))
    const drawings = () => useInvoiceStore.getState().invoice.freeformLayout.filter((el) => el.kind === 'drawing')

    // jsdom has no layout: say the page is 794px wide at scale 1, starting at the viewport's origin.
    function mountLayer(settings: DrawSettings) {
      const el = mount(<DrawLayer settings={settings} />)
      const layer = el.querySelector<HTMLElement>('[data-draw-layer]')!
      layer.getBoundingClientRect = () => ({ left: 0, top: 0, width: 794, height: 1123, right: 794, bottom: 1123, x: 0, y: 0, toJSON() {} }) as DOMRect
      return layer
    }
    const fire = (layer: HTMLElement, type: string, x: number, y: number, init: MouseEventInit = {}) =>
      act(() => {
        layer.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0, ...init }))
      })

    it('turns a drag into a drawing in the chosen color, thickness and fill', () => {
      const layer = mountLayer({ tool: 'rectangle', color: '#2563eb', strokeWidth: 4, fill: 'tint' })
      fire(layer, 'pointerdown', 100, 200)
      fire(layer, 'pointermove', 160, 230)
      fire(layer, 'pointermove', 220, 260)
      fire(layer, 'pointerup', 220, 260)
      expect(drawings()).toHaveLength(1)
      expect(drawings()[0]).toMatchObject({ x: 97, y: 197, width: 126, style: { color: '#2563eb' }, drawing: { tool: 'rectangle', strokeWidth: 4, fill: 'tint' } })
    })

    it('shows the shape while dragging, and draws nothing at all from a plain click', () => {
      const layer = mountLayer({ ...DEFAULT_DRAW_SETTINGS, tool: 'ellipse' })
      fire(layer, 'pointerdown', 100, 100)
      fire(layer, 'pointermove', 200, 180)
      expect(layer.querySelector('svg ellipse')).not.toBeNull()
      fire(layer, 'pointerup', 200, 180)
      expect(layer.querySelector('svg')).toBeNull()

      fire(layer, 'pointerdown', 300, 300)
      fire(layer, 'pointerup', 300, 300)
      expect(drawings()).toHaveLength(1)
    })

    it('records a pencil stroke as a simplified path', () => {
      const layer = mountLayer({ ...DEFAULT_DRAW_SETTINGS, tool: 'pencil' })
      fire(layer, 'pointerdown', 50, 50)
      for (let i = 1; i <= 40; i++) fire(layer, 'pointermove', 50 + i * 4, 50)
      fire(layer, 'pointerup', 210, 50)
      expect(drawings()).toHaveLength(1)
      const d = (drawings()[0] as Extract<FreeformElement, { kind: 'drawing' }>).drawing
      expect(d.tool).toBe('pencil')
      expect(d.points.length).toBeLessThan(5)
    })

    it('squares a rectangle when Shift is held', () => {
      const layer = mountLayer({ ...DEFAULT_DRAW_SETTINGS, tool: 'rectangle' })
      fire(layer, 'pointerdown', 100, 100)
      fire(layer, 'pointermove', 220, 130, { shiftKey: true })
      fire(layer, 'pointerup', 220, 130, { shiftKey: true })
      const [a, b] = (drawings()[0] as Extract<FreeformElement, { kind: 'drawing' }>).drawing.points
      expect(Math.abs(b[0] - a[0])).toBe(Math.abs(b[1] - a[1]))
    })

    it('keeps a stroke on the page when the pointer leaves it', () => {
      const layer = mountLayer({ ...DEFAULT_DRAW_SETTINGS, tool: 'line' })
      fire(layer, 'pointerdown', 700, 100)
      fire(layer, 'pointermove', 900, 100)
      fire(layer, 'pointerup', 900, 100)
      const el = drawings()[0] as Extract<FreeformElement, { kind: 'drawing' }>
      expect(el.x + el.width).toBeLessThanOrEqual(794 + 8)
    })

    it('abandons a gesture that is cancelled', () => {
      const layer = mountLayer({ ...DEFAULT_DRAW_SETTINGS, tool: 'line' })
      fire(layer, 'pointerdown', 100, 100)
      fire(layer, 'pointermove', 200, 200)
      fire(layer, 'pointercancel', 200, 200)
      expect(drawings()).toHaveLength(0)
      expect(layer.querySelector('svg')).toBeNull()
    })

    it('ignores a press that is not the primary button', () => {
      const layer = mountLayer({ ...DEFAULT_DRAW_SETTINGS, tool: 'line' })
      fire(layer, 'pointerdown', 100, 100, { button: 2 })
      fire(layer, 'pointermove', 200, 200)
      fire(layer, 'pointerup', 200, 200)
      expect(drawings()).toHaveLength(0)
    })

    it('is hidden from exports', () => {
      expect(mountLayer(DEFAULT_DRAW_SETTINGS).getAttribute('data-export-hide')).toBe('true')
    })
  })
})
