import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { onAccentColor } from '../src/lib/contrast'
import { DatePickerCard } from '../src/templates/shared/primitives/DatePickerCard'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  // Only the clock is faked — React's scheduler must keep real timers.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 15, 12))
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.useRealTimers()
})

function mount(value: string, onPick: (iso: string) => void = () => {}, accent?: string) {
  act(() => root.render(<DatePickerCard value={value} onPick={onPick} accent={accent} />))
}

const day = (label: string) => host.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)
const header = () => host.querySelector('h3')?.textContent
const press = (el: Element | null) => act(() => (el as HTMLElement).click())
const button = (name: string) => [...host.querySelectorAll('button')].find((b) => b.textContent === name || b.getAttribute('aria-label') === name) ?? null
function key(k: string) {
  act(() => {
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
  })
}

describe('onAccentColor', () => {
  it('uses dark text on a light accent and white on a dark one', () => {
    expect(onAccentColor('#facc15')).toBe('#0f172a')
    expect(onAccentColor('#1e3a8a')).toBe('#ffffff')
  })

  it('falls back to white for something that is not a hex color', () => {
    expect(onAccentColor('not a color')).toBe('#ffffff')
  })
})

describe('DatePickerCard', () => {
  it('shows the month of the date, with that day (and only that day) marked as chosen', () => {
    mount('2026-11-15')
    expect(header()).toBe('November 2026')
    const chosen = host.querySelectorAll('[aria-pressed="true"]')
    expect(chosen).toHaveLength(1)
    expect(chosen[0].getAttribute('aria-label')).toBe('Sunday, November 15, 2026')
  })

  it('marks today, and paints the chosen day in the accent with readable text', () => {
    mount('2026-11-15', undefined, '#facc15')
    const today = day('Sunday, November 15, 2026')!
    expect(today.getAttribute('aria-current')).toBe('date')
    expect(today.style.backgroundColor).toBe('rgb(250, 204, 21)')
    expect(today.style.color).toBe('rgb(15, 23, 42)')
    expect(day('Monday, November 16, 2026')!.getAttribute('aria-current')).toBeNull()
  })

  it.each(['', 'garbage'])('opens on the current month with nothing chosen for %j', (value) => {
    mount(value)
    expect(header()).toBe('November 2026')
    expect(host.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0)
  })

  it('pages forward and back between months', () => {
    mount('2026-11-15')
    press(button('Next month'))
    expect(header()).toBe('December 2026')
    press(button('Previous month'))
    press(button('Previous month'))
    expect(header()).toBe('October 2026')
  })

  it('pages back across a year end', () => {
    mount('2026-01-10')
    press(button('Previous month'))
    expect(header()).toBe('December 2025')
  })

  it('picks the day that was clicked', () => {
    const onPick = vi.fn()
    mount('2026-11-15', onPick)
    press(day('Wednesday, November 18, 2026'))
    expect(onPick).toHaveBeenCalledTimes(1)
    expect(onPick).toHaveBeenCalledWith('2026-11-18')
  })

  it('also picks a greyed-out day from the neighbouring month', () => {
    const onPick = vi.fn()
    mount('2026-11-15', onPick)
    press(button('Next month'))
    press(day('Sunday, November 29, 2026'))
    expect(onPick).toHaveBeenCalledWith('2026-11-29')
  })

  it('"Today" picks today', () => {
    const onPick = vi.fn()
    mount('2026-03-02', onPick)
    press(button('Today'))
    expect(onPick).toHaveBeenCalledWith('2026-11-15')
  })

  it('moves focus with the arrow keys and pages months with PageUp/PageDown', () => {
    mount('2026-11-15')
    day('Sunday, November 15, 2026')!.focus()
    key('ArrowRight')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Monday, November 16, 2026')
    key('ArrowDown')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Monday, November 23, 2026')
    key('PageDown')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Wednesday, December 23, 2026')
    expect(header()).toBe('December 2026')
  })

  it('follows the focused day into the previous month', () => {
    mount('2026-12-01')
    day('Tuesday, December 1, 2026')!.focus()
    key('ArrowLeft')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Monday, November 30, 2026')
    expect(header()).toBe('November 2026')
  })

  it('keeps a press inside the card from reaching the invoice page underneath', () => {
    const outer = vi.fn()
    act(() =>
      root.render(
        <div onPointerDown={outer}>
          <DatePickerCard value="2026-11-15" onPick={() => {}} />
        </div>,
      ),
    )
    const press = (el: Element) => act(() => void el.dispatchEvent(new Event('pointerdown', { bubbles: true })))
    press(host.firstElementChild!) // proves the harness reaches the wrapper
    expect(outer).toHaveBeenCalledTimes(1)
    press(day('Sunday, November 15, 2026')!)
    expect(outer).toHaveBeenCalledTimes(1)
  })
})
