import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { EditorLayout } from '../src/features/invoice-editor/EditorLayout'
import { ItemDrawer } from '../src/features/invoice-editor/ItemDrawer'
import { useInvoiceStore } from '../src/store/invoiceStore'
import type { PictureTarget } from '../src/templates/shared/ItemTarget'

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
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
  vi.restoreAllMocks()
})

const onClose = vi.fn()
function mount(target: PictureTarget) {
  onClose.mockReset()
  act(() => root.render(<ItemDrawer target={target} onClose={onClose} />))
}

const byLabel = <T extends HTMLElement = HTMLElement>(label: string) => host.querySelector<T>(`[aria-label="${label}"]`)
const click = (el: Element | null) => act(() => (el as HTMLElement).click())
const heading = () => host.querySelector('h2')?.textContent

describe('ItemDrawer: an image element', () => {
  function addImage(dataUrl: string | null) {
    store().addFreeformElement('image', undefined, { dataUrl })
    return invoice().freeformLayout.find((el) => el.kind === 'image')!.id
  }
  const content = (id: string) => invoice().freeformLayout.find((el) => el.id === id) as { dataUrl: string | null }

  it('previews it with Replace and Remove, and Remove empties the element', () => {
    const id = addImage(PNG)
    mount({ kind: 'image', elementId: id })
    expect(heading()).toBe('Image')
    expect(host.querySelector('img[alt="Image preview"]')?.getAttribute('src')).toBe(PNG)
    const picker = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    click(byLabel('Replace image'))
    expect(picker).toHaveBeenCalledOnce()
    click(byLabel('Remove image'))
    expect(content(id).dataUrl).toBeNull()
  })

  it('an empty image element offers Upload', () => {
    const id = addImage(null)
    mount({ kind: 'image', elementId: id })
    expect(host.querySelector('img[alt="Image preview"]')).toBeNull()
    expect(byLabel('Upload image')).not.toBeNull()
    expect(byLabel('Remove image')).toBeNull()
  })

  it('rejects a file that is not an image', () => {
    const id = addImage(PNG)
    mount({ kind: 'image', elementId: id })
    const input = host.querySelector<HTMLInputElement>('input[type="file"]')!
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'notes.txt', { type: 'text/plain' })] })
    act(() => void input.dispatchEvent(new Event('change', { bubbles: true })))
    expect(host.querySelector('[role="alert"]')?.textContent).toBe('Choose an image file.')
    expect(content(id).dataUrl).toBe(PNG)
  })

  it('closes itself, and renders nothing, when its element is gone', () => {
    const id = addImage(PNG)
    mount({ kind: 'image', elementId: id })
    expect(onClose).not.toHaveBeenCalled()
    act(() => store().removeFreeformElement(id))
    expect(onClose).toHaveBeenCalledOnce()
    expect(host.querySelector('aside')).toBeNull()
  })
})

