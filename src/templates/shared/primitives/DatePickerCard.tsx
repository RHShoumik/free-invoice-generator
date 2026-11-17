import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { onAccentColor } from '../../../lib/contrast'
import {
  addDays,
  addMonths,
  formatLongDate,
  formatMonthYear,
  monthGrid,
  parseIsoDate,
  todayLocalIso,
} from '../../../lib/date'

interface DatePickerCardProps {
  /** ISO `YYYY-MM-DD`. May be empty or invalid — the calendar then opens on the current month with nothing chosen. */
  value: string
  /** CSS color the chosen day is filled with. Defaults to the editor's brand color. */
  accent?: string
  onPick: (iso: string) => void
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** How each navigation key moves the focused day, in days — or in months for PageUp/PageDown. */
const DAY_STEPS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
const MONTH_STEPS: Record<string, number> = { PageUp: -1, PageDown: 1 }

const NAV_BUTTON =
  'flex size-8 items-center justify-center rounded-full text-slate-500 outline-none transition-colors hover:bg-black/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring'

/**
 * The calendar the dates on the invoice open: one month at a time, six weeks
 * tall so the card never changes height as you page. Purely presentational —
 * it holds no popover and no store, so `EditableDate` decides where it shows
 * up and what picking a day does.
 *
 * Keyboard: the focused day is the only tab stop (roving tabindex); arrows
 * move it by a day or a week, PageUp/PageDown by a month, and the visible
 * month follows it. Enter/Space pick the focused day like any button.
 *
 * It lives in a portal outside the invoice page, but React events still
 * bubble through portals to the page's own pointer handlers (the section
 * drag), so pointer presses are stopped at the card's edge.
 */
export function DatePickerCard({ value, accent = 'var(--color-brand)', onPick }: DatePickerCardProps) {
  const today = todayLocalIso()
  const [focused, setFocused] = useState(() => (parseIsoDate(value) ? value : today))
  const gridRef = useRef<HTMLDivElement>(null)
  const moveFocus = useRef(false)

  // Moving by keyboard must also move DOM focus, but only after the (possibly new) month has rendered.
  useEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${focused}"]`)?.focus()
  }, [focused])

  const { year, month } = parseIsoDate(focused) as { year: number; month: number }
  const grid = monthGrid(year, month)
  const textOnAccent = onAccentColor(accent)

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const days = DAY_STEPS[e.key]
    const months = MONTH_STEPS[e.key]
    if (days === undefined && months === undefined) return
    e.preventDefault()
    moveFocus.current = true
    setFocused(days !== undefined ? addDays(focused, days) : addMonths(focused, months))
  }

  return (
    <div
      className="w-72 select-none rounded-2xl bg-white p-4 text-ink shadow-[0_12px_40px_rgb(21_23_26/0.16)] ring-1 ring-black/5"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Previous month" className={NAV_BUTTON} onClick={() => setFocused(addMonths(focused, -1))}>
          <ChevronLeft className="size-4" />
        </button>
        <h3 aria-live="polite" className="text-sm font-semibold tracking-tight">
          {formatMonthYear(year, month)}
        </h3>
        <button type="button" aria-label="Next month" className={NAV_BUTTON} onClick={() => setFocused(addMonths(focused, 1))}>
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div aria-hidden className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium uppercase text-slate-400">
        {WEEKDAYS.map((label, i) => (
          <span key={i} className="py-1">
            {label}
          </span>
        ))}
      </div>

      <div ref={gridRef} className="grid grid-cols-7 gap-y-0.5" onKeyDown={handleKeyDown}>
        {grid.map(({ iso, day, inMonth }) => {
          const selected = iso === value
          const isToday = iso === today
          return (
            <button
              key={iso}
              type="button"
              data-iso={iso}
              aria-label={formatLongDate(iso)}
              aria-pressed={selected}
              aria-current={isToday ? 'date' : undefined}
              tabIndex={iso === focused ? 0 : -1}
              onClick={() => onPick(iso)}
              style={selected ? { backgroundColor: accent, color: textOnAccent } : undefined}
              className={[
                'mx-auto flex size-9 items-center justify-center rounded-full text-sm tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                selected ? 'font-semibold shadow-sm' : 'hover:bg-black/5',
                !selected && !inMonth ? 'text-slate-300' : '',
                !selected && isToday ? 'font-semibold ring-1 ring-inset ring-slate-300' : '',
              ].join(' ')}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex justify-end border-t border-black/5 pt-3">
        <button
          type="button"
          onClick={() => onPick(todayLocalIso())}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-ink outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Today
        </button>
      </div>
    </div>
  )
}
