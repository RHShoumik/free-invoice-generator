import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COALESCE_MS, changeSignature } from '../src/store/history'
import { createSampleInvoice, useInvoiceStore } from '../src/store/invoiceStore'
import { LABEL_TITLES, resolveLabel } from '../src/lib/labels'
import type { LabelKey } from '../src/types/invoice'

const store = () => useInvoiceStore.getState()
const invoice = () => store().invoice

const ALL_KEYS: LabelKey[] = [
  'title',
  'invoiceNumber',
  'issueDate',
  'dueDate',
  'from',
  'billTo',
  'subtotal',
  'discount',
  'tax',
  'total',
  'paymentTerms',
  'bankDetails',
  'signatureBusiness',
  'signatureClient',
]

describe('resolveLabel', () => {
  it('uses the layout\'s own wording until the user sets one', () => {
    expect(resolveLabel(undefined, 'issueDate', 'Issue Date')).toBe('Issue Date')
    expect(resolveLabel({}, 'issueDate', 'Issue Date')).toBe('Issue Date')
    expect(resolveLabel({ dueDate: 'Pay by' }, 'issueDate', 'Issued')).toBe('Issued')
  })

  it('uses the user\'s wording, including an empty string (a label they chose to hide)', () => {
    expect(resolveLabel({ issueDate: 'Date issued' }, 'issueDate', 'Issue Date')).toBe('Date issued')
    expect(resolveLabel({ issueDate: '' }, 'issueDate', 'Issue Date')).toBe('')
  })

  it('has a drawer heading for every key', () => {
    for (const key of ALL_KEYS) expect(LABEL_TITLES[key]).toBeTruthy()
    expect(Object.keys(LABEL_TITLES).sort()).toEqual([...ALL_KEYS].sort())
  })
})

describe('setLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    store().startNewInvoice('classic', true)
  })
  afterEach(() => vi.useRealTimers())

  const later = (ms: number) => vi.setSystemTime(Date.now() + ms)

  it('starts with no labels', () => {
    expect(invoice().labels).toBeUndefined()
  })

  it('stores the wording under its key, and undefined puts the layout\'s wording back', () => {
    store().setLabel('issueDate', 'Date issued')
    expect(invoice().labels).toEqual({ issueDate: 'Date issued' })
    store().setLabel('dueDate', 'Pay by')
    expect(invoice().labels).toEqual({ issueDate: 'Date issued', dueDate: 'Pay by' })
    store().setLabel('issueDate', undefined)
    expect(invoice().labels).toEqual({ dueDate: 'Pay by' })
    expect('issueDate' in (invoice().labels ?? {})).toBe(false)
  })

  it('keeps an empty string (hidden label) as an override', () => {
    store().setLabel('title', '')
    expect(invoice().labels).toEqual({ title: '' })
  })

  it('is one undo step while typing, a new step after a pause, and undo returns the layout\'s own wording', () => {
    store().setLabel('issueDate', 'D')
    later(COALESCE_MS - 100)
    store().setLabel('issueDate', 'Da')
    later(COALESCE_MS * 2)
    store().setLabel('issueDate', 'Date')
    expect(invoice().labels?.issueDate).toBe('Date')

    store().undo() // the pause started a new step
    expect(invoice().labels?.issueDate).toBe('Da')
    store().undo() // "D" and "Da" were one step
    expect(invoice().labels).toBeUndefined()
    store().redo()
    expect(invoice().labels?.issueDate).toBe('Da')
  })

  it('does not merge two different labels into one undo step', () => {
    store().setLabel('issueDate', 'A')
    store().setLabel('dueDate', 'B')
    store().undo()
    expect(invoice().labels).toEqual({ issueDate: 'A' })
  })

  it('names the label that changed in the history signature', () => {
    const a = createSampleInvoice('classic')
    expect(changeSignature(a, { ...a, labels: { issueDate: 'x' } })).toBe('labels.issueDate')
    const b = { ...a, labels: { issueDate: 'x' } }
    expect(changeSignature(b, { ...b, labels: { issueDate: 'x', dueDate: 'y' } })).toBe('labels.dueDate')
    expect(changeSignature(b, { ...b, labels: { issueDate: 'z' } })).toBe('labels.issueDate')
  })
})

describe('labels and saved invoices', () => {
  afterEach(() => {
    localStorage.clear()
    store().startNewInvoice('classic', true)
  })

  function saved(invoiceOverrides: Record<string, unknown>) {
    const base = createSampleInvoice('classic') as unknown as Record<string, unknown>
    localStorage.setItem('invoice-generator/invoice', JSON.stringify({ state: { invoice: { ...base, ...invoiceOverrides } }, version: 0 }))
  }

  it('loads an invoice saved before labels existed, with no labels', async () => {
    const base = createSampleInvoice('classic') as unknown as Record<string, unknown>
    delete base.labels
    localStorage.setItem('invoice-generator/invoice', JSON.stringify({ state: { invoice: base }, version: 0 }))
    await useInvoiceStore.persist.rehydrate()
    expect(invoice().labels).toBeUndefined()
    expect(invoice().invoiceNumber).toBe((base as { invoiceNumber: string }).invoiceNumber)
  })

  it('keeps saved labels across a reload', async () => {
    saved({ labels: { total: 'Amount due', title: '' } })
    await useInvoiceStore.persist.rehydrate()
    expect(invoice().labels).toEqual({ total: 'Amount due', title: '' })
  })
})
