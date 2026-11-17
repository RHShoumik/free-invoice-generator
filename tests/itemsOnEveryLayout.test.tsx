import { readFileSync } from 'node:fs'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSampleInvoice } from '../src/store/invoiceStore'
import { TEMPLATES } from '../src/templates/registry'
import { CanvasEditProvider } from '../src/templates/shared/CanvasEditContext'
import { itemKey } from '../src/templates/shared/ItemTarget'
import { LabelsProvider } from '../src/templates/shared/LabelsContext'
import type { InvoiceLabels, LabelKey } from '../src/types/invoice'

/** One design per layout (the first preset): all 20 fixed layouts plus Freeform Canvas. */
const LAYOUTS = TEMPLATES.filter((t, i, all) => all.findIndex((x) => x.layoutId === t.layoutId) === i)

/**
 * What every layout printed, as plain text, before its labels became clickable (see the plan,
 * `docs/superpowers/plans/2026-11-15-item-drawer.md`, Task 4, Step 2). Outside the live editor nothing may differ.
 */
const BASELINE: Record<string, string> = JSON.parse(readFileSync('tests/__fixtures__/layout-text.json', 'utf8'))

/**
 * Freeform Canvas used to print the invoice number in a text input, whose value is not part of an element's text
 * content; it is plain text inside a clickable item now, so the same characters show up in `textContent`.
 */
const EXPECTED: Record<string, string> = { ...BASELINE, freeform: BASELINE.freeform.replace('Invoice', 'InvoiceINV-2026-001') }

/** The items every layout prints. */
const EVERY_LAYOUT = ['field:invoiceNumber', 'label:subtotal', 'label:total', 'label:discount', 'label:tax']

/** Designs that print the two dates bare (no "Issued" / "Due" word in front of them), so there is no label to reword. */
const NO_DATE_LABELS = new Set(['creative-agency', 'startup-tech', 'ledger', 'watermark'])

/** Designs with no title word to reword: Startup Tech leads with the number in a pill, Ledger with "Ledger", Blueprint with "Doc <number>". */
const NO_TITLE = new Set(['startup-tech', 'ledger', 'blueprint'])

function sample(layoutTemplateId: string) {
  const invoice = createSampleInvoice(layoutTemplateId)
  invoice.issueDate = '2026-11-15'
  invoice.dueDate = '2026-11-29'
  invoice.sections.signature = true
  invoice.taxRatePct = 7
  invoice.discountPct = 5
  return invoice
}

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  // Freeform Canvas measures its blocks with a ResizeObserver, which jsdom doesn't have.
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

let host: HTMLDivElement
let root: Root
const editText = vi.fn()

beforeEach(() => {
  editText.mockReset()
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

function mount(layout: (typeof LAYOUTS)[number], labels?: InvoiceLabels) {
  const Component = layout.component
  act(() =>
    root.render(
      <CanvasEditProvider value={{ updateField: () => {}, updateFrom: () => {}, updateTo: () => {}, editText } as never}>
        <LabelsProvider value={labels}>
          <Component invoice={sample(layout.id)} />
        </LabelsProvider>
      </CanvasEditProvider>,
    ),
  )
}
const items = () => [...host.querySelectorAll<HTMLElement>('[data-item]')]
const keys = () => new Set(items().map((el) => el.dataset.item))

describe('every layout', () => {
  it('covers all 21 layouts', () => {
    expect(LAYOUTS).toHaveLength(21)
    expect(Object.keys(EXPECTED).sort()).toEqual(LAYOUTS.map((l) => l.layoutId).sort())
  })

  describe.each(LAYOUTS.map((t) => [t.layoutId, t] as const))('%s', (_name, layout) => {
    it('prints exactly what it always printed outside the editor, with nothing clickable (a design-picker thumbnail)', () => {
      const Component = layout.component
      const page = document.createElement('div')
      page.innerHTML = renderToStaticMarkup(<Component invoice={sample(layout.id)} />)
      expect(page.querySelectorAll('[data-item]')).toHaveLength(0)
      expect(page.textContent).toBe(EXPECTED[layout.layoutId])
    })

    it('has the invoice number, the totals labels, and (where the design prints words for them) the title and both date labels as clickable items', () => {
      mount(layout)
      const present = keys()
      for (const key of EVERY_LAYOUT) expect(present, key).toContain(key)
      if (!NO_DATE_LABELS.has(layout.layoutId)) {
        expect(present).toContain('label:issueDate')
        expect(present).toContain('label:dueDate')
      }
      if (!NO_TITLE.has(layout.layoutId)) expect(present).toContain('label:title')
    })

    it('is a role="button" span at rest (so a press can still drag its section) and, when clicked, becomes a text box that writes to the matching item', () => {
      mount(layout)
      const keysSeen = [...keys()]
      expect(keysSeen.length).toBeGreaterThan(0)
      for (const key of keysSeen) {
        const el = host.querySelector<HTMLElement>(`[data-item="${key}"]`)!
        expect(el.tagName).toBe('SPAN')
        expect(el.getAttribute('role')).toBe('button')
        act(() => el.click())
        const box = host.querySelector<HTMLElement>(`[data-item="${key}"]`)!
        expect(box.getAttribute('role'), key).toBe('textbox')
        act(() => {
          box.textContent = 'zz'
          box.dispatchEvent(new Event('input', { bubbles: true }))
        })
        expect(itemKey(editText.mock.lastCall![0]), key).toBe(key)
        expect(editText.mock.lastCall![1]).toBe('zz')
        act(() => box.blur())
      }
    })

    it('prints the user\'s wording in every place a label appears, and no longer the layout\'s own', () => {
      const labels: InvoiceLabels = {}
      for (const key of ['title', 'invoiceNumber', 'issueDate', 'dueDate', 'from', 'billTo', 'subtotal', 'discount', 'tax', 'total', 'paymentTerms', 'bankDetails', 'signatureBusiness', 'signatureClient'] as LabelKey[]) {
        labels[key] = `ZZ-${key}`
      }
      mount(layout, labels)
      const labelItems = items().filter((el) => el.dataset.item?.startsWith('label:'))
      expect(labelItems.length).toBeGreaterThan(5)
      for (const el of labelItems) expect(el.textContent, el.dataset.item).toBe(`ZZ-${el.dataset.item!.slice('label:'.length)}`)
      if (!NO_DATE_LABELS.has(layout.layoutId)) expect(host.textContent).toContain('ZZ-issueDate')
      expect(host.textContent).toContain('ZZ-total')
    })

    it('renders when every label has been emptied, leaving each one a click target that stays out of an export', () => {
      const labels: InvoiceLabels = { title: '', invoiceNumber: '', issueDate: '', dueDate: '', from: '', billTo: '', subtotal: '', discount: '', tax: '', total: '', paymentTerms: '', bankDetails: '', signatureBusiness: '', signatureClient: '' }
      mount(layout, labels)
      for (const el of items().filter((i) => i.dataset.item?.startsWith('label:'))) {
        expect(el.textContent).toBe('')
        expect(el.getAttribute('data-export-hide')).toBe('true')
      }
    })
  })
})
