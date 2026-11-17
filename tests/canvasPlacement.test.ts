import { beforeEach, describe, expect, it } from 'vitest'
import { createBlankInvoice, useInvoiceStore } from '../src/store/invoiceStore'
import type { FreeformElement } from '../src/types/invoice'

function freeElements(): FreeformElement[] {
  return useInvoiceStore.getState().invoice.freeformLayout.filter((el) => el.kind === 'text')
}

describe('section offsets', () => {
  beforeEach(() => useInvoiceStore.setState({ invoice: createBlankInvoice('classic') }))

  it('stores an offset per section id', () => {
    useInvoiceStore.getState().setSectionOffset('to', { x: -40, y: 120 })
    expect(useInvoiceStore.getState().invoice.sectionOffsets).toEqual({ to: { x: -40, y: 120 } })
  })

  it('drops an entry when it is moved back to the origin or cleared', () => {
    const { setSectionOffset } = useInvoiceStore.getState()
    setSectionOffset('to', { x: 10, y: 10 })
    setSectionOffset('to', { x: 0, y: 0 })
    expect(useInvoiceStore.getState().invoice.sectionOffsets).toEqual({})

    setSectionOffset('items', { x: 5, y: 0 })
    setSectionOffset('items', null)
    expect(useInvoiceStore.getState().invoice.sectionOffsets).toEqual({})
  })

  it('resetSectionOffsets clears every section at once', () => {
    const { setSectionOffset, resetSectionOffsets } = useInvoiceStore.getState()
    setSectionOffset('to', { x: 1, y: 2 })
    setSectionOffset('totals', { x: 3, y: 4 })
    resetSectionOffsets()
    expect(useInvoiceStore.getState().invoice.sectionOffsets).toEqual({})
  })

  it('does not touch freeformLayout', () => {
    const before = useInvoiceStore.getState().invoice.freeformLayout
    useInvoiceStore.getState().setSectionOffset('from', { x: 9, y: 9 })
    expect(useInvoiceStore.getState().invoice.freeformLayout).toBe(before)
  })
})

describe('adding an element to the canvas', () => {
  beforeEach(() => useInvoiceStore.setState({ invoice: createBlankInvoice('classic') }))

  it('centers a dropped element on the cursor and snaps it to the 8px grid', () => {
    useInvoiceStore.getState().addFreeformElement('text', { x: 397, y: 641 })
    const [el] = freeElements()
    // 397 - 150 = 247 -> 248; 641 - 16 = 625 -> 624
    expect(el).toMatchObject({ x: 248, y: 624, width: 300 })
  })

  it('keeps a dropped element on the page at the left and right edges', () => {
    const { addFreeformElement } = useInvoiceStore.getState()
    addFreeformElement('text', { x: 5, y: -50 })
    addFreeformElement('text', { x: 790, y: 100 })
    const [left, right] = freeElements()
    expect(left).toMatchObject({ x: 0, y: 0 })
    expect(right.x).toBe(794 - 300)
  })

  it('on a fixed layout, click-to-add cascades from under the header rather than below the default sections', () => {
    const { addFreeformElement } = useInvoiceStore.getState()
    addFreeformElement('text')
    addFreeformElement('text')
    const [first, second] = freeElements()
    expect(first).toMatchObject({ x: 48, y: 160 })
    expect(second).toMatchObject({ x: 72, y: 200 })
  })

  it('on Freeform Canvas, click-to-add still goes below the lowest existing element', () => {
    useInvoiceStore.setState({ invoice: createBlankInvoice('freeform') })
    useInvoiceStore.getState().addFreeformElement('text')
    const [el] = freeElements()
    // default layout's lowest element (signature) is at y: 950
    expect(el).toMatchObject({ x: 48, y: 1010 })
  })
})