describe('ItemDrawer: the watermark', () => {
  it('is only the picture — the text is edited on the page — and Reset puts both back', () => {
    mount({ kind: 'watermark' })
    expect(heading()).toBe('Watermark')
    expect(host.querySelectorAll('input[type="text"], textarea')).toHaveLength(0)
    expect(byLabel('Upload image')).not.toBeNull()
    expect(byLabel('Reset watermark')).toBeNull()
    act(() => store().updateField('watermarkText', 'PAID'))
    click(byLabel('Reset watermark'))
    expect(invoice().watermarkText).toBeUndefined()
  })

  it('with an image, previews it with Replace and Remove, and Remove brings the text back', () => {
    store().updateField('watermarkImage', PNG)
    mount({ kind: 'watermark' })
    expect(host.querySelector('img[alt="Image preview"]')?.getAttribute('src')).toBe(PNG)
    click(byLabel('Remove image'))
    expect(invoice().watermarkImage).toBeUndefined()
  })

  it('closes from its ✕', () => {
    mount({ kind: 'watermark' })
    click(byLabel('Close item panel'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('in the editor', () => {
  function mountEditor() {
    act(() =>
      root.render(
        <MemoryRouter>
          <EditorLayout />
        </MemoryRouter>,
      ),
    )
  }
  const drawer = () => host.querySelector('aside[aria-label="Item"]')
  const pageItem = (key: string) => host.querySelector<HTMLElement>(`#invoice-print-surface [data-item="${key}"]`)!
  /** What typing does to a contentEditable box: the DOM text changes, then an `input` event says so. */
  const typeText = (el: Element, text: string) =>
    act(() => {
      el.textContent = text
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
  const keydown = (el: Element, key: string) => act(() => void el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })))

  it('clicking the invoice number edits it right there, with no drawer', () => {
    mountEditor()
    const original = invoice().invoiceNumber
    click(pageItem('field:invoiceNumber'))
    expect(drawer()).toBeNull()
    const box = pageItem('field:invoiceNumber')
    expect(box.getAttribute('role')).toBe('textbox')
    expect(box.textContent).toBe(original)
    expect(document.activeElement).toBe(box)
    typeText(box, 'INV-2026-77')
    expect(invoice().invoiceNumber).toBe('INV-2026-77')
    // Every place the layout prints the number shows it.
    for (const el of host.querySelectorAll('#invoice-print-surface [data-item="field:invoiceNumber"]')) expect(el.textContent).toBe('INV-2026-77')
  })

  it('rewording a label reprints it on the page, in every place that label appears', () => {
    mountEditor()
    click(pageItem('label:issueDate'))
    typeText(pageItem('label:issueDate'), 'Date issued')
    expect(invoice().labels).toEqual({ issueDate: 'Date issued' })
    expect(pageItem('label:issueDate').textContent).toBe('Date issued')
    expect(drawer()).toBeNull()
  })

  it('Enter ends editing and keeps the text; Escape puts the text back', () => {
    mountEditor()
    click(pageItem('label:total'))
    typeText(pageItem('label:total'), 'Amount due')
    keydown(pageItem('label:total'), 'Enter')
    expect(pageItem('label:total').getAttribute('role')).toBe('button')
    expect(pageItem('label:total').textContent).toBe('Amount due')

    click(pageItem('label:total'))
    typeText(pageItem('label:total'), 'Oops')
    keydown(pageItem('label:total'), 'Escape')
    expect(invoice().labels).toEqual({ total: 'Amount due' })
    expect(pageItem('label:total').textContent).toBe('Amount due')

    // A label that never had wording of its own goes back to having none, not to "its own wording as an override".
    click(pageItem('label:dueDate'))
    typeText(pageItem('label:dueDate'), 'Pay by')
    keydown(pageItem('label:dueDate'), 'Escape')
    expect(invoice().labels).toEqual({ total: 'Amount due' })
  })

  it('a run of typing is one undo step, and undo shows in the box that is still open', () => {
    mountEditor()
    const original = invoice().invoiceNumber
    click(pageItem('field:invoiceNumber'))
    typeText(pageItem('field:invoiceNumber'), 'INV-7')
    typeText(pageItem('field:invoiceNumber'), 'INV-77')
    act(() => store().undo())
    expect(invoice().invoiceNumber).toBe(original)
    expect(pageItem('field:invoiceNumber').textContent).toBe(original)
    expect(pageItem('field:invoiceNumber').getAttribute('role')).toBe('textbox')
  })

  it('edits a layout\'s own party lines and the footer text in place too', () => {
    act(() => store().startNewInvoice('sidebar-accent', true))
    mountEditor()
    click(pageItem('party:from.address'))
    typeText(pageItem('party:from.address'), '9 Pine Rd')
    expect(invoice().from.address).toBe('9 Pine Rd')
    expect(drawer()).toBeNull()
  })

  it('a date still opens its calendar', () => {
    mountEditor()
    click(host.querySelector('#invoice-print-surface [data-editable-date="issueDate"]'))
    expect(drawer()).toBeNull()
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
  })

  it('pressing the logo opens the Business drawer', () => {
    mountEditor()
    act(
      () =>
        void host
          .querySelector('#invoice-print-surface [data-section-id="logo"]')!
          .dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 })),
    )
    expect(host.querySelector('[aria-label="Close business panel"]')).not.toBeNull()
  })

  it('pressing an Image element opens the item drawer on that picture', () => {
    act(() => store().startNewInvoice('freeform', true))
    store().addFreeformElement('image', undefined, { dataUrl: PNG })
    mountEditor()
    const picture = host.querySelector(`#invoice-print-surface img[src="${PNG}"]`)!
    // A press on a Freeform block selects it when the pointer is released without having moved.
    act(() => {
      picture.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
      window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
    })
    expect(host.querySelector('aside[aria-label="Item"] h2')?.textContent).toBe('Image')
  })
})
