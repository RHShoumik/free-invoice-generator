import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { CanvasEditProvider } from '../src/templates/shared/CanvasEditContext'
import { itemKey, itemTitle } from '../src/templates/shared/ItemTarget'
import { LabelsProvider } from '../src/templates/shared/LabelsContext'
import { FieldText, ItemText, Label, PartyBlock, PartyLine, Signature, Totals } from '../src/templates/shared/primitives'
import type { InvoiceLabels } from '../src/types/invoice'
import { emptyParty } from '../src/types/invoice'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
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

function tree(node: React.ReactNode, labels?: InvoiceLabels) {
  return (
    <CanvasEditProvider value={{ editText, updateFrom: vi.fn(), updateTo: vi.fn() } as never}>
      <LabelsProvider value={labels}>{node}</LabelsProvider>
    </CanvasEditProvider>
  )
}
function mount(node: React.ReactNode, labels?: InvoiceLabels) {
  act(() => root.render(tree(node, labels)))
}

const item = (key: string) => host.querySelector<HTMLElement>(`[data-item="${key}"]`)!
const click = (el: Element) => act(() => (el as HTMLElement).click())
const keydown = (el: Element, k: string) => {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
  act(() => void el.dispatchEvent(event))
  return event
}
/** What typing does to a contentEditable box: the DOM text changes, then an `input` event says so. */
const type = (el: Element, text: string) =>
  act(() => {
    el.textContent = text
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })

describe('itemKey and itemTitle', () => {
  it('name each kind of target', () => {
    expect(itemKey({ kind: 'label', key: 'issueDate', fallback: 'Issued' })).toBe('label:issueDate')
    expect(itemKey({ kind: 'field', field: 'notes' })).toBe('field:notes')
    expect(itemKey({ kind: 'party', which: 'from', field: 'address' })).toBe('party:from.address')
    expect(itemKey({ kind: 'image', elementId: 'el_1' })).toBe('image:el_1')
    expect(itemKey({ kind: 'watermark' })).toBe('watermark')
  })

  it('give each one a name a person would use', () => {
    expect(itemTitle({ kind: 'label', key: 'issueDate', fallback: 'Issued' })).toBe('Issue date label')
    expect(itemTitle({ kind: 'field', field: 'invoiceNumber' })).toBe('Invoice number')
    expect(itemTitle({ kind: 'field', field: 'bankDetails' })).toBe('Bank details')
    expect(itemTitle({ kind: 'party', which: 'from', field: 'address' })).toBe('From address')
    expect(itemTitle({ kind: 'party', which: 'to', field: 'taxId' })).toBe('Bill to tax ID')
  })
})

describe('outside the live editor (a design-picker thumbnail)', () => {
  it('a label is exactly its text — no wrapper, no role, nothing to click', () => {
    expect(renderToStaticMarkup(<Label id="issueDate">Issue Date</Label>)).toBe('Issue Date')
  })

  it('a field text and a party line are exactly their text', () => {
    expect(renderToStaticMarkup(<FieldText field="invoiceNumber">INV-1</FieldText>)).toBe('INV-1')
    expect(renderToStaticMarkup(<PartyLine which="from" field="phone">555</PartyLine>)).toBe('555')
  })

  it('ItemText with no editText in the context is plain text', () => {
    act(() =>
      root.render(
        <CanvasEditProvider value={{} as never}>
          <ItemText target={{ kind: 'label', key: 'title', fallback: 'Mark' }}>Mark</ItemText>
        </CanvasEditProvider>,
      ),
    )
    expect(host.innerHTML).toBe('Mark')
  })
})

describe('Label in the live editor — at rest', () => {
  it('is a role="button" span (not a <button>, so a press can still start a section drag), tabbable, with its text', () => {
    mount(<Label id="issueDate">Issue Date</Label>)
    const el = item('label:issueDate')
    expect(el.tagName).toBe('SPAN')
    expect(el.getAttribute('role')).toBe('button')
    expect(el.tabIndex).toBe(0)
    expect(el.hasAttribute('contenteditable')).toBe(false)
    expect(host.querySelector('button')).toBeNull()
    expect(el.textContent).toBe('Issue Date')
    expect(editText).not.toHaveBeenCalled()
  })

  it('a pointer press is not swallowed, so the page\'s drag handler still sees it', () => {
    const onPointerDown = vi.fn()
    mount(
      <div onPointerDown={onPointerDown}>
        <Label id="issueDate">Issue Date</Label>
      </div>,
    )
    act(() => void item('label:issueDate').dispatchEvent(new Event('pointerdown', { bubbles: true })))
    expect(onPointerDown).toHaveBeenCalledOnce()
  })

  it('prints the user\'s wording, and a label they emptied prints nothing, stays clickable and is left out of an export', () => {
    mount(<Label id="issueDate">Issue Date</Label>, { issueDate: 'Date issued' })
    expect(item('label:issueDate').textContent).toBe('Date issued')
    mount(<Label id="title">Invoice</Label>, { title: '' })
    const el = item('label:title')
    expect(el.textContent).toBe('')
    expect(el.getAttribute('role')).toBe('button')
    expect(el.getAttribute('aria-label')).toBe('Edit title label')
    expect(el.getAttribute('data-export-hide')).toBe('true')
    expect(el.style.minWidth).not.toBe('')
  })
})

