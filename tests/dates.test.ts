import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addDays,
  addMonths,
  formatDate,
  formatLongDate,
  formatMonthYear,
  monthGrid,
  parseIsoDate,
  toIsoDate,
  todayLocalIso,
} from '../src/lib/date'

afterEach(() => vi.useRealTimers())

describe('parseIsoDate / toIsoDate', () => {
  it('reads a valid ISO date into its parts', () => {
    expect(parseIsoDate('2026-11-15')).toEqual({ year: 2026, month: 11, day: 15 })
  })

  it.each(['', 'garbage', '2026-02-30', '2026-13-01', '2026-1-5'])('rejects %j', (bad) => {
    expect(parseIsoDate(bad)).toBeNull()
  })

  it('writes parts back as a zero-padded ISO date', () => {
    expect(toIsoDate({ year: 2026, month: 3, day: 5 })).toBe('2026-03-05')
  })
})

describe('monthGrid', () => {
  it('lays out November 2026 (starts on a Sunday) as 42 cells', () => {
    const grid = monthGrid(2026, 11)
    expect(grid).toHaveLength(42)
    expect(grid[0]).toEqual({ iso: '2026-11-01', day: 1, inMonth: true })
    expect(grid[29].iso).toBe('2026-11-30')
    expect(grid[30]).toEqual({ iso: '2026-12-01', day: 1, inMonth: false })
    expect(grid[41].iso).toBe('2026-12-12')
  })

  it('pads the start of December 2026 (starts on a Tuesday) with the end of November', () => {
    const grid = monthGrid(2026, 12)
    expect(grid[0]).toEqual({ iso: '2026-11-29', day: 29, inMonth: false })
    expect(grid[2]).toEqual({ iso: '2026-12-01', day: 1, inMonth: true })
  })

  it('knows February has 29 days in a leap year and 28 otherwise', () => {
    const leap = monthGrid(2028, 2).filter((d) => d.inMonth)
    expect(leap).toHaveLength(29)
    expect(leap[28].iso).toBe('2028-02-29')
    expect(monthGrid(2027, 2).filter((d) => d.inMonth)).toHaveLength(28)
  })
})

describe('addMonths / addDays', () => {
  it('clamps to the end of a shorter month instead of spilling into the next', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29')
  })

  it('rolls the year over in both directions', () => {
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15')
  })

  it('moves by days across month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('todayLocalIso', () => {
  it('uses the local calendar day, even just after local midnight', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 15, 0, 30))
    expect(todayLocalIso()).toBe('2026-11-15')
  })
})

describe('formatting', () => {
  it('formats the calendar header and long labels', () => {
    expect(formatMonthYear(2026, 11)).toBe('November 2026')
    expect(formatLongDate('2026-11-15')).toBe('Sunday, November 15, 2026')
  })

  it('keeps formatDate exactly as it was', () => {
    expect(formatDate('2026-11-15')).toBe('Nov 15, 2026')
    expect(formatDate('')).toBe('—')
  })
})