describe('section styles', () => {
  beforeEach(() => useInvoiceStore.setState({ invoice: createBlankInvoice('classic') }))
  const styles = () => useInvoiceStore.getState().invoice.sectionStyles

  it('merges into what is already set', () => {
    const { updateSectionStyle } = useInvoiceStore.getState()
    updateSectionStyle('to', { color: '#f00' })
    updateSectionStyle('to', { bold: true })
    expect(styles()).toEqual({ to: { color: '#f00', bold: true } })
  })

  it('removes a property patched to undefined, and the whole entry once nothing is left', () => {
    const { updateSectionStyle } = useInvoiceStore.getState()
    updateSectionStyle('to', { color: '#f00', scale: 1.5 })
    updateSectionStyle('to', { scale: undefined })
    expect(styles()).toEqual({ to: { color: '#f00' } })
    updateSectionStyle('to', { color: undefined })
    expect(styles()).toEqual({})
  })

  it('does not touch the other sections or the canvas elements', () => {
    const { updateSectionStyle } = useInvoiceStore.getState()
    updateSectionStyle('to', { color: '#f00' })
    const layout = useInvoiceStore.getState().invoice.freeformLayout
    updateSectionStyle('totals', { bold: true })
    expect(styles().to).toEqual({ color: '#f00' })
    expect(useInvoiceStore.getState().invoice.freeformLayout).toBe(layout)
  })
})

describe('whole-box styling of a rich text box', () => {
  const html = 'a <span style="color:#16a34a;font-weight:bold;font-style:italic">word</span> b'

  beforeEach(() => {
    const invoice = createBlankInvoice('classic')
    invoice.freeformLayout = [{ id: 't', kind: 'text', x: 0, y: 0, width: 300, text: 'a word b', html }]
    useInvoiceStore.setState({ invoice })
  })
  const box = () => useInvoiceStore.getState().invoice.freeformLayout[0] as Extract<FreeformElement, { kind: 'text' }>

  it('coloring the whole box clears the colors of individually colored words, and nothing else', () => {
    useInvoiceStore.getState().updateFreeformElementStyle('t', { color: '#2563eb' })
    expect(box().style).toEqual({ color: '#2563eb' })
    expect(box().html).toBe('a <span style="font-weight:bold;font-style:italic">word</span> b')
    expect(box().text).toBe('a word b')
  })

  it('making the whole box bold or italic clears just that from the words', () => {
    useInvoiceStore.getState().updateFreeformElementStyle('t', { bold: true })
    expect(box().html).toBe('a <span style="color:#16a34a;font-style:italic">word</span> b')
    useInvoiceStore.getState().updateFreeformElementStyle('t', { italic: true })
    expect(box().html).toBe('a <span style="color:#16a34a">word</span> b')
  })

  it('Reset (every property cleared) removes all per-word formatting too', () => {
    useInvoiceStore.getState().updateFreeformElementStyle('t', {
      fontSize: undefined, scale: undefined, color: undefined, bold: undefined, italic: undefined,
    })
    expect(box().html).toBe('a word b')
  })

  it('leaves the words alone when the change is not a color, bold or italic (e.g. the size)', () => {
    useInvoiceStore.getState().updateFreeformElementStyle('t', { fontSize: 20 })
    expect(box().html).toBe(html)
    expect(box().style).toEqual({ fontSize: 20 })
  })

  it('is one undo step, restoring both the box color and the words', () => {
    useInvoiceStore.getState().startNewInvoice('classic') // fresh history
    const invoice = createBlankInvoice('classic')
    invoice.freeformLayout = [{ id: 't', kind: 'text', x: 0, y: 0, width: 300, text: 'a word b', html }]
    useInvoiceStore.setState({ invoice })
    useInvoiceStore.getState().updateFreeformElementStyle('t', { color: '#2563eb' })
    useInvoiceStore.getState().undo()
    expect(box().html).toBe(html)
    expect(box().style).toBeUndefined()
  })

  it('does nothing to the html of a box that predates rich text (no html at all)', () => {
    const invoice = createBlankInvoice('classic')
    invoice.freeformLayout = [{ id: 't', kind: 'text', x: 0, y: 0, width: 300, text: 'old box' }]
    useInvoiceStore.setState({ invoice })
    useInvoiceStore.getState().updateFreeformElementStyle('t', { color: '#2563eb' })
    expect(box().html).toBeUndefined()
    expect(box().text).toBe('old box')
  })
})