describe('Label in the live editor — editing in place', () => {
  it('a click turns that very span into a focused text box with the same text, and writes nothing yet', () => {
    mount(<Label id="issueDate">Issue Date</Label>)
    const before = item('label:issueDate')
    const textNode = before.firstChild
    click(before)
    const el = item('label:issueDate')
    expect(el).toBe(before)
    expect(el.firstChild).toBe(textNode)
    expect(el.getAttribute('role')).toBe('textbox')
    expect(el.getAttribute('contenteditable')).toBe('true')
    expect(el.getAttribute('aria-label')).toBe('Issue date label')
    expect(el.hasAttribute('data-no-section-drag')).toBe(true)
    expect(el.textContent).toBe('Issue Date')
    expect(document.activeElement).toBe(el)
    expect(editText).not.toHaveBeenCalled()
  })

  it('starts from the keyboard with Enter or Space on the focused text', () => {
    mount(<Label id="dueDate">Due</Label>)
    const ev = keydown(item('label:dueDate'), 'Enter')
    expect(ev.defaultPrevented).toBe(true)
    expect(item('label:dueDate').getAttribute('role')).toBe('textbox')
    act(() => item('label:dueDate').blur())
    expect(item('label:dueDate').getAttribute('role')).toBe('button')
    keydown(item('label:dueDate'), ' ')
    expect(item('label:dueDate').getAttribute('role')).toBe('textbox')
  })

  it('typing writes what is in the box to this label, with the layout\'s wording kept as its fallback', () => {
    mount(<Label id="issueDate">Issue Date</Label>)
    click(item('label:issueDate'))
    type(item('label:issueDate'), 'Date of issue')
    expect(editText).toHaveBeenLastCalledWith({ kind: 'label', key: 'issueDate', fallback: 'Issue Date' }, 'Date of issue')
  })

  it('does not rewrite the box while you type (the caret would jump), but follows a change from outside (undo)', () => {
    mount(<Label id="issueDate">Issue Date</Label>)
    click(item('label:issueDate'))
    type(item('label:issueDate'), 'Date of issue')
    const typed = item('label:issueDate').firstChild
    // The store echoes what was typed back as the label's new text: the DOM node must be left alone.
    mount(<Label id="issueDate">Issue Date</Label>, { issueDate: 'Date of issue' })
    expect(item('label:issueDate').firstChild).toBe(typed)
    expect(item('label:issueDate').getAttribute('role')).toBe('textbox')
    // Something else (undo) changes it: the box shows that.
    mount(<Label id="issueDate">Issue Date</Label>, { issueDate: 'Issued' })
    expect(item('label:issueDate').textContent).toBe('Issued')
  })

  it('Enter finishes editing; the text stays', () => {
    mount(<Label id="issueDate">Issue Date</Label>)
    click(item('label:issueDate'))
    type(item('label:issueDate'), 'Date of issue')
    mount(<Label id="issueDate">Issue Date</Label>, { issueDate: 'Date of issue' })
    const ev = keydown(item('label:issueDate'), 'Enter')
    expect(ev.defaultPrevented).toBe(true)
    expect(item('label:issueDate').getAttribute('role')).toBe('button')
    expect(item('label:issueDate').hasAttribute('contenteditable')).toBe(false)
    expect(item('label:issueDate').textContent).toBe('Date of issue')
    expect(document.activeElement).not.toBe(item('label:issueDate'))
  })

  it('Escape puts the label back as it was when editing started: no override stays no override', () => {
    mount(<Label id="issueDate">Issue Date</Label>)
    click(item('label:issueDate'))
    type(item('label:issueDate'), 'Oops')
    keydown(item('label:issueDate'), 'Escape')
    expect(editText).toHaveBeenLastCalledWith({ kind: 'label', key: 'issueDate', fallback: 'Issue Date' }, undefined)
    expect(item('label:issueDate').getAttribute('role')).toBe('button')
    // The box shows the text again, not what was typed (React saw the same text all along, so it must be put back).
    expect(item('label:issueDate').textContent).toBe('Issue Date')
  })

  it('Escape on a label the user had already reworded goes back to that wording', () => {
    mount(<Label id="issueDate">Issue Date</Label>, { issueDate: 'Date issued' })
    click(item('label:issueDate'))
    type(item('label:issueDate'), 'Oops')
    keydown(item('label:issueDate'), 'Escape')
    expect(editText).toHaveBeenLastCalledWith({ kind: 'label', key: 'issueDate', fallback: 'Issue Date' }, 'Date issued')
    expect(item('label:issueDate').textContent).toBe('Date issued')
  })

  it('a space typed into the box is typing, not another click', () => {
    mount(<Label id="issueDate">Issue Date</Label>)
    click(item('label:issueDate'))
    expect(keydown(item('label:issueDate'), ' ').defaultPrevented).toBe(false)
  })

  it('emptying the box prints nothing and keeps a place to type', () => {
    mount(<Label id="title">Invoice</Label>)
    click(item('label:title'))
    type(item('label:title'), '')
    expect(editText).toHaveBeenLastCalledWith({ kind: 'label', key: 'title', fallback: 'Invoice' }, '')
    mount(<Label id="title">Invoice</Label>, { title: '' })
    expect(item('label:title').getAttribute('data-export-hide')).toBe('true')
    expect(item('label:title').style.minWidth).not.toBe('')
    expect(item('label:title').getAttribute('role')).toBe('textbox')
  })

  it('clicking the box that is being edited does not start over', () => {
    mount(<Label id="issueDate">Issue Date</Label>)
    click(item('label:issueDate'))
    type(item('label:issueDate'), 'Date of issue')
    click(item('label:issueDate'))
    expect(item('label:issueDate').getAttribute('role')).toBe('textbox')
    expect(item('label:issueDate').textContent).toBe('Date of issue')
    expect(editText).toHaveBeenCalledTimes(1)
  })
})

