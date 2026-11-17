import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { AUTHOR, HERO, ROBOTS_INDEX, ROBOTS_NOINDEX } from '../src/lib/site'
import { GUIDES_HEADING, SEO_PAGES } from '../src/lib/seoPages'
import { useInvoiceStore } from '../src/store/invoiceStore'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const observer = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = observer
  ;(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = observer
})

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  localStorage.clear()
  useInvoiceStore.getState().startNewInvoice('modern-minimal', true)
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.unstubAllEnvs()
  document.head.querySelectorAll('meta[name="description"], meta[name="robots"], link[rel="canonical"]').forEach((el) => el.remove())
  document.title = ''
})

function mount(path: string) {
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    ),
  )
}

const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
const headMeta = (name: string) => document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content
const canonical = () => document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href

describe.each(SEO_PAGES.map((p) => [p.path, p] as const))('the page at %s', (path, page) => {
  it('has one main heading, and sections in order, then the FAQ and related pages', () => {
    mount(path)
    expect(host.querySelectorAll('h1')).toHaveLength(1)
    expect(text(host.querySelector('h1'))).toBe(page.h1)
    expect([...host.querySelectorAll('article h2')].map((h) => text(h))).toEqual([
      ...page.sections.map((s) => s.heading),
      'Frequently asked questions',
      'Related guides and tools',
    ])
  })

  it('shows every word of the page\'s content — what the build writes for crawlers is what visitors read', () => {
    mount(path)
    const shown = text(host.querySelector('article'))
    const expected: string[] = [page.kicker, page.intro]
    for (const s of page.sections) {
      expected.push(s.heading, ...(s.paragraphs ?? []), ...(s.bullets ?? []), ...(s.closing ?? []))
      for (const step of s.steps ?? []) expected.push(step.title, step.text)
      for (const item of s.list ?? []) expected.push(item.term, item.text)
      if (s.table) expected.push(...s.table.head, ...s.table.rows.flat())
    }
    for (const q of page.faq) expected.push(q.question, q.answer)
    for (const piece of expected) expect(shown, piece.slice(0, 50)).toContain(piece)
  })

  it('sets its own title, description and canonical link, and may be indexed', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://invoices.example.com/')
    mount(path)
    expect(document.title).toBe(page.title)
    expect(headMeta('description')).toBe(page.description)
    expect(headMeta('robots')).toBe(ROBOTS_INDEX)
    expect(canonical()).toBe(`https://invoices.example.com${path}`)
  })

  it('has a breadcrumb home, a way into the editor, the developer credit, and links only to real pages', () => {
    mount(path)
    expect(host.querySelector('nav[aria-label="Breadcrumb"] a[href="/"]')).not.toBeNull()
    expect(host.querySelector('nav[aria-label="Breadcrumb"] [aria-current="page"]')?.textContent).toBe(page.h1)
    expect(host.querySelector(`footer a[href="${AUTHOR.url}"]`)?.textContent).toBe('rhshoumik')
    const known = new Set(['/', '/editor', ...SEO_PAGES.map((p) => p.path)])
    for (const a of host.querySelectorAll<HTMLAnchorElement>('a[href^="/"]')) expect(known.has(a.getAttribute('href')!), a.getAttribute('href')!).toBe(true)
    const related = [...host.querySelectorAll<HTMLAnchorElement>('article section:last-of-type a')].map((a) => a.getAttribute('href'))
    expect(related).toEqual(page.related)
  })

  it('"Create an invoice in one click" starts a ready-made invoice and opens the editor', () => {
    mount(path)
    const cta = [...host.querySelectorAll<HTMLAnchorElement>('article a')].find((a) => a.textContent?.startsWith(HERO.cta))!
    expect(cta.getAttribute('href')).toBe('/editor')
    act(() => cta.click())
    expect(useInvoiceStore.getState().invoice.templateId).toBe('classic')
    expect(host.querySelector('nav[aria-label="Tools"]')).not.toBeNull()
  })
})

describe('tables', () => {
  it('are real tables with a hidden caption and column headers', () => {
    mount('/invoice-payment-terms')
    const table = host.querySelector('table')!
    expect(table.querySelector('caption')?.textContent).toBe('Common payment terms')
    expect([...table.querySelectorAll('th[scope="col"]')].map((th) => th.textContent)).toEqual(['Term', 'What it means', 'Good for'])
    expect(table.querySelectorAll('tbody tr')).toHaveLength(8)
  })
})

describe('an address the app does not know', () => {
  it('says so, keeps itself out of search results, has no canonical link, and points home', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://invoices.example.com')
    mount('/no-such-page')
    expect(text(host.querySelector('h1'))).toBe('Page not found')
    expect(headMeta('robots')).toBe(ROBOTS_NOINDEX)
    expect(canonical()).toBeUndefined()
    expect(document.title).toContain('Page not found')
    expect(host.querySelector('a[href="/"]')).not.toBeNull()
  })
})

describe('the home page links to every content page', () => {
  it('from a section of its own, and from the footer', () => {
    mount('/')
    expect(text(host.querySelector('#guides h2'))).toBe(GUIDES_HEADING)
    const cards = [...host.querySelectorAll<HTMLAnchorElement>('#guides a')].map((a) => a.getAttribute('href'))
    expect(cards).toEqual(SEO_PAGES.map((p) => p.path))
    const footer = [...host.querySelectorAll<HTMLAnchorElement>('footer nav[aria-label="Guides"] a')].map((a) => a.getAttribute('href'))
    expect(footer).toEqual(['/', ...SEO_PAGES.map((p) => p.path)])
  })
})

describe('moving between pages', () => {
  it('starts the next page at its top — not wherever the link was — but leaves the first load and #section links alone', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    mount('/')
    expect(scrollTo).not.toHaveBeenCalled()
    act(() => host.querySelector<HTMLAnchorElement>('#guides a[href="/invoice-payment-terms"]')!.click())
    expect(text(host.querySelector('h1'))).toBe('Invoice payment terms: examples and how to choose')
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
    act(() => host.querySelector<HTMLAnchorElement>('footer nav a[href="/freelance-invoice-generator"]')!.click())
    expect(scrollTo).toHaveBeenCalledTimes(2)
    scrollTo.mockRestore()
  })
})
