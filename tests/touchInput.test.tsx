import { act, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { EditorLayout } from '../src/features/invoice-editor/EditorLayout'
import { useSectionDrag } from '../src/features/invoice-editor/useSectionDrag'
import { useInvoiceStore } from '../src/store/invoiceStore'
import { FreeformBlockWrapper } from '../src/templates/21-freeform/blocks/FreeformBlockWrapper'
import { CanvasEditProvider } from '../src/templates/shared/CanvasEditContext'
import { FreeformBlockProvider } from '../src/templates/shared/FreeformBlockContext'
import { Label } from '../src/templates/shared/primitives'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
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
  vi.restoreAllMocks()
  // A mouse drag leaves a one-shot listener that swallows the click after it (for 50 ms); use it up so it cannot eat the next test's click.
  window.dispatchEvent(new MouseEvent('click'))
})

type Kind = 'touch' | 'mouse'
const pointer = (type: string, kind: Kind, x: number, y: number) =>
  new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, pointerType: kind, clientX: x, clientY: y })

/** A finger or a mouse pressing at (x0,y0), moving to (x1,y1), and letting go. */
function gesture(target: Element, kind: Kind, from: [number, number], to: [number, number]) {
  act(() => void target.dispatchEvent(pointer('pointerdown', kind, ...from)))
  act(() => void window.dispatchEvent(pointer('pointermove', kind, ...to)))
  act(() => void window.dispatchEvent(pointer('pointerup', kind, ...to)))
}

const rect = (r: Partial<DOMRect>) => ({ left: 0, top: 0, right: 0, bottom: 0, x: 0, y: 0, width: 0, height: 0, toJSON() {}, ...r }) as DOMRect