describe('FieldText and PartyLine in the live editor', () => {
  it('edit their own field / party line', () => {
    mount(
      <>
        <FieldText field="invoiceNumber">INV-7</FieldText>
        <PartyLine which="from" field="address">1 Main St</PartyLine>
      </>,
    )
    expect(item('field:invoiceNumber').textContent).toBe('INV-7')
    click(item('field:invoiceNumber'))
    expect(item('field:invoiceNumber').getAttribute('aria-label')).toBe('Invoice number')
    type(item('field:invoiceNumber'), 'INV-8')
    expect(editText).toHaveBeenLastCalledWith({ kind: 'field', field: 'invoiceNumber' }, 'INV-8')
    act(() => item('field:invoiceNumber').blur())
    click(item('party:from.address'))
    type(item('party:from.address'), '2 High St')
    expect(editText).toHaveBeenLastCalledWith({ kind: 'party', which: 'from', field: 'address' }, '2 High St')
  })

  it('Escape puts a field back as it was', () => {
    mount(<FieldText field="notes">Thanks</FieldText>)
    click(item('field:notes'))
    type(item('field:notes'), 'Thanks a lot')
    keydown(item('field:notes'), 'Escape')
    expect(editText).toHaveBeenLastCalledWith({ kind: 'field', field: 'notes' }, 'Thanks')
  })

  it('an empty value still has a place to click, named for what it is, and stays out of an export', () => {
    mount(<PartyLine which="to" field="phone">{''}</PartyLine>)
    const el = item('party:to.phone')
    expect(el.getAttribute('aria-label')).toBe('Edit bill to phone')
    expect(el.getAttribute('data-export-hide')).toBe('true')
  })
})

describe('the shared blocks use Label', () => {
  it('Totals words come from the labels, and the discount / tax percentage stays', () => {
    mount(
      <Totals invoice={{ items: [{ id: 'a', description: 'x', quantity: 1, unitPrice: 100, customValues: {} }], taxRatePct: 5, discountPct: 10, currency: 'USD' }} />,
      { total: 'Amount due', discount: 'Rebate', subtotal: 'Before tax', tax: 'VAT' },
    )
    expect(item('label:total').textContent).toBe('Amount due')
    expect(item('label:subtotal').textContent).toBe('Before tax')
    expect(item('label:discount').parentElement!.textContent).toContain('Rebate (10%)')
    expect(item('label:tax').parentElement!.textContent).toContain('VAT (5%)')
    click(item('label:total'))
    type(item('label:total'), 'Pay this')
    expect(editText).toHaveBeenLastCalledWith({ kind: 'label', key: 'total', fallback: 'Total' }, 'Pay this')
  })

  it('PartyBlock\'s heading is the from / billTo label, with the layout\'s own word as the fallback', () => {
    mount(
      <>
        <PartyBlock label="Billed to" party={emptyParty()} which="to" />
        <PartyBlock label="From" party={emptyParty()} which="from" />
      </>,
      { billTo: 'Client' },
    )
    expect(item('label:billTo').textContent).toBe('Client')
    expect(item('label:from').textContent).toBe('From')
    click(item('label:billTo'))
    type(item('label:billTo'), 'Customer')
    expect(editText).toHaveBeenLastCalledWith({ kind: 'label', key: 'billTo', fallback: 'Billed to' }, 'Customer')
  })

  it('Signature captions are the two signature labels', () => {
    mount(<Signature invoice={{ from: emptyParty(), to: emptyParty() }} />, { signatureClient: 'Customer sign-off' })
    expect(item('label:signatureBusiness').textContent).toBe('Authorized signature')
    expect(item('label:signatureClient').textContent).toBe('Customer sign-off')
  })
})
