import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COALESCE_MS, HISTORY_LIMIT, changeSignature } from '../src/store/history'
import { createBlankInvoice, createSampleInvoice, useInvoiceStore } from '../src/store/invoiceStore'

const store = () => useInvoiceStore.getState()
const invoice = () => store().invoice

describe('changeSignature', () => {
  it('names the field that changed', () => {
    const a = createSampleInvoice('classic')
    expect(changeSignature(a, { ...a, from: { ...a.from, name: 'X' } })).toBe('from.name')
    expect(changeSignature(a, { ...a, from: { ...a.from, name: 'X', email: 'y' } })).toBe('from.email|from.name')
    expect(changeSignature(a, { ...a, taxRatePct: 7 })).toBe('taxRatePct')
    expect(changeSignature(a, { ...a, theme: { ...a.theme, accentColor: '#fff' } })).toBe('theme.accentColor')
  })

  it('tells line items apart and flags add/remove/reorder as structural', () => {
    const a = createSampleInvoice('classic')
    const [first, ...rest] = a.items
    expect(changeSignature(a, { ...a, items: [{ ...first, description: 'new' }, ...rest] })).toBe(`items:${first.id}.description`)
    expect(changeSignature(a, { ...a, items: [...a.items, { ...first, id: 'extra' }] })).toBe('items:structure')
    expect(changeSignature(a, { ...a, items: [...a.items].reverse() })).toBe('items:structure')
  })

  it('tells a canvas element\'s style properties apart', () => {
    const a = { ...createBlankInvoice('classic') }
    a.freeformLayout = [{ id: 'el1', kind: 'text', x: 0, y: 0, width: 300, text: '' }]
    const withColor = { ...a, freeformLayout: [{ ...a.freeformLayout[0], style: { color: '#f00' } }] }
    const withSize = { ...a, freeformLayout: [{ ...a.freeformLayout[0], style: { fontSize: 20 } }] }
    expect(changeSignature(a, withColor)).toBe('free:el1.style.color')
    expect(changeSignature(a, withSize)).toBe('free:el1.style.fontSize')
    expect(changeSignature(a, { ...a, freeformLayout: [] })).toBe('free:structure')
  })

  it('names the section style property that changed', () => {
    const a = createBlankInvoice('classic')
    expect(changeSignature(a, { ...a, sectionStyles: { to: { color: '#f00' } } })).toBe('sectionStyle:to.color')
    const b = { ...a, sectionStyles: { to: { color: '#f00' } } }
    expect(changeSignature(b, { ...b, sectionStyles: { to: { color: '#f00', scale: 1.2 } } })).toBe('sectionStyle:to.scale')
  })

  it('names the section that was moved', () => {
    const a = createBlankInvoice('classic')
    expect(changeSignature(a, { ...a, sectionOffsets: { to: { x: 1, y: 2 } } })).toBe('offset:to')
  })
})

