import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildHeadTags, buildNoscript, buildRobotsTxt, buildSitemapXml, escapeHtml, escapeTag, normalizeSiteUrl } from '../src/lib/seo'
import type { HeadTag } from '../src/lib/seo'
import { AUTHOR, FAQ, FEATURES, HERO, KEYWORDS, REPO_URL, SEO_DESCRIPTION, SEO_TITLE, SOCIAL_TITLE } from '../src/lib/site'

const SITE = 'https://invoices.example.com'

const meta = (tags: HeadTag[], key: 'name' | 'property', value: string) => tags.find((t) => t.tag === 'meta' && t.attrs?.[key] === value)?.attrs?.content
const link = (tags: HeadTag[], rel: string) => tags.filter((t) => t.tag === 'link' && t.attrs?.rel === rel)
function structured(tags: HeadTag[]) {
  const script = tags.find((t) => t.tag === 'script' && t.attrs?.type === 'application/ld+json')!
  return JSON.parse(script.children as string) as { '@graph': Array<Record<string, unknown>> }
}
const graphItem = (tags: HeadTag[], type: string) => structured(tags)['@graph'].find((n) => n['@type'] === type)!

describe('normalizeSiteUrl', () => {
  it('gives the bare origin: lowercase host, https kept, no trailing slash', () => {
    expect(normalizeSiteUrl('https://Invoices.Example.com/')).toBe('https://invoices.example.com')
    expect(normalizeSiteUrl('  https://example.com  ')).toBe('https://example.com')
  })

  it('keeps a sub-path the app is served from', () => {
    expect(normalizeSiteUrl('https://example.com/invoice/')).toBe('https://example.com/invoice')
  })

  it('is null for nothing, or for anything that is not an http(s) address — so no wrong address is ever published', () => {
    expect(normalizeSiteUrl(undefined)).toBeNull()
    expect(normalizeSiteUrl('')).toBeNull()
    expect(normalizeSiteUrl('not a url')).toBeNull()
    expect(normalizeSiteUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeSiteUrl('example.com')).toBeNull()
  })
})

describe('the words search engines see', () => {
  const all = `${SEO_TITLE} ${SEO_DESCRIPTION}`.toLowerCase()

  it('the title and description carry the keywords people search for', () => {
    expect(all).toContain('free invoice generator')
    expect(all).toContain('one click invoice')
    expect(all).toContain('invoice generator')
    expect(all).toContain('pdf')
  })

  it('fit what a result shows: a title that is not cut off, a description that is not cut off', () => {
    expect(SEO_TITLE.length).toBeLessThanOrEqual(65)
    expect(SEO_DESCRIPTION.length).toBeGreaterThan(70)
    expect(SEO_DESCRIPTION.length).toBeLessThanOrEqual(160)
  })

  it('the main heading and the sections say the keywords too', () => {
    expect(HERO.kicker.toLowerCase()).toBe('free invoice generator')
    expect(FEATURES.map((f) => f.title.toLowerCase())).toContain('one-click invoice')
  })

  it('lists the phrases the owner asked for, and more', () => {
    for (const phrase of ['invoice generator', 'free invoice generator', 'one click invoice']) expect(KEYWORDS).toContain(phrase)
    expect(KEYWORDS.length).toBeGreaterThanOrEqual(15)
    expect(new Set(KEYWORDS).size).toBe(KEYWORDS.length)
  })

  it('is honest about privacy: invoices are never uploaded, and the anonymous visit counter is disclosed', () => {
    const copy = JSON.stringify([HERO, FEATURES, FAQ, SEO_DESCRIPTION]).toLowerCase()
    // "Nothing is uploaded" would not be true once page visits are counted; what is true is that invoices are never uploaded.
    expect(copy).not.toContain('nothing is uploaded')
    const privacy = FAQ.find((f) => f.question === 'Is my invoice data private?')!.answer
    expect(privacy).toContain('never uploaded')
    expect(privacy).toContain('Vercel Web Analytics')
    expect(privacy.toLowerCase()).toContain('no cookies')
  })

  it('does not promise anything the app does not do (the Word export is gone)', () => {
    const copy = JSON.stringify([HERO, FEATURES, FAQ, SEO_TITLE, SEO_DESCRIPTION]).toLowerCase()
    expect(copy).not.toContain('word')
    expect(copy).not.toContain('docx')
  })
})

