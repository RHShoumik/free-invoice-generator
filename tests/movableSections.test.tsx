import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createSampleInvoice } from '../src/store/invoiceStore'
import { TEMPLATES } from '../src/templates/registry'
import { CanvasEditProvider } from '../src/templates/shared/CanvasEditContext'
import { SectionOffsetsProvider, SectionStylesProvider } from '../src/templates/shared/SectionOffsetsContext'
import type { SectionOffsets, SectionStyles } from '../src/types/invoice'

/** One design per layout (the first preset); Freeform Canvas positions blocks itself and is covered elsewhere. */
const FIXED_LAYOUTS = TEMPLATES.filter((t, i, all) => t.layoutId !== 'freeform' && all.findIndex((x) => x.layoutId === t.layoutId) === i)

const IDS = [
  'logo', 'from', 'to', 'items', 'totals', 'signature',
  'brand', 'title', 'number', 'meta', 'headline', 'worklog', 'footer', 'stamp', 'watermark',
]
const SHIFT = 'translate(10px, 20px)'
const OFFSETS: SectionOffsets = Object.fromEntries(IDS.map((id) => [id, { x: 10, y: 20 }]))
const STYLES: SectionStyles = Object.fromEntries(IDS.map((id) => [id, { color: '#dc2626', bold: true, italic: true, scale: 1.5 }]))

const noop = () => {}
const EDIT = {
  updateFrom: noop, updateTo: noop, updateField: noop, updateItem: noop, addItem: noop, removeItem: noop,
  setColumnLabel: noop, setCustomColumnLabel: noop, setItemCustomValue: noop, setLogo: noop,
} as never

function render(layout: (typeof FIXED_LAYOUTS)[number], offsets: SectionOffsets | null, styles: SectionStyles | null = null): HTMLElement {
  const invoice = createSampleInvoice(layout.id)
  invoice.sections.signature = true
  // Elegant Serif and Consultant Clean only draw the logo once one is uploaded.
  invoice.logoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
  const Component = layout.component
  const html = renderToStaticMarkup(
    <CanvasEditProvider value={EDIT}>
      <SectionOffsetsProvider value={offsets}>
        <SectionStylesProvider value={styles}>
          <Component invoice={invoice} />
        </SectionStylesProvider>
      </SectionOffsetsProvider>
    </CanvasEditProvider>,
  )
  const root = document.createElement('div')
  root.innerHTML = html
  return root
}

describe('draggable sections on the 20 fixed layouts', () => {
  it('covers 20 layouts', () => {
    expect(FIXED_LAYOUTS).toHaveLength(20)
  })

  describe.each(FIXED_LAYOUTS.map((t) => [t.layoutId, t] as const))('%s', (_name, layout) => {
    it('shifts every tagged section by exactly its offset', () => {
      const tagged = [...render(layout, OFFSETS).querySelectorAll<HTMLElement>('[data-section-id]')]
      expect(tagged.length).toBeGreaterThan(0)
      for (const el of tagged) {
        // A rotated stamp keeps its rotation after the shift; everything else is just the shift.
        expect(el.style.transform, `section "${el.dataset.sectionId}"`).toContain(SHIFT)
      }
    })

    it('exposes the logo, bill-to, totals, footer and business name', () => {
      const ids = new Set([...render(layout, OFFSETS).querySelectorAll<HTMLElement>('[data-section-id]')].map((e) => e.dataset.sectionId))
      for (const id of ['logo', 'to', 'totals', 'footer', 'brand']) expect(ids, id).toContain(id)
    })

    it('tags each section once and never nests one inside another (which would move it twice)', () => {
      const tagged = [...render(layout, OFFSETS).querySelectorAll<HTMLElement>('[data-section-id]')]
      const ids = tagged.map((e) => e.dataset.sectionId)
      expect(new Set(ids).size, `duplicate ids in ${ids.join(',')}`).toBe(ids.length)
      for (const el of tagged) {
        expect(el.parentElement?.closest('[data-section-id]'), `"${el.dataset.sectionId}" is nested`).toBeNull()
      }
    })

    it('applies color, bold, italic and size to every tagged section', () => {
      const root = render(layout, OFFSETS, STYLES)
      const tagged = [...root.querySelectorAll<HTMLElement>('[data-section-id]')]
      expect(tagged.length).toBeGreaterThan(0)
      for (const el of tagged) {
        const id = el.dataset.sectionId
        expect(el.hasAttribute('data-ov-color'), `${id} color`).toBe(true)
        expect(el.hasAttribute('data-ov-bold'), `${id} bold`).toBe(true)
        expect(el.hasAttribute('data-ov-italic'), `${id} italic`).toBe(true)
        expect(el.style.getPropertyValue('--ov-color'), `${id} color value`).toBe('#dc2626')
        // moved, then scaled — and never reflowing a neighbor, because it is only a transform
        expect(el.style.transform, id).toContain(`${SHIFT} scale(1.5)`)
      }
    })

    it('can be resized with no offset at all, and left alone when no style is set', () => {
      const scaledOnly = render(layout, {}, { to: { scale: 2 } }).querySelector<HTMLElement>('[data-section-id="to"]')!
      expect(scaledOnly.style.transform).toBe('scale(2)')
      const plain = render(layout, OFFSETS).querySelector<HTMLElement>('[data-section-id="to"]')!
      expect(plain.hasAttribute('data-ov-color')).toBe(false)
      expect(plain.style.transform).toBe(SHIFT)
    })

    it('is completely inert without the offsets context (design-picker thumbnails)', () => {
      const root = render(layout, null)
      expect(root.querySelectorAll('[data-section-id]')).toHaveLength(0)
      expect(root.innerHTML).not.toContain('translate(')
      // ...even if styles somehow arrive without offsets
      const withStyles = render(layout, null, STYLES)
      expect(withStyles.querySelectorAll('[data-section-id], [data-ov-color]')).toHaveLength(0)
    })
  })

  it('keeps the tilted stamps tilted when they are moved', () => {
    for (const layoutId of ['postcard', 'stamp-seal']) {
      const layout = FIXED_LAYOUTS.find((t) => t.layoutId === layoutId)!
      const stamp = render(layout, OFFSETS).querySelector<HTMLElement>('[data-section-id="stamp"]')!
      expect(stamp.style.transform, layoutId).toMatch(/^translate\(10px, 20px\) rotate\(-?\d+deg\)$/)
    }
  })
})
