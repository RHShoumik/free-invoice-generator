import { describe, expect, it } from 'vitest'
import {
  EDITOR_PAGE,
  buildHeadTags,
  buildNoscript,
  buildSitemapXml,
  injectSeo,
  renderPageHtml,
  serializeTag,
  stripSeoMarkers,
} from '../src/lib/seo'
import type { HeadTag } from '../src/lib/seo'
import { AUTHOR, FAQ, ROBOTS_INDEX, ROBOTS_NOINDEX, SEO_TITLE } from '../src/lib/site'
import { HOME_UPDATED, SEO_PAGES } from '../src/lib/seoPages'

const SITE = 'https://invoices.example.com'
const howTo = SEO_PAGES.find((p) => p.path === '/how-to-write-an-invoice')! // an article, with $ in its table
const freelance = SEO_PAGES.find((p) => p.path === '/freelance-invoice-generator')! // a plain page

const meta = (tags: HeadTag[], key: 'name' | 'property', value: string) => tags.find((t) => t.tag === 'meta' && t.attrs?.[key] === value)?.attrs?.content
const link = (tags: HeadTag[], rel: string) => tags.filter((t) => t.tag === 'link' && t.attrs?.rel === rel)
const graph = (tags: HeadTag[]) => {
  const script = tags.find((t) => t.tag === 'script' && t.attrs?.type === 'application/ld+json')
  return script ? (JSON.parse(script.children as string)['@graph'] as Array<Record<string, any>>) : null
}
const node = (tags: HeadTag[], type: string) => graph(tags)?.find((n) => n['@type'] === type)

describe('head tags for a content page', () => {
  const tags = buildHeadTags(SITE, howTo)

  it('has its own title and description, and may be indexed', () => {
    expect(tags.find((t) => t.tag === 'title')?.children).toBe(howTo.title)
    expect(tags.find((t) => t.tag === 'title')?.children).not.toBe(SEO_TITLE)
    expect(meta(tags, 'name', 'description')).toBe(howTo.description)
    expect(meta(tags, 'name', 'robots')).toBe(ROBOTS_INDEX)
  })

  it('names the page itself as canonical — not the home page — and as its social-card address', () => {
    expect(link(tags, 'canonical').map((t) => t.attrs?.href)).toEqual([`${SITE}${howTo.path}`])
    expect(meta(tags, 'property', 'og:url')).toBe(`${SITE}${howTo.path}`)
    expect(meta(tags, 'property', 'og:title')).toBe(howTo.title)
    expect(meta(tags, 'property', 'og:image')).toBe(`${SITE}/og-image.png`)
  })

  it('has no keywords meta tag (it is worth nothing and the page text carries the phrase)', () => {
    expect(meta(tags, 'name', 'keywords')).toBeUndefined()
  })

  it('describes a guide as an article by the developer, with a breadcrumb and its own FAQ', () => {
    expect(graph(tags)!.map((n) => n['@type'])).toEqual(['Article', 'BreadcrumbList', 'FAQPage'])
    const article = node(tags, 'Article')!
    expect(article.headline).toBe(howTo.h1)
    expect(article.dateModified).toBe(howTo.updated)
    expect(article.author).toMatchObject({ '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url })
    expect(article.mainEntityOfPage).toBe(`${SITE}${howTo.path}`)
    const crumbs = node(tags, 'BreadcrumbList')!.itemListElement
    expect(crumbs).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: howTo.h1, item: `${SITE}${howTo.path}` },
    ])
    const faq = node(tags, 'FAQPage')!.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>
    expect(faq.map((q) => [q.name, q.acceptedAnswer.text])).toEqual(howTo.faq.map((q) => [q.question, q.answer]))
  })

  it('describes a tool page as a web page, not as the app (that is the home page\'s job)', () => {
    const t = buildHeadTags(SITE, freelance)
    expect(graph(t)!.map((n) => n['@type'])).toEqual(['WebPage', 'BreadcrumbList', 'FAQPage'])
    expect(node(t, 'WebApplication')).toBeUndefined()
    expect(node(t, 'WebPage')!.url).toBe(`${SITE}${freelance.path}`)
  })

  it('without a site address it still has its words and FAQ, but publishes no address and no breadcrumb', () => {
    const t = buildHeadTags(null, howTo)
    expect(link(t, 'canonical')).toHaveLength(0)
    expect(meta(t, 'property', 'og:url')).toBeUndefined()
    expect(meta(t, 'property', 'og:image')).toBeUndefined()
    expect(node(t, 'BreadcrumbList')).toBeUndefined()
    expect(node(t, 'Article')).not.toHaveProperty('mainEntityOfPage')
    expect(node(t, 'FAQPage')).toBeDefined()
  })

  it('still carries the icons, the manifest and the author', () => {
    expect(link(tags, 'manifest')).toHaveLength(1)
    expect(meta(tags, 'name', 'author')).toBe(AUTHOR.name)
  })
})

describe('head tags for the editor', () => {
  const tags = buildHeadTags(SITE, EDITOR_PAGE)

  it('keeps it out of search results, from the first byte, with no canonical link and no structured data', () => {
    expect(meta(tags, 'name', 'robots')).toBe(ROBOTS_NOINDEX)
    expect(link(tags, 'canonical')).toHaveLength(0)
    expect(meta(tags, 'property', 'og:url')).toBeUndefined()
    expect(graph(tags)).toBeNull()
    expect(tags.find((t) => t.tag === 'title')?.children).toBe('Invoice editor – Invoice Generator')
  })
})