describe('undo / redo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    store().startNewInvoice('classic', true) // also clears history and the "last edit" memory
  })
  afterEach(() => vi.useRealTimers())

  const later = (ms: number) => vi.setSystemTime(Date.now() + ms)

  it('starts with nothing to undo or redo, and undo/redo are no-ops', () => {
    const before = invoice()
    store().undo()
    store().redo()
    expect(invoice()).toBe(before)
    expect(store().past).toHaveLength(0)
    expect(store().future).toHaveLength(0)
  })

  it('undoes and redoes an edit', () => {
    const original = invoice().from.name
    store().updateFrom({ name: 'Acme' })
    expect(invoice().from.name).toBe('Acme')

    store().undo()
    expect(invoice().from.name).toBe(original)
    expect(store().future).toHaveLength(1)

    store().redo()
    expect(invoice().from.name).toBe('Acme')
    expect(store().future).toHaveLength(0)
  })

  it('treats typing into one field as a single step', () => {
    const original = invoice().from.name
    for (const text of ['N', 'No', 'Nor', 'Nort', 'North']) {
      store().updateFrom({ name: text })
      later(150)
    }
    expect(store().past).toHaveLength(1)
    store().undo()
    expect(invoice().from.name).toBe(original)
  })

  it('starts a new step after a pause, or when a different field changes', () => {
    store().updateFrom({ name: 'A' })
    later(COALESCE_MS + 1)
    store().updateFrom({ name: 'AB' })
    expect(store().past).toHaveLength(2)

    store().updateFrom({ email: 'a@b.c' }) // different field, immediately after
    expect(store().past).toHaveLength(3)
  })

  it('never merges structural changes (three quick adds are three steps)', () => {
    store().addItem()
    store().addItem()
    store().addItem()
    expect(store().past).toHaveLength(3)
    store().undo()
    expect(invoice().items).toHaveLength(3 + 2)
  })

  it('discards the redo branch when you edit after undoing', () => {
    store().updateFrom({ name: 'One' })
    later(COALESCE_MS + 1)
    store().updateFrom({ name: 'Two' })
    store().undo()
    expect(store().future).toHaveLength(1)

    later(COALESCE_MS + 1)
    store().updateFrom({ name: 'Three' })
    expect(store().future).toHaveLength(0)
  })

  it('does not merge a fresh edit into the step an undo just stepped back over', () => {
    const original = invoice().from.name
    store().updateFrom({ name: 'A' })
    store().undo()
    store().updateFrom({ name: 'B' }) // same field, well inside the window, but after an undo
    expect(store().past).toHaveLength(1)
    store().undo()
    expect(invoice().from.name).toBe(original)
  })

  it('covers canvas edits: add, restyle, move, delete', () => {
    store().addFreeformElement('text', { x: 300, y: 300 })
    const id = invoice().freeformLayout.find((el) => el.kind === 'text')!.id
    later(COALESCE_MS + 1)
    store().updateFreeformElementStyle(id, { color: '#dc2626' })
    later(COALESCE_MS + 1)
    store().setSectionOffset('to', { x: 10, y: 20 })
    later(COALESCE_MS + 1)
    store().removeFreeformElement(id)

    store().undo() // delete
    expect(invoice().freeformLayout.some((el) => el.id === id)).toBe(true)
    store().undo() // move
    expect(invoice().sectionOffsets).toEqual({})
    store().undo() // restyle
    expect(invoice().freeformLayout.find((el) => el.id === id)?.style).toBeUndefined()
    store().undo() // add
    expect(invoice().freeformLayout.some((el) => el.id === id)).toBe(false)
  })

  it('is undoable when switching design', () => {
    store().setTemplate('dark-mode')
    store().undo()
    expect(invoice().templateId).toBe('classic')
  })

  it('keeps at most HISTORY_LIMIT steps', () => {
    for (let i = 0; i < HISTORY_LIMIT + 25; i++) {
      store().addItem() // structural, so never merged
    }
    expect(store().past).toHaveLength(HISTORY_LIMIT)
  })

  it('starting a new invoice clears the history', () => {
    store().updateFrom({ name: 'Edited' })
    store().undo()
    expect(store().future).toHaveLength(1)
    store().startNewInvoice('classic', true)
    expect(store().past).toHaveLength(0)
    expect(store().future).toHaveLength(0)
  })

  it('undoes a section restyle, and a run of size taps is one step', () => {
    store().updateSectionStyle('to', { scale: 1.1 })
    later(100)
    store().updateSectionStyle('to', { scale: 1.2 })
    later(100)
    store().updateSectionStyle('to', { scale: 1.3 })
    expect(store().past).toHaveLength(1)
    store().undo()
    expect(invoice().sectionStyles).toEqual({})
  })

  it('resetting the watermark restores its text and look in one undo step', () => {
    store().updateField('watermarkText', 'PAID')
    later(COALESCE_MS + 1)
    store().updateField('watermarkImage', 'data:image/png;base64,AAAA')
    later(COALESCE_MS + 1)
    store().updateSectionStyle('watermark', { color: '#dc2626', opacity: 0.2 })
    later(COALESCE_MS + 1)
    store().resetWatermark()
    expect(invoice().watermarkText).toBeUndefined()
    expect(invoice().watermarkImage).toBeUndefined()
    expect(invoice().sectionStyles.watermark).toBeUndefined()

    store().undo()
    expect(invoice().watermarkText).toBe('PAID')
    expect(invoice().watermarkImage).toBe('data:image/png;base64,AAAA')
    expect(invoice().sectionStyles.watermark).toEqual({ color: '#dc2626', opacity: 0.2 })
  })

  it('a watermark text edit is typed as one step', () => {
    for (const t of ['P', 'PA', 'PAI', 'PAID']) {
      store().updateField('watermarkText', t)
      later(120)
    }
    expect(store().past).toHaveLength(1)
    store().undo()
    expect(invoice().watermarkText).toBeUndefined()
  })

  it('does not record anything for an action that changes nothing', () => {
    store().duplicateFreeformElement('does-not-exist')
    expect(store().past).toHaveLength(0)
  })
})
