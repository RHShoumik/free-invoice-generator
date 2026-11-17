import { describe, expect, it } from 'vitest'
import { migrateFreeformLayout } from '../src/store/invoiceStore'
import { defaultFreeformLayout } from '../src/types/invoice'

describe('migrateFreeformLayout', () => {
  it('passes an already-array (current shape) through unchanged', () => {
    const current = defaultFreeformLayout()
    expect(migrateFreeformLayout(current)).toBe(current)
  })

  it('converts the old Record<blockId, rect> shape into an array, preserving custom positions', () => {
    const old = {
      logo: { x: 100, y: 200, width: 90 },
      from: { x: 10, y: 20, width: 340 },
      to: { x: 430, y: 170, width: 316 },
      meta: { x: 470, y: 48, width: 276 },
      items: { x: 48, y: 380, width: 698 },
      totals: { x: 470, y: 680, width: 276 },
      footer: { x: 48, y: 820, width: 698 },
      signature: { x: 48, y: 950, width: 698 },
    }
    const migrated = migrateFreeformLayout(old)
    expect(migrated).toHaveLength(8)

    const logo = migrated.find((el) => el.kind === 'logo')
    expect(logo).toMatchObject({ x: 100, y: 200, width: 90 })

    const from = migrated.find((el) => el.kind === 'from')
    expect(from).toMatchObject({ x: 10, y: 20, width: 340 })
  })

  it('falls back to the default layout for missing or garbage input', () => {
    expect(migrateFreeformLayout(undefined)).toEqual(defaultFreeformLayout())
    expect(migrateFreeformLayout(null)).toEqual(defaultFreeformLayout())
    expect(migrateFreeformLayout('not an object')).toEqual(defaultFreeformLayout())
  })
})
