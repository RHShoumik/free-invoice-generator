import { describe, expect, it } from 'vitest'
import { resolveStyleSelection } from '../src/features/invoice-editor/styleSelection'
import { createBlankInvoice } from '../src/store/invoiceStore'
import type { FreeformElement } from '../src/types/invoice'

const free = (kind: 'text' | 'table' | 'image' | 'divider', id = 'el1'): FreeformElement =>
  (kind === 'text'
    ? { id, kind, x: 0, y: 0, width: 300, text: '' }
    : kind === 'table'
      ? { id, kind, x: 0, y: 0, width: 300, rows: [] }
      : kind === 'image'
        ? { id, kind, x: 0, y: 0, width: 300, dataUrl: null }
        : { id, kind, x: 0, y: 0, width: 300 }) as FreeformElement

const base = createBlankInvoice('classic')
const input = (over: Partial<Parameters<typeof resolveStyleSelection>[0]>) => ({
  selectedId: null,
  layoutId: 'classic',
  isFreeform: false,
  freeformLayout: base.freeformLayout,
  sectionStyles: {},
  ...over,
})

describe('resolveStyleSelection', () => {
  it('has nothing to show when nothing is selected', () => {
    expect(resolveStyleSelection(input({}))).toBeNull()
  })

  it('gives added text and tables a real font size', () => {
    const layout = [free('text', 't'), free('table', 'tb')]
    expect(resolveStyleSelection(input({ selectedId: 't', freeformLayout: layout }))).toMatchObject({ sizing: 'font', color: true, textStyle: true, target: 'element' })
    expect(resolveStyleSelection(input({ selectedId: 'tb', freeformLayout: layout }))?.defaultFontSize).toBe(13)
  })

  it('gives a divider a color only, and an added image nothing', () => {
    const layout = [free('divider', 'd'), free('image', 'i')]
    expect(resolveStyleSelection(input({ selectedId: 'd', freeformLayout: layout }))).toMatchObject({ sizing: 'none', color: true, textStyle: false })
    expect(resolveStyleSelection(input({ selectedId: 'i', freeformLayout: layout }))).toBeNull()
  })

  it('treats a built-in section on a fixed layout as a section — not the bound Freeform entry that shares its id', () => {
    // `freeformLayout` carries a bound `to` entry on every invoice; on a fixed layout that id means the Bill To section.
    const selection = resolveStyleSelection(input({ selectedId: 'to', sectionStyles: { to: { color: '#f00', scale: 1.2 } } }))
    expect(selection).toMatchObject({ label: 'Bill to', target: 'section', sizing: 'scale', color: true, textStyle: true })
    expect(selection?.style).toEqual({ color: '#f00', scale: 1.2 })
  })

  it('covers a design\'s own blocks, not just the shared sections', () => {
    for (const id of ['brand', 'title', 'number', 'meta', 'footer', 'headline', 'worklog', 'stamp']) {
      expect(resolveStyleSelection(input({ selectedId: id })), id).toMatchObject({ target: 'section', sizing: 'scale' })
    }
  })

  it('resizes a logo but does not recolor or embolden it', () => {
    expect(resolveStyleSelection(input({ selectedId: 'logo' }))).toMatchObject({ sizing: 'scale', color: false, textStyle: false })
  })

  it('still resolves an added element on a fixed layout as an element', () => {
    const layout = [...base.freeformLayout, free('text', 'added')]
    expect(resolveStyleSelection(input({ selectedId: 'added', freeformLayout: layout }))).toMatchObject({ target: 'element', sizing: 'font' })
  })

  it('on Freeform Canvas, any block is stylable and stored on its element', () => {
    const items = resolveStyleSelection(input({ selectedId: 'items', isFreeform: true }))
    expect(items).toMatchObject({ label: 'Line items', target: 'element', sizing: 'scale', color: true, textStyle: true })
    expect(resolveStyleSelection(input({ selectedId: 'logo', isFreeform: true }))).toMatchObject({ sizing: 'scale', color: false })
  })

  it('offers the watermark an opacity control, at its design default, and nothing else does', () => {
    const watermark = resolveStyleSelection(input({ selectedId: 'watermark', layoutId: 'watermark' }))
    expect(watermark).toMatchObject({ label: 'Watermark', target: 'section', sizing: 'scale', color: true, opacity: true, defaultOpacity: 0.07 })
    for (const id of ['to', 'brand', 'logo', 'footer']) expect(resolveStyleSelection(input({ selectedId: id }))?.opacity, id).toBe(false)
  })

  it('an image watermark can be resized and faded but not recolored or emboldened, and defaults a bit stronger', () => {
    const image = resolveStyleSelection(input({ selectedId: 'watermark', layoutId: 'watermark', watermarkIsImage: true }))
    expect(image).toMatchObject({ sizing: 'scale', opacity: true, color: false, textStyle: false })
    expect(image?.defaultOpacity).toBeGreaterThan(0.07)
    const text = resolveStyleSelection(input({ selectedId: 'watermark', layoutId: 'watermark', watermarkIsImage: false }))
    expect(text).toMatchObject({ color: true, textStyle: true, defaultOpacity: 0.07 })
  })

  it('ignores a leftover watermark selection once the design is no longer the Watermark design', () => {
    expect(resolveStyleSelection(input({ selectedId: 'watermark', layoutId: 'classic' }))).toBeNull()
    expect(resolveStyleSelection(input({ selectedId: 'watermark', layoutId: 'freeform', isFreeform: true }))).toBeNull()
  })

  it('ignores an id that is not on the page', () => {
    expect(resolveStyleSelection(input({ selectedId: 'gone' }))).toBeNull()
    expect(resolveStyleSelection(input({ selectedId: 'gone', isFreeform: true }))).toBeNull()
  })
})
