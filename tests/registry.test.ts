import { describe, expect, it } from 'vitest'
import { TEMPLATES, getLayoutGroups, getTemplate } from '../src/templates/registry'

describe('template registry', () => {
  it('has exactly 105 entries', () => {
    expect(TEMPLATES.length).toBe(105)
  })

  it('has unique ids', () => {
    const ids = TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('groups presets under 21 layouts of 5 presets each', () => {
    const groups = getLayoutGroups()
    expect(groups.length).toBe(21)
    for (const group of groups) {
      expect(group.presets.length).toBe(5)
    }
  })

  it('falls back to the first template for an unknown id', () => {
    expect(getTemplate('does-not-exist')).toBe(TEMPLATES[0])
  })
})