describe('the plain-HTML copy of a page', () => {
  const html = buildNoscript(howTo)

  it('has the heading, the introduction, every section heading and every answer', () => {
    expect(html).toContain(`<h1>${howTo.h1}</h1>`)
    for (const s of howTo.sections) expect(html).toContain(s.heading)
    for (const q of howTo.faq) {
      expect(html).toContain(q.question)
      expect(html).toContain(q.answer.replace(/&/g, '&amp;'))
    }
  })

  it('prints a table as a real table, with its figures intact', () => {
    expect(html).toContain('<table>')
    expect(html).toContain('<caption>Example invoice line items</caption>')
    expect(html).toContain('<td>$1,200.00</td>')
    expect(html).toContain('<th>Description</th>')
  })

  it('links home and to the related pages, with real addresses', () => {
    expect(html).toContain('<a href="/">')
    for (const path of howTo.related) expect(html).toContain(`<a href="${path}">`)
  })

  it('escapes what it prints', () => {
    const templates = buildNoscript(SEO_PAGES.find((p) => p.path === '/invoice-template-pdf')!)
    expect(templates).toContain('Stamp &amp; Seal')
    expect(templates).not.toContain('Stamp & Seal')
  })

  it('the home page\'s copy links to every content page, so a crawler can find them without running the page', () => {
    const home = buildNoscript()
    for (const p of SEO_PAGES) expect(home).toContain(`<a href="${p.path}">`)
  })
})

describe('the sitemap', () => {
  const xml = buildSitemapXml(SITE, HOME_UPDATED)

  it('lists the home page and every content page, each with the date its content last changed', () => {
    expect(xml.match(/<url>/g)).toHaveLength(1 + SEO_PAGES.length)
    expect(xml).toContain(`<loc>${SITE}/</loc><lastmod>${HOME_UPDATED}</lastmod>`)
    for (const p of SEO_PAGES) expect(xml).toContain(`<loc>${SITE}${p.path}</loc><lastmod>${p.updated}</lastmod>`)
  })

  it('leaves the editor out — it is a tool, not content', () => {
    expect(xml).not.toContain('/editor')
  })
})

describe('serializeTag', () => {
  it('prints void tags without a closing tag, and escapes attributes and the title', () => {
    expect(serializeTag({ tag: 'meta', attrs: { name: 'description', content: 'A & "B"' } })).toBe('<meta name="description" content="A &amp; &quot;B&quot;">')
    expect(serializeTag({ tag: 'title', children: 'PDF & PNG' })).toBe('<title>PDF &amp; PNG</title>')
    expect(serializeTag({ tag: 'script', attrs: { type: 'application/ld+json' }, children: '{"a":"b & c"}' })).toBe('<script type="application/ld+json">{"a":"b & c"}</script>')
  })
})

describe('writing the tags into the built page', () => {
  const template =
    '<!doctype html><html><head><meta charset="UTF-8" /><!--seo:head--><!--/seo:head--><script type="module" src="/assets/index-abc.js"></script></head>' +
    '<body><!--seo:body--><!--/seo:body--><div id="root"></div></body></html>'
  const home = injectSeo(template, SITE)

  it('fills the home page in between the markers, leaving the rest of the page alone', () => {
    expect(home).toContain(`<title>${SEO_TITLE.replace('&', '&amp;')}</title>`)
    expect(home).toContain('<noscript>')
    expect(home).toContain('<script type="module" src="/assets/index-abc.js"></script>')
    expect(home).toContain('<div id="root"></div>')
  })

  it('makes a page\'s own file from the built home file: its tags and its copy, the same scripts and root', () => {
    const page = renderPageHtml(home, SITE, howTo)
    expect(page.match(/<title>/g)).toHaveLength(1)
    expect(page).toContain(`<title>${howTo.title}</title>`)
    expect(page.match(/rel="canonical"/g)).toHaveLength(1)
    expect(page).toContain(`<link rel="canonical" href="${SITE}${howTo.path}">`)
    expect(page).toContain(`<h1>${howTo.h1}</h1>`)
    expect(page).not.toContain(FAQ[0].question)
    expect(page).toContain('<script type="module" src="/assets/index-abc.js"></script>')
    expect(page).toContain('<div id="root"></div>')
  })

  it('does not mangle a dollar sign in a page\'s text (it is not a replacement pattern)', () => {
    const page = renderPageHtml(home, SITE, howTo)
    expect(page).toContain('<td>$1,200.00</td>')
    expect(page).toContain('Total due $2,211.00')
  })

  it('makes the editor\'s file say noindex', () => {
    const page = renderPageHtml(home, SITE, EDITOR_PAGE)
    expect(page).toContain('<meta name="robots" content="noindex,follow">')
    expect(page).not.toContain('rel="canonical"')
  })

  it('strips the markers and nothing else', () => {
    const clean = stripSeoMarkers(home)
    expect(clean).not.toMatch(/<!--\/?seo:/)
    expect(clean).toContain(`<title>`)
    expect(clean).toContain('<noscript>')
  })

  it('refuses to work on a page that has no markers, instead of quietly shipping the wrong tags', () => {
    expect(() => injectSeo('<html><head></head><body></body></html>', SITE)).toThrow(/seo:head/)
    expect(() => renderPageHtml('<html></html>', SITE, howTo)).toThrow(/seo:head/)
  })
})
