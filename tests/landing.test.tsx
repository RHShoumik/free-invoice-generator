import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { EditorLayout } from '../src/features/invoice-editor/EditorLayout'
import { TemplateGallery } from '../src/features/template-gallery/TemplateGallery'
import {
  AUTHOR,
  FAQ,
  FAQ_HEADING,
  FEATURES,
  FEATURES_HEADING,
  HERO,
  HOW_IT_WORKS,
  HOW_IT_WORKS_HEADING,
  ROBOTS_INDEX,
  ROBOTS_NOINDEX,
  SEO_DESCRIPTION,
  SEO_TITLE,
} from '../src/lib/site'
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

function mount(path = '/') {
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<TemplateGallery />} />
          <Route path="/editor" element={<EditorLayout />} />
        </Routes>
      </MemoryRouter>,
    ),
  )
}

const headMeta = (name: string) => document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content
const canonical = () => document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href
const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, ' ').trim()

describe('the landing page', () => {
  it('has exactly one main heading, and it says "free invoice generator"', () => {
    mount()
    const h1s = host.querySelectorAll('h1')
    expect(h1s).toHaveLength(1)
    expect(text(h1s[0]).toLowerCase()).toContain('free invoice generator')
    expect(text(h1s[0])).toContain(HERO.headline)
  })

  it('lays out its sections as a proper outline: templates, how it works, features, FAQ', () => {
    mount()
    const h2s = [...host.querySelectorAll('h2')].map((h) => text(h))
    expect(h2s).toEqual(['Choose a free invoice template', HOW_IT_WORKS_HEADING, FEATURES_HEADING, FAQ_HEADING])
    // The design groups sit one level under the templates heading.
    expect(host.querySelectorAll('#templates h3').length).toBeGreaterThanOrEqual(21)
  })

  it('prints every step, feature and FAQ answer in full on the page', () => {
    mount()
    const page = text(host)!
    for (const step of HOW_IT_WORKS) expect(page).toContain(step.title)
    for (const feature of FEATURES) expect(page).toContain(feature.title)
    for (const faq of FAQ) {
      expect(page).toContain(faq.question)
      expect(page).toContain(faq.answer)
    }
  })

  it('links its own sections from the top, each to a section that exists', () => {
    mount()
    const links = [...host.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Page sections"] a')]
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#templates', '#how-it-works', '#features', '#faq'])
    for (const a of links) expect(host.querySelector(a.getAttribute('href')!)).not.toBeNull()
  })

  it('"Create an invoice in one click" is a real link to the editor that starts a ready-made invoice', () => {
    mount()
    const cta = [...host.querySelectorAll<HTMLAnchorElement>('a')].find((a) => a.textContent?.startsWith(HERO.cta))!
    expect(cta.getAttribute('href')).toBe('/editor')
    act(() => cta.click())
    expect(useInvoiceStore.getState().invoice.templateId).toBe('classic')
    // …and it went to the editor.
    expect(host.querySelector('nav[aria-label="Tools"]')).not.toBeNull()
  })

  it('credits the developer with a link to their website', () => {
    mount()
    const link = host.querySelector<HTMLAnchorElement>(`footer a[href="${AUTHOR.url}"]`)!
    expect(link.textContent).toBe('rhshoumik')
    expect(link.closest('p')?.textContent).toBe('Developed by rhshoumik')
    expect(link.rel).toContain('noopener')
    // A real, followed link: no nofollow, so the link counts for the developer's site.
    expect(link.rel).not.toContain('nofollow')
    expect(link.target).toBe('_blank')
  })
})

describe('the tags each page sets while it is on screen', () => {
  it('the landing page is for search engines: its title, description, and permission to index', () => {
    mount()
    expect(document.title).toBe(SEO_TITLE)
    expect(headMeta('description')).toBe(SEO_DESCRIPTION)
    expect(headMeta('robots')).toBe(ROBOTS_INDEX)
  })

  it('has no canonical link until the site has an address, then names the home page', () => {
    mount()
    expect(canonical()).toBeUndefined()
    act(() => root.unmount())
    root = createRoot(host)
    vi.stubEnv('VITE_SITE_URL', 'https://Invoices.Example.com/')
    mount()
    expect(canonical()).toBe('https://invoices.example.com/')
  })

  it('the editor keeps itself out of search results and drops the canonical link', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://invoices.example.com')
    mount('/editor')
    expect(headMeta('robots')).toBe(ROBOTS_NOINDEX)
    expect(document.title).toContain('Invoice editor')
    expect(canonical()).toBeUndefined()
  })

  it('credits the developer in the editor too — outside the invoice page, so never in an export', () => {
    mount('/editor')
    const link = host.querySelector<HTMLAnchorElement>(`a[href="${AUTHOR.url}"]`)!
    expect(link.closest('p')?.textContent).toBe('Developed by rhshoumik')
    expect(link.closest('#invoice-print-surface')).toBeNull()
    expect(host.querySelector('#invoice-print-surface')?.textContent).not.toContain('rhshoumik')
  })
})
