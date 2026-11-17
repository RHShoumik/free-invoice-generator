export function formatDate(isoDate: string): string {
  if (!isoDate) return '—'
  const d = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/*
 * Calendar helpers for the date picker. A date here is always an ISO
 * `YYYY-MM-DD` string — the same thing `invoice.issueDate` stores. The maths
 * goes through `Date.UTC` so a daylight-saving change can never turn "add one
 * day" into 23 or 25 hours, and a string is never handed to `new Date()`
 * (`new Date('2026-11-15')` is midnight *UTC*, which is the previous evening
 * in the Americas). Months are 1–12 throughout.
 */

export interface DateParts {
  year: number
  month: number
  day: number
}

export interface CalendarDay {
  iso: string
  day: number
  /** False for the leading/trailing days that fill out the first and last week from the neighbouring months. */
  inMonth: boolean
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

export function toIsoDate({ year, month, day }: DateParts): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`
}

/** The parts of a real, zero-padded ISO date; null for anything else (empty, junk, `2026-02-30`). */
export function parseIsoDate(iso: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  const check = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  const real =
    check.getUTCFullYear() === parts.year && check.getUTCMonth() === parts.month - 1 && check.getUTCDate() === parts.day
  return real ? parts : null
}

function fromUtc(ms: number): string {
  const d = new Date(ms)
  return toIsoDate({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() })
}

/** Today's date on the user's own calendar — not `toISOString()`, which is the UTC day and runs a day behind east of Greenwich after midnight. */
export function todayLocalIso(): string {
  const now = new Date()
  return toIsoDate({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() })
}

/** Six full weeks (Sunday first) around the month, so the calendar never changes height as you page through. */
export function monthGrid(year: number, month: number): CalendarDay[] {
  const firstOfMonth = Date.UTC(year, month - 1, 1)
  const leading = new Date(firstOfMonth).getUTCDay()
  const start = firstOfMonth - leading * 86_400_000
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start + i * 86_400_000)
    return {
      iso: fromUtc(d.getTime()),
      day: d.getUTCDate(),
      inMonth: d.getUTCMonth() === month - 1 && d.getUTCFullYear() === year,
    }
  })
}

/** Falls back to today for an unparseable date, so callers never have to handle "no date". */
function partsOrToday(iso: string): DateParts {
  return parseIsoDate(iso) ?? (parseIsoDate(todayLocalIso()) as DateParts)
}

export function addDays(iso: string, days: number): string {
  const { year, month, day } = partsOrToday(iso)
  return fromUtc(Date.UTC(year, month - 1, day + days))
}

/** Moves by whole months, landing on the last day of the target month when it is shorter (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(iso: string, months: number): string {
  const { year, month, day } = partsOrToday(iso)
  const target = new Date(Date.UTC(year, month - 1 + months, 1))
  const daysInTarget = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  return toIsoDate({ year: target.getUTCFullYear(), month: target.getUTCMonth() + 1, day: Math.min(day, daysInTarget) })
}

export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** `Sunday, November 15, 2026` — the accessible name of a day in the calendar. */
export function formatLongDate(iso: string): string {
  const { year, month, day } = partsOrToday(iso)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
