import { describe, expect, it } from 'vitest'
import { CURRENCY_OPTIONS } from '../src/lib/currency'
import { LAYOUT_STYLES, SEO_PAGES, pageText, wordCount } from '../src/lib/seoPages'
import { FEATURES, SEO_DESCRIPTION } from '../src/lib/site'
import { TEMPLATES, getLayoutGroups } from '../src/templates/registry'

const paths = SEO_PAGES.map((p) => p.path)
const money = (text: string) => Number(text.replace(/[^0-9.]/g, ''))

describe('the content pages', () => {
  it('there are the five pages the plan calls for, each answering a different search', () => {
    expect(paths).toEqual([
      '/freelance-invoice-generator',
      '/invoice-generator-no-sign-up',
      '/how-to-write-an-invoice',
      '/invoice-template-pdf',
      '/invoice-payment-terms',
    ])
  })

  it('each lives at its own clean address: lowercase words and hyphens, no clash with the home page or the editor', () => {
    expect(new Set(paths).size).toBe(paths.length)
    for (const path of paths) {
      expect(path).toMatch(/^\/[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(['/', '/editor']).not.toContain(path)
    }
  })

  describe.each(SEO_PAGES.map((p) => [p.path, p] as const))('%s', (_path, page) => {
    it('has a title and description that fit a search result, and each says the phrase the page is about', () => {
      expect(page.title.length).toBeLessThanOrEqual(65)
      expect(page.description.length).toBeGreaterThanOrEqual(90)
      expect(page.description.length).toBeLessThanOrEqual(160)
      for (const text of [page.title, page.h1, page.description]) expect(text.toLowerCase()).toContain(page.keyword)
    })

    it('is real content, not a thin page: enough words, several sections, a FAQ of its own', () => {
      expect(wordCount(page)).toBeGreaterThanOrEqual(450)
      expect(page.sections.length).toBeGreaterThanOrEqual(4)
      expect(page.faq.length).toBeGreaterThanOrEqual(3)
      for (const q of page.faq) {
        expect(q.question.endsWith('?')).toBe(true)
        expect(q.answer.length).toBeGreaterThan(40)
      }
    })

    it('has a title and description of its own, not the home page\'s', () => {
      expect(page.title).not.toBe('')
      expect(page.description).not.toBe(SEO_DESCRIPTION)
      expect(SEO_PAGES.filter((p) => p.title === page.title)).toHaveLength(1)
      expect(SEO_PAGES.filter((p) => p.description === page.description)).toHaveLength(1)
    })

    it('links only to pages that exist, never to itself', () => {
      expect(page.related.length).toBeGreaterThanOrEqual(2)
      for (const link of page.related) {
        expect(paths).toContain(link)
        expect(link).not.toBe(page.path)
      }
    })

    it('has tables whose rows all have a cell for every column', () => {
      for (const section of page.sections) {
        if (!section.table) continue
        for (const row of section.table.rows) expect(row).toHaveLength(section.table.head.length)
      }
    })

    it('does not advertise a Word export, which the app no longer has', () => {
      expect(pageText(page)).not.toMatch(/docx|\bword (document|export|file|template)s?\b|microsoft word|\bms word\b/i)
    })

    it('has a modified date in ISO form', () => {
      expect(page.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it('the how-to guide\'s worked example adds up', () => {
    const guide = SEO_PAGES.find((p) => p.path === '/how-to-write-an-invoice')!
    const table = guide.sections.find((s) => s.table)!.table!
    const amounts = table.rows.map((r) => money(r[r.length - 1]))
    const lines = table.rows.map((r) => money(r[1]) * money(r[2]))
    expect(amounts).toEqual(lines)
    const subtotal = amounts.reduce((a, b) => a + b, 0)
    const summary = pageText(guide).match(/Subtotal \$([\d,.]+) · Tax \((\d+)%\) \$([\d,.]+) · Total due \$([\d,.]+)/)!
    expect(summary).not.toBeNull()
    expect(money(summary[1])).toBeCloseTo(subtotal, 2)
    expect(money(summary[3])).toBeCloseTo((subtotal * Number(summary[2])) / 100, 2)
    expect(money(summary[4])).toBeCloseTo(subtotal * (1 + Number(summary[2]) / 100), 2)
  })
})

describe('the claims the pages make about the app are true', () => {
  const all = SEO_PAGES.map(pageText).join('\n')

  it('lists exactly the layouts the app has, by their real names', () => {
    const real = getLayoutGroups().map((g) => g.layoutName)
    expect(LAYOUT_STYLES.map((l) => l.name)).toEqual(real)
    expect(real).toHaveLength(21)
    for (const name of real) expect(all).toContain(name)
  })

  it('says 105 designs, 21 layouts and 10 currencies — which is what there are', () => {
    expect(TEMPLATES).toHaveLength(105)
    expect(all).toContain('105')
    expect(all).toContain('21 layouts')
    expect(CURRENCY_OPTIONS).toHaveLength(10)
    // The currency count is a home-page feature (src/lib/site.ts).
    expect(FEATURES.map((f) => f.title + f.text).join(' ')).toContain('10 currencies')
  })

  it('never claims a feature the app does not have', () => {
    expect(all.toLowerCase()).not.toMatch(/recurring invoices (are|you can)|send(s)? reminders automatically|online payments? (button|link) (is|are) included/)
  })
})
