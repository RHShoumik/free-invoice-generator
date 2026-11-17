import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { TemplatePickerDialog } from '../src/features/invoice-editor/TemplatePickerDialog'
import { TEMPLATES } from '../src/templates/registry'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  // jsdom has no IntersectionObserver; the lazy thumbnails only need it to exist.
  ;(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

function mount(props: Partial<React.ComponentProps<typeof TemplatePickerDialog>> = {}) {
  const onClose = vi.fn()
  const onSelect = vi.fn()
  act(() => root.render(<TemplatePickerDialog open onClose={onClose} onSelect={onSelect} currentId={TEMPLATES[0].id} {...props} />))
  return { onClose, onSelect }
}

const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]')
const designs = () => [...document.body.querySelectorAll<HTMLElement>('button[data-design-id]')]

describe('the Designs modal', () => {
  it('is a centered dialog titled "Browse designs", not a side panel', () => {
    mount()
    const el = dialog()!
    expect(el).not.toBeNull()
    expect(el.getAttribute('aria-labelledby')).toBeTruthy()
    expect(document.getElementById(el.getAttribute('aria-labelledby')!)?.textContent).toBe('Browse designs')
    // The old picker was a Sheet pinned to the right edge (data-side="right"); the modal must not be one.
    expect(el.getAttribute('data-side')).toBeNull()
  })

  it('shows every design as a live preview card', () => {
    mount()
    expect(designs()).toHaveLength(TEMPLATES.length)
  })

  it('marks the design you are on', () => {
    mount({ currentId: TEMPLATES[2].id })
    const current = designs().filter((d) => d.getAttribute('aria-current') === 'true')
    expect(current).toHaveLength(1)
    expect(current[0].dataset.designId).toBe(TEMPLATES[2].id)
  })

  it('picking a design reports its id', () => {
    const { onSelect } = mount()
    act(() => designs()[4].click())
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(TEMPLATES[4].id)
  })

  it('filters by the search box and says so when nothing matches', () => {
    mount()
    const input = document.body.querySelector<HTMLInputElement>('input[type="search"]')!
    const type = (value: string) =>
      act(() => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
    type('zzzz-no-such-design')
    expect(designs()).toHaveLength(0)
    expect(document.body.textContent).toContain('No designs match')
    type('')
    expect(designs()).toHaveLength(TEMPLATES.length)
  })

  it('closes on Escape', () => {
    const { onClose } = mount()
    act(() => {
      dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('renders nothing while closed', () => {
    mount({ open: false })
    expect(dialog()).toBeNull()
  })
})