describe('buildHeadTags — before the site has an address', () => {
  const tags = buildHeadTags(null)

  it('has the title, description and keywords', () => {
    expect(tags.find((t) => t.tag === 'title')?.children).toBe(SEO_TITLE)
    expect(meta(tags, 'name', 'description')).toBe(SEO_DESCRIPTION)
    expect(meta(tags, 'name', 'keywords')).toContain('free invoice generator')
    expect(meta(tags, 'name', 'author')).toBe(AUTHOR.name)
  })

  it('lets search engines index the page, with full previews', () => {
    expect(meta(tags, 'name', 'robots')).toMatch(/^index,follow/)
    expect(meta(tags, 'name', 'robots')).toContain('max-image-preview:large')
  })

  it('has social cards, with the card type that matches having no picture to show', () => {
    expect(meta(tags, 'property', 'og:title')).toBe(SOCIAL_TITLE)
    expect(meta(tags, 'property', 'og:type')).toBe('website')
    expect(meta(tags, 'name', 'twitter:card')).toBe('summary')
  })

  it('publishes no address at all, rather than a wrong one', () => {
    expect(link(tags, 'canonical')).toHaveLength(0)
    expect(meta(tags, 'property', 'og:url')).toBeUndefined()
    expect(meta(tags, 'property', 'og:image')).toBeUndefined()
    expect(meta(tags, 'name', 'twitter:image')).toBeUndefined()
    expect(JSON.stringify(structured(tags))).not.toContain('"url":"https://invoices')
    expect(graphItem(tags, 'WebApplication')).not.toHaveProperty('url')
  })

  it('links the icons and the manifest with root-relative paths', () => {
    expect(link(tags, 'icon').map((t) => t.attrs?.href)).toEqual(expect.arrayContaining(['/favicon.svg', '/favicon-32.png']))
    expect(link(tags, 'apple-touch-icon')[0].attrs?.href).toBe('/apple-touch-icon.png')
    expect(link(tags, 'manifest')[0].attrs?.href).toBe('/site.webmanifest')
  })
})

