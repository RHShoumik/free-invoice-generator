import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DetailsDrawer } from '../src/features/invoice-editor/DetailsDrawer'
import { EditorLayout } from '../src/features/invoice-editor/EditorLayout'
import { formatDate } from '../src/lib/date'
import { useInvoiceStore } from '../src/store/invoiceStore'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // Radix's select and popover want these in jsdom.
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.scrollIntoView ??= () => {}
})

const store = () => useInvoiceStore.getState()
const invoice = () => store().invoice

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  localStorage.clear()
  store().startNewInvoice('classic', true)
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

const click = (el: Element | null) => act(() => (el as HTMLElement).click())
function typeInto(el: HTMLInputElement, value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const input = (label: string) => host.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!
/** The button that shows a date and opens the calendar. */
const dateButton = (label: string) => host.querySelector<HTMLButtonElement>(`button[aria-label^="${label}"]`)!
const calendar = () => document.body.querySelector('[role="dialog"]')
const calendarDay = (iso: string) => document.body.querySelector<HTMLButtonElement>(`[role="dialog"] [data-iso="${iso}"]`)

describe('DetailsDrawer', () => {
  const onClose = vi.fn()
  beforeEach(() => {
    onClose.mockReset()
    act(() => root.render(<DetailsDrawer onClose={onClose} />))
  })

  it('is a left card titled "Invoice details" that shows what the invoice has now', () => {
    expect(host.querySelector('aside[aria-label="Details"]')).not.toBeNull()
    expect(host.querySelector('h2')?.textContent).toBe('Invoice details')
    expect(input('Invoice number').value).toBe(invoice().invoiceNumber)
    // Dates read as dates (not a browser's own date box) and open the invoice's calendar.
    expect(host.querySelector('input[type="date"]')).toBeNull()
    expect(dateButton('Issue date').textContent).toBe(formatDate(invoice().issueDate))
    expect(dateButton('Due date').textContent).toBe(formatDate(invoice().dueDate))
    expect(input('Tax %').value).toBe(String(invoice().taxRatePct))
    expect(input('Discount %').value).toBe(String(invoice().discountPct))
    expect(host.textContent).toContain(invoice().currency)
  })

  it('writes each field straight to the invoice', () => {
    typeInto(input('Invoice number'), 'INV-2026-77')
    expect(invoice().invoiceNumber).toBe('INV-2026-77')
    typeInto(input('Tax %'), '7.5')
    expect(invoice().taxRatePct).toBe(7.5)
    typeInto(input('Discount %'), '12')
    expect(invoice().discountPct).toBe(12)
  })

  it('opens the calendar from a date, on that date\'s month, and picking a day writes it and closes the calendar', () => {
    act(() => store().updateField('issueDate', '2026-11-15'))
    expect(calendar()).toBeNull()
    click(dateButton('Issue date'))
    expect(calendar()).not.toBeNull()
    expect(calendar()!.querySelector('h3')?.textContent).toBe('November 2026')
    expect(calendarDay('2026-11-15')!.getAttribute('aria-pressed')).toBe('true')
    click(calendarDay('2026-11-20'))
    expect(invoice().issueDate).toBe('2026-11-20')
    expect(calendar()).toBeNull()
    expect(dateButton('Issue date').textContent).toBe('Nov 20, 2026')
  })

  it('the due date opens its own calendar and writes only the due date', () => {
    act(() => {
      store().updateField('issueDate', '2026-11-15')
      store().updateField('dueDate', '2026-11-29')
    })
    click(dateButton('Due date'))
    click(calendarDay('2026-11-30'))
    expect(invoice().issueDate).toBe('2026-11-15')
    expect(invoice().dueDate).toBe('2026-11-30')
  })

  it('treats a cleared percentage as 0, not NaN', () => {
    typeInto(input('Tax %'), '')
    expect(invoice().taxRatePct).toBe(0)
  })

  it('closes from its ✕', () => {
    click(host.querySelector('[aria-label="Close details panel"]'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('the Details button on the dock', () => {
  // Elements starts open only on a window wide enough to hold it beside the page; make that so, as on a desktop.
  const originalWidth = window.innerWidth
  beforeEach(() => {
    window.innerWidth = 1280
  })
  afterEach(() => {
    window.innerWidth = originalWidth
  })
  function mountEditor() {
    act(() =>
      root.render(
        <MemoryRouter>
          <EditorLayout />
        </MemoryRouter>,
      ),
    )
  }
  const detailsButton = () => [...host.querySelectorAll<HTMLButtonElement>('nav[aria-label="Tools"] button')].find((b) => b.textContent === 'Details')!
  const elementsButton = () => [...host.querySelectorAll<HTMLButtonElement>('nav[aria-label="Tools"] button')].find((b) => b.textContent === 'Elements')!
  const drawer = () => host.querySelector('aside[aria-label="Details"]')

  it('opens the details in the left drawer — not a popup', () => {
    mountEditor()
    expect(drawer()).toBeNull()
    click(detailsButton())
    expect(drawer()).not.toBeNull()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.querySelector('[data-radix-popper-content-wrapper]')).toBeNull()
    expect(detailsButton().getAttribute('aria-pressed')).toBe('true')
  })

  it('is a toggle, and takes the spot Elements had', () => {
    mountEditor()
    expect(host.querySelector('[aria-label="Close elements panel"]')).not.toBeNull()
    click(detailsButton())
    expect(host.querySelector('[aria-label="Close elements panel"]')).toBeNull()
    expect(drawer()).not.toBeNull()
    click(detailsButton())
    expect(drawer()).toBeNull()
    expect(detailsButton().getAttribute('aria-pressed')).toBe('false')
    click(detailsButton())
    click(elementsButton())
    expect(drawer()).toBeNull()
    expect(host.querySelector('[aria-label="Close elements panel"]')).not.toBeNull()
  })

  it('edits the invoice the page is showing, and closes from its ✕', () => {
    mountEditor()
    click(detailsButton())
    typeInto(input('Invoice number'), 'INV-9')
    expect(host.querySelector('#invoice-print-surface [data-item="field:invoiceNumber"]')?.textContent).toBe('INV-9')
    click(host.querySelector('[aria-label="Close details panel"]'))
    expect(drawer()).toBeNull()
  })
})
