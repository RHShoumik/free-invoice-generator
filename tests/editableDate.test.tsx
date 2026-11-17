import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { CanvasEditProvider } from '../src/templates/shared/CanvasEditContext'
import { EditableDate } from '../src/templates/shared/primitives'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  // Radix's popover positions itself with a ResizeObserver, which jsdom doesn't have.
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

let host: HTMLDivElement
let root: Root
const updateField = vi.fn()

beforeEach(() => {
  updateField.mockReset()
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

function edit(accentColor?: string) {
  return { updateField, accentColor } as never
}

function mount(value: string, field: 'issueDate' | 'dueDate' = 'issueDate', accentColor?: string, wrap?: (child: React.ReactNode) => React.ReactNode) {
  const child = (
    <CanvasEditProvider value={edit(accentColor)}>
      <EditableDate value={value} field={field} />
    </CanvasEditProvider>
  )
  act(() => root.render(wrap ? wrap(child) : child))
}

const trigger = () => host.querySelector<HTMLElement>('[data-editable-date]')!
const dialog = () => document.body.querySelector('[role="dialog"]')
const day = (label: string) => document.body.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)
const click = (el: Element | null) => act(() => (el as HTMLElement).click())
const keydown = (el: Element, k: string) => act(() => void el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })))
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 20))))

describe('EditableDate outside the live editor', () => {
  it('is exactly the formatted date — no wrapper, no role, nothing to click', () => {
    const html = renderToStaticMarkup(<EditableDate value="2026-11-15" field="issueDate" />)
    expect(html).toBe('Nov 15, 2026')
  })
})

describe('EditableDate in the live editor', () => {
  it('is a focusable span (not a <button>, so the section can still be dragged by it)', () => {
    mount('2026-11-15')
    const el = trigger()
    expect(el.tagName).toBe('SPAN')
    expect(el.getAttribute('role')).toBe('button')
    expect(el.getAttribute('tabindex')).toBe('0')
    expect(el.getAttribute('data-editable-date')).toBe('issueDate')
    expect(el.textContent).toBe('Nov 15, 2026')
    expect(el.getAttribute('aria-label')).toBe('Change issue date')
  })

  it('names the due date for assistive tech', () => {
    mount('2026-11-29', 'dueDate')
    expect(trigger().getAttribute('data-editable-date')).toBe('dueDate')
    expect(trigger().getAttribute('aria-label')).toBe('Change due date')
  })

  it('opens the calendar on click and writes the picked day to the invoice', () => {
    mount('2026-11-15')
    expect(dialog()).toBeNull()
    click(trigger())
    expect(dialog()).not.toBeNull()
    expect(dialog()!.querySelector('h3')!.textContent).toBe('November 2026')

    click(day('Wednesday, November 18, 2026'))
    expect(updateField).toHaveBeenCalledTimes(1)
    expect(updateField).toHaveBeenCalledWith('issueDate', '2026-11-18')
    expect(dialog()).toBeNull()
  })

  it('writes a due date to dueDate', () => {
    mount('2026-11-29', 'dueDate')
    click(trigger())
    click(day('Monday, November 30, 2026'))
    expect(updateField).toHaveBeenCalledWith('dueDate', '2026-11-30')
  })

  it('opens from the keyboard with Enter or Space, and ignores other keys', () => {
    mount('2026-11-15')
    keydown(trigger(), 'a')
    expect(dialog()).toBeNull()
    keydown(trigger(), 'Enter')
    expect(dialog()).not.toBeNull()
    keydown(document.activeElement!, 'Escape')
  })

  it('opens with Space too', async () => {
    mount('2026-11-15')
    keydown(trigger(), ' ')
    expect(dialog()).not.toBeNull()
  })

  it('puts focus on the chosen day when it opens, so the arrow keys work straight away', async () => {
    mount('2026-11-15')
    click(trigger())
    await settle()
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Sunday, November 15, 2026')
  })

  it('closes on Escape and hands focus back to the date', async () => {
    mount('2026-11-15')
    click(trigger())
    await settle()
    keydown(document.activeElement!, 'Escape')
    await settle()
    expect(dialog()).toBeNull()
    expect(document.activeElement).toBe(trigger())
    expect(updateField).not.toHaveBeenCalled()
  })

  it('still shows and opens an empty date (as an em dash) and an unreadable one (as typed)', () => {
    mount('')
    expect(trigger().textContent).toBe('—')
    click(trigger())
    expect(dialog()).not.toBeNull()
    keydown(document.activeElement!, 'Escape')

    mount('garbage')
    expect(trigger().textContent).toBe('garbage')
  })

  it('fills the chosen day with the invoice accent color', () => {
    mount('2026-11-15', 'issueDate', '#facc15')
    click(trigger())
    expect(day('Sunday, November 15, 2026')!.style.backgroundColor).toBe('rgb(250, 204, 21)')
  })

  it('keeps presses in the calendar from reaching the invoice page it floats over', () => {
    const outer = vi.fn()
    mount('2026-11-15', 'issueDate', undefined, (child) => <div onPointerDown={outer}>{child}</div>)
    click(trigger())
    const press = (el: Element) => act(() => void el.dispatchEvent(new Event('pointerdown', { bubbles: true })))
    press(trigger()) // the harness reaches the wrapper through the date itself
    expect(outer).toHaveBeenCalledTimes(1)
    press(day('Sunday, November 15, 2026')!)
    expect(outer).toHaveBeenCalledTimes(1)
  })
})