describe('buildHeadTags — with the site address', () => {
  const tags = buildHeadTags(SITE)

  it('names the one canonical address of the home page', () => {
    expect(link(tags, 'canonical')).toHaveLength(1)
    expect(link(tags, 'canonical')[0].attrs?.href).toBe(`${SITE}/`)
    expect(meta(tags, 'property', 'og:url')).toBe(`${SITE}/`)
  })

  it('points the share cards at a full address for the picture, as social sites require', () => {
    expect(meta(tags, 'property', 'og:image')).toBe(`${SITE}/og-image.png`)
    expect(meta(tags, 'property', 'og:image:width')).toBe('1200')
    expect(meta(tags, 'property', 'og:image:height')).toBe('630')
    expect(meta(tags, 'name', 'twitter:card')).toBe('summary_large_image')
    expect(meta(tags, 'name', 'twitter:image')).toBe(`${SITE}/og-image.png`)
  })

  it('describes the app as free, with the developer as its author', () => {
    const app = graphItem(tags, 'WebApplication')
    expect(app.url).toBe(`${SITE}/`)
    expect(app.isAccessibleForFree).toBe(true)
    expect(app.offers).toMatchObject({ price: '0' })
    expect(app.author).toMatchObject({ '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url })
    expect(app.applicationCategory).toBe('BusinessApplication')
    expect(app).not.toHaveProperty('aggregateRating')
  })

  it('has a FAQ in the structured data that is word for word the FAQ on the page', () => {
    const faq = graphItem(tags, 'FAQPage') as { mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }> }
    expect(faq.mainEntity).toHaveLength(FAQ.length)
    faq.mainEntity.forEach((q, i) => {
      expect(q.name).toBe(FAQ[i].question)
      expect(q.acceptedAnswer.text).toBe(FAQ[i].answer)
    })
  })

  it('writes the structured data so it can never close its own <script>', () => {
    const script = tags.find((t) => t.tag === 'script')!
    expect(String(script.children)).not.toContain('<')
    expect(() => JSON.parse(script.children as string)).not.toThrow()
  })
})

describe('buildNoscript', () => {
  const html = buildNoscript()

  it('is the page\'s content in plain HTML, for visitors and crawlers that run no JavaScript', () => {
    expect(html).toContain('<h1>')
    expect(html.toLowerCase()).toContain('free invoice generator')
    for (const f of FAQ) expect(html).toContain(f.question)
    for (const f of FEATURES) expect(html).toContain(f.title)
    expect(html).toContain('href="/editor"')
  })

  it('uses only plain content tags, and prints the headline as written', () => {
    expect(html).not.toMatch(/<(?!\/?(h1|h2|h3|p|a|ul|li|section|main|header|nav)\b)[a-z]/i)
    expect(html).toContain(HERO.headline)
  })
})

describe('escapeHtml', () => {
  it('escapes what could break out of an attribute or a tag', () => {
    expect(escapeHtml('a & b <c> "d" \'e\'')).toBe('a &amp; b &lt;c&gt; &quot;d&quot; &#39;e&#39;')
  })
})

describe('escapeTag', () => {
  it('escapes attribute values and a title\'s text, which Vite would otherwise print as they are', () => {
    expect(escapeTag({ tag: 'meta', attrs: { name: 'description', content: 'Fast & "easy"' } }).attrs?.content).toBe('Fast &amp; &quot;easy&quot;')
    expect(escapeTag({ tag: 'title', children: 'PDF & PNG' }).children).toBe('PDF &amp; PNG')
  })

  it('leaves the structured data alone, and non-text attributes', () => {
    const json = '{"a":"b & c"}'
    expect(escapeTag({ tag: 'script', attrs: { type: 'application/ld+json' }, children: json }).children).toBe(json)
    expect(escapeTag({ tag: 'script', attrs: { async: true } }).attrs?.async).toBe(true)
  })

  it('every real tag survives it with nothing a browser would misread', () => {
    for (const tag of buildHeadTags(SITE).map(escapeTag)) {
      for (const value of Object.values(tag.attrs ?? {})) expect(String(value)).not.toMatch(/["<>]/)
    }
  })
})

describe('robots.txt and sitemap.xml', () => {
  it('robots.txt welcomes crawlers and, once the address is known, points to the sitemap', () => {
    expect(buildRobotsTxt(SITE)).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)
    expect(buildRobotsTxt(null)).toBe('User-agent: *\nAllow: /\n')
  })

  it('does not block the editor from being crawled (a blocked page can never show its "noindex")', () => {
    expect(buildRobotsTxt(SITE)).not.toMatch(/Disallow:\s*\/editor/)
  })

  it('the sitemap is valid XML that lists the home page first, with its date (the content pages are in seoRender.test.ts)', () => {
    const xml = buildSitemapXml(SITE, '2026-11-17')
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain(`<loc>${SITE}/</loc><lastmod>2026-11-17</lastmod>`)
    expect(xml.indexOf(`<loc>${SITE}/</loc>`)).toBeLessThan(xml.indexOf('<loc>', xml.indexOf('<loc>') + 1))
    expect(xml).not.toContain('/editor')
  })
})

describe('the live address (.env.production)', () => {
  const LIVE = 'https://free-invoice-generator.rhshoumik.dev'
  const value = /^VITE_SITE_URL=(.+)$/m.exec(readFileSync('.env.production', 'utf8'))?.[1]?.trim()

  it('is committed, so every production build knows the site\'s address without any dashboard setting', () => {
    expect(value).toBe(LIVE)
  })

  it('is already the clean form (https, lowercase host, no trailing slash) the build will use', () => {
    expect(normalizeSiteUrl(value)).toBe(value)
  })

  it('ends up on every address the home page publishes — and on nothing else', () => {
    const tags = buildHeadTags(value!)
    const hrefs = [
      link(tags, 'canonical')[0].attrs?.href,
      meta(tags, 'property', 'og:url'),
      meta(tags, 'property', 'og:image'),
      meta(tags, 'name', 'twitter:image'),
      graphItem(tags, 'WebApplication').url,
      graphItem(tags, 'WebSite').url,
    ]
    for (const href of hrefs) expect(String(href).startsWith(`${LIVE}/`)).toBe(true)
    expect(buildRobotsTxt(value!)).toContain(`Sitemap: ${LIVE}/sitemap.xml`)
    expect(buildSitemapXml(value!, '2026-11-17')).toContain(`<loc>${LIVE}/</loc>`)
  })

  it('the structured data also points at the open-source repository and the developer', () => {
    const app = graphItem(buildHeadTags(value!), 'WebApplication')
    expect(app.sameAs).toEqual(expect.arrayContaining([REPO_URL, AUTHOR.url]))
    expect(REPO_URL).toBe('https://github.com/RHShoumik/free-invoice-generator')
  })
})