describe('a section on a fixed layout, pressed with a finger or a mouse', () => {
  function mountSection() {
    const onCommit = vi.fn()
    const onSelect = vi.fn()
    const onClick = vi.fn()
    function Harness() {
      const wrapperRef = useRef<HTMLDivElement>(null)
      const { handlers } = useSectionDrag({ wrapperRef, offsets: {}, onCommit, onSelect, enabled: true })
      return (
        <div ref={wrapperRef} {...handlers}>
          <div data-section-id="meta">
            <span id="word" onClick={onClick}>
              Issue Date
            </span>
          </div>
        </div>
      )
    }
    // jsdom has no layout: give the page a real size so the maths of a drag has something to work with.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return this.hasAttribute('data-section-id') ? rect({ left: 40, top: 40, width: 200, height: 40 }) : rect({ width: 794, height: 1123 })
    })
    act(() => root.render(<Harness />))
    return { onCommit, onSelect, onClick, word: host.querySelector('#word')! }
  }

  it('a mouse still drags it, as before', () => {
    const { onCommit, word } = mountSection()
    gesture(word, 'mouse', [100, 100], [130, 120])
    expect(onCommit).toHaveBeenCalledWith('meta', { x: 30, y: 20 })
  })

  it('a finger does not drag it — on a phone a finger moving over the page is scrolling — but does select it', () => {
    const { onCommit, onSelect, word } = mountSection()
    gesture(word, 'touch', [100, 100], [160, 220])
    expect(onCommit).not.toHaveBeenCalled()
    expect(onSelect).toHaveBeenCalledWith('meta')
  })

  it('a tap that drifts a few pixels is still a tap: nothing moves, and the click that starts editing is not swallowed', () => {
    const { onCommit, onClick, word } = mountSection()
    gesture(word, 'touch', [100, 100], [106, 103])
    act(() => word.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(onCommit).not.toHaveBeenCalled()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('a mouse that really dragged still swallows the click that follows, so letting go of a drag opens nothing', () => {
    const { onClick, word } = mountSection()
    gesture(word, 'mouse', [100, 100], [130, 120])
    act(() => word.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('a block on the Freeform Canvas, pressed with a finger or a mouse', () => {
  function mountBlock() {
    const onLiveChange = vi.fn()
    const onSelect = vi.fn()
    const canvas = document.createElement('div')
    canvas.getBoundingClientRect = () => rect({ width: 794, height: 1123 })
    act(() =>
      root.render(
        <FreeformBlockProvider
          value={{
            onMoveOrResize: vi.fn(),
            selectedId: null,
            onSelect,
            onDelete: vi.fn(),
            onDuplicate: vi.fn(),
            onUpdateContent: vi.fn(),
            onUpdateStyle: vi.fn(),
            onAddElement: vi.fn(),
          }}
        >
          <FreeformBlockWrapper
            id="el1"
            rect={{ x: 0, y: 0, width: 300 }}
            canvasRef={{ current: canvas }}
            onLiveChange={onLiveChange}
            onCommitChange={vi.fn()}
            onMeasuredHeight={vi.fn()}
          >
            <p id="text">hello</p>
          </FreeformBlockWrapper>
        </FreeformBlockProvider>,
      ),
    )
    return { onLiveChange, onSelect, text: host.querySelector('#text')! }
  }

  it('a mouse drags it after a few pixels', () => {
    const { onLiveChange, text } = mountBlock()
    gesture(text, 'mouse', [50, 50], [56, 50])
    expect(onLiveChange).toHaveBeenCalled()
  })

  it('a finger needs to travel further before it is a drag, so an ordinary tap that drifts does not move the block', () => {
    const { onLiveChange, onSelect, text } = mountBlock()
    gesture(text, 'touch', [50, 50], [57, 53])
    expect(onLiveChange).not.toHaveBeenCalled()
    expect(onSelect).toHaveBeenCalledWith('el1')
  })

  it('a finger that travels a real distance does drag it', () => {
    const { onLiveChange, text } = mountBlock()
    gesture(text, 'touch', [50, 50], [90, 80])
    expect(onLiveChange).toHaveBeenCalled()
  })
})

describe('tapping text to edit it, on a phone', () => {
  it('re-focuses a tapped label once it is editable, so the phone\'s keyboard opens (a tap focuses it first, while it is not yet editable)', () => {
    const editText = vi.fn()
    act(() =>
      root.render(
        <CanvasEditProvider value={{ editText, updateFrom: vi.fn(), updateTo: vi.fn() } as never}>
          <Label id="issueDate">Issue Date</Label>
        </CanvasEditProvider>,
      ),
    )
    const label = host.querySelector<HTMLElement>('[data-item="label:issueDate"]')!
    // A tap on a focusable element focuses it before the click arrives.
    act(() => label.focus())
    expect(document.activeElement).toBe(label)
    const focused = vi.fn()
    const blurred = vi.fn()
    label.addEventListener('focus', focused)
    label.addEventListener('blur', blurred)
    act(() => label.click())
    // Editing began, kept going (the blur it caused was ignored), and the box was focused afresh.
    expect(label.getAttribute('role')).toBe('textbox')
    expect(label.getAttribute('contenteditable')).toBe('true')
    expect(document.activeElement).toBe(label)
    expect(blurred).toHaveBeenCalledTimes(1)
    expect(focused).toHaveBeenCalledTimes(1)
  })

  it('still ends editing when the user really moves away', () => {
    act(() =>
      root.render(
        <CanvasEditProvider value={{ editText: vi.fn(), updateFrom: vi.fn(), updateTo: vi.fn() } as never}>
          <Label id="issueDate">Issue Date</Label>
        </CanvasEditProvider>,
      ),
    )
    const label = host.querySelector<HTMLElement>('[data-item="label:issueDate"]')!
    act(() => label.click())
    expect(label.getAttribute('role')).toBe('textbox')
    act(() => label.blur())
    expect(label.getAttribute('role')).toBe('button')
  })
})

describe('the editor on a phone-sized screen', () => {
  const originalWidth = window.innerWidth
  beforeEach(() => {
    localStorage.clear()
    useInvoiceStore.getState().startNewInvoice('classic', true)
  })
  afterEach(() => {
    window.innerWidth = originalWidth
  })

  function mountEditor(width: number) {
    window.innerWidth = width
    act(() =>
      root.render(
        <MemoryRouter>
          <EditorLayout />
        </MemoryRouter>,
      ),
    )
  }
  const detailsButton = () => [...host.querySelectorAll<HTMLButtonElement>('nav[aria-label="Tools"] button')].find((b) => b.textContent === 'Details')!
  const workspace = () => host.querySelector<HTMLElement>('main')!

  it('a drawer floats over the page instead of pushing it off the side of the screen', () => {
    mountEditor(375)
    act(() => detailsButton().click())
    expect(host.querySelector('aside[aria-label="Details"]')).not.toBeNull()
    expect(workspace().style.paddingLeft).toBe('24px')
  })

  it('the drawer starts below the style pill, which would otherwise cover its title', () => {
    mountEditor(375)
    act(() => detailsButton().click())
    const panel = host.querySelector('aside[aria-label="Details"]')!.parentElement!
    expect(panel.className).toContain('top-[4.75rem]')
    expect(panel.className).not.toMatch(/(^|\s)top-4(\s|$)/)
  })

  it('on a wide screen the drawer still makes room beside the page, as before', () => {
    mountEditor(1280)
    act(() => detailsButton().click())
    expect(workspace().style.paddingLeft).toBe('328px')
    expect(host.querySelector('aside[aria-label="Details"]')!.parentElement!.className).toMatch(/(^|\s)top-4(\s|$)/)
  })

  it('follows the screen when it turns', () => {
    mountEditor(1280)
    act(() => detailsButton().click())
    expect(workspace().style.paddingLeft).toBe('328px')
    act(() => {
      window.innerWidth = 375
      window.dispatchEvent(new Event('resize'))
    })
    expect(workspace().style.paddingLeft).toBe('24px')
  })

  it('the tool dock can be scrolled sideways, so every tool is reachable on a narrow screen', () => {
    mountEditor(375)
    const dock = host.querySelector('nav[aria-label="Tools"]')!
    expect(dock.className).toContain('overflow-x-auto')
    expect(dock.className).toMatch(/max-w-\[calc\(100%-/)
  })

  it('the top bar leaves out the design name below the small breakpoint, so Download is not squeezed', () => {
    mountEditor(375)
    const name = [...host.querySelectorAll('header p')].find((p) => p.textContent === 'Classic')!
    expect(name.parentElement!.className).toContain('hidden')
    expect(name.parentElement!.className).toContain('sm:block')
  })
})
