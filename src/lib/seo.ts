import { GUIDES_HEADING, HOME_UPDATED, SEO_PAGES } from './seoPages.ts'
import type { SeoPage } from './seoPages.ts'
import {
  AUTHOR,
  FAQ,
  FAQ_HEADING,
  FEATURES,
  FEATURES_HEADING,
  HERO,
  HOW_IT_WORKS,
  HOW_IT_WORKS_HEADING,
  KEYWORDS,
  ROBOTS_INDEX,
  ROBOTS_NOINDEX,
  SEO_DESCRIPTION,
  SEO_TITLE,
  SITE_NAME,
  SOCIAL_IMAGE_ALT,
  SOCIAL_TITLE,
  THEME_COLOR,
  structuredData,
} from './site.ts'

/**
 * The search-engine side of the site, as pure functions: the <head> tags and
 * structured data for each page, the plain-HTML copy of each page, `robots.txt`
 * and `sitemap.xml`, and the step that writes a file per page into the build.
 * `vite.config.ts` runs them; the tests check them. No browser or Vite APIs.
 *
 * The site's own address is not known until it is deployed, so everything that
 * needs it (the canonical link, share-card URLs, the sitemap, breadcrumbs) is
 * written only when `VITE_SITE_URL` is set — a page with no canonical is fine,
 * a page that names the wrong one is not.
 */

/** A tag as the build prints it into the page. */
export interface HeadTag {
  tag: string
  attrs?: Record<string, string | boolean>
  children?: string
}

/** The editor: a tool, not content — it gets its own file saying `noindex`, so that is the first thing a crawler reads. */
export const EDITOR_PAGE = {
  path: '/editor',
  kind: 'editor',
  title: 'Invoice editor – Invoice Generator',
  description: SEO_DESCRIPTION,
} as const

/** What a page's tags can be built for: a content page, or the editor. (No page means the home page.) */
export type HeadPage = SeoPage | typeof EDITOR_PAGE

/** The social-card picture's file name and size, in `public/`. */
export const SOCIAL_IMAGE = { path: '/og-image.png', width: 1200, height: 630 } as const

/**
 * The bare address the site is served from — `https://example.com`, or
 * `https://example.com/app` when it lives under a path — with no trailing
 * slash; null for anything that isn't a real http(s) address.
 */
export function normalizeSiteUrl(raw: string | undefined | null): string | null {
  const value = raw?.trim()
  if (!value) return null
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  return `${url.origin}${url.pathname}`.replace(/\/+$/, '')
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/**
 * A tag ready to be printed into the page: attribute values and a title's text
 * escaped. (The structured data and the <noscript> block are already safe: the
 * first has no `<`, the second is escaped as it is built.)
 */
export function escapeTag(tag: HeadTag): HeadTag {
  return {
    ...tag,
    attrs: tag.attrs && Object.fromEntries(Object.entries(tag.attrs).map(([k, v]) => [k, typeof v === 'string' ? escapeHtml(v) : v])),
    children: tag.tag === 'title' && tag.children !== undefined ? escapeHtml(tag.children) : tag.children,
  }
}

const VOID_TAGS = new Set(['meta', 'link'])

export function serializeTag(tag: HeadTag): string {
  const t = escapeTag(tag)
  const attrs = Object.entries(t.attrs ?? {})
    .filter(([, v]) => v !== false)
    .map(([k, v]) => (v === true ? k : `${k}="${v}"`))
    .join(' ')
  const open = attrs ? `<${t.tag} ${attrs}>` : `<${t.tag}>`
  return VOID_TAGS.has(t.tag) ? open : `${open}${t.children ?? ''}</${t.tag}>`
}

const meta = (key: 'name' | 'property', value: string, content: string): HeadTag => ({ tag: 'meta', attrs: { [key]: value, content } })

/** The structured data for a content page: the page (an article for a guide), its place in the site, and its FAQ. */
function pageStructuredData(siteUrl: string | null, page: SeoPage): Record<string, unknown> {
  const author = { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url }
  const url = siteUrl ? `${siteUrl}${page.path}` : null
  const webSite = { '@type': 'WebSite', name: SITE_NAME, ...(siteUrl ? { url: `${siteUrl}/` } : {}) }
  const main =
    page.kind === 'article'
      ? {
          '@type': 'Article',
          headline: page.h1,
          description: page.description,
          inLanguage: 'en',
          datePublished: page.updated,
          dateModified: page.updated,
          author,
          publisher: author,
          isPartOf: webSite,
          ...(url ? { mainEntityOfPage: url } : {}),
        }
      : {
          '@type': 'WebPage',
          name: page.title,
          description: page.description,
          inLanguage: 'en',
          dateModified: page.updated,
          isPartOf: webSite,
          ...(url ? { url } : {}),
        }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      main,
      // A breadcrumb's items must be addresses, so it can only be written once the site has one.
      ...(siteUrl && url
        ? [
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
                { '@type': 'ListItem', position: 2, name: page.h1, item: url },
              ],
            },
          ]
        : []),
      {
        '@type': 'FAQPage',
        mainEntity: page.faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
      },
    ],
  }
}

interface HeadSpec {
  title: string
  description: string
  socialTitle: string
  robots: string
  /** The path the canonical link names, or null for none. */
  path: string | null
  keywords: boolean
  jsonLd: Record<string, unknown> | null
}

function headSpec(siteUrl: string | null, page?: HeadPage): HeadSpec {
  if (!page) {
    return { title: SEO_TITLE, description: SEO_DESCRIPTION, socialTitle: SOCIAL_TITLE, robots: ROBOTS_INDEX, path: '/', keywords: true, jsonLd: structuredData(siteUrl) }
  }
  if (page.kind === 'editor') {
    return { title: page.title, description: page.description, socialTitle: page.title, robots: ROBOTS_NOINDEX, path: null, keywords: false, jsonLd: null }
  }
  return { title: page.title, description: page.description, socialTitle: page.title, robots: ROBOTS_INDEX, path: page.path, keywords: false, jsonLd: pageStructuredData(siteUrl, page) }
}

/** Every tag a page's <head> needs: title, description, robots, icons, social cards and structured data. No page means the home page. */
export function buildHeadTags(siteUrl: string | null, page?: HeadPage): HeadTag[] {
  const spec = headSpec(siteUrl, page)
  const address = siteUrl && spec.path ? `${siteUrl}${spec.path}` : null
  const image = siteUrl ? `${siteUrl}${SOCIAL_IMAGE.path}` : null

  const tags: HeadTag[] = [
    { tag: 'title', children: spec.title },
    meta('name', 'description', spec.description),
  ]
  if (spec.keywords) tags.push(meta('name', 'keywords', KEYWORDS.join(', ')))
  tags.push(
    meta('name', 'author', AUTHOR.name),
    meta('name', 'robots', spec.robots),
    meta('name', 'application-name', SITE_NAME),
    meta('name', 'theme-color', THEME_COLOR),
    { tag: 'link', attrs: { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' } },
    { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' } },
    { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' } },
    { tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
  )
  if (address) tags.push({ tag: 'link', attrs: { rel: 'canonical', href: address } })

  tags.push(
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', SITE_NAME),
    meta('property', 'og:title', spec.socialTitle),
    meta('property', 'og:description', spec.description),
    meta('property', 'og:locale', 'en_US'),
  )
  if (address) tags.push(meta('property', 'og:url', address))
  if (image) {
    tags.push(
      meta('property', 'og:image', image),
      meta('property', 'og:image:type', 'image/png'),
      meta('property', 'og:image:width', String(SOCIAL_IMAGE.width)),
      meta('property', 'og:image:height', String(SOCIAL_IMAGE.height)),
      meta('property', 'og:image:alt', SOCIAL_IMAGE_ALT),
    )
  }

  tags.push(
    meta('name', 'twitter:card', image ? 'summary_large_image' : 'summary'),
    meta('name', 'twitter:title', spec.socialTitle),
    meta('name', 'twitter:description', spec.description),
  )
  if (image) tags.push(meta('name', 'twitter:image', image), meta('name', 'twitter:image:alt', SOCIAL_IMAGE_ALT))

  if (spec.jsonLd) {
    tags.push({
      tag: 'script',
      attrs: { type: 'application/ld+json' },
      // `<` becomes an escape so no text in the data can ever close the script element.
      children: JSON.stringify(spec.jsonLd).replace(/</g, '\\u003c'),
    })
  }
  return tags
}

const e = escapeHtml
const li = (items: string[]) => `<ul>${items.map((i) => `<li>${e(i)}</li>`).join('')}</ul>`

/** One content page's body as plain HTML: its heading, text, tables, FAQ and links onward. */
function pageNoscript(page: SeoPage): string {
  const sections = page.sections.map((s) => {
    const parts = [`<section><h2>${e(s.heading)}</h2>`]
    for (const p of s.paragraphs ?? []) parts.push(`<p>${e(p)}</p>`)
    if (s.bullets) parts.push(li(s.bullets))
    if (s.steps) parts.push(`<ol>${s.steps.map((st) => `<li><h3>${e(st.title)}</h3><p>${e(st.text)}</p></li>`).join('')}</ol>`)
    if (s.list) parts.push(`<dl>${s.list.map((i) => `<dt>${e(i.term)}</dt><dd>${e(i.text)}</dd>`).join('')}</dl>`)
    if (s.table) {
      parts.push(
        `<table><caption>${e(s.table.caption)}</caption><thead><tr>${s.table.head.map((h) => `<th>${e(h)}</th>`).join('')}</tr></thead>` +
          `<tbody>${s.table.rows.map((r) => `<tr>${r.map((c) => `<td>${e(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
      )
    }
    for (const p of s.closing ?? []) parts.push(`<p>${e(p)}</p>`)
    parts.push('</section>')
    return parts.join('')
  })
  const related = page.related
    .map((path) => SEO_PAGES.find((p) => p.path === path))
    .filter((p): p is SeoPage => !!p)
    .map((p) => `<li><a href="${p.path}">${e(p.h1)}</a> — ${e(p.summary)}</li>`)
  return [
    '<main>',
    '<nav><a href="/">Home</a></nav>',
    `<h1>${e(page.h1)}</h1>`,
    `<p>${e(page.intro)}</p>`,
    `<p><a href="/editor">${e(HERO.cta)}</a></p>`,
    ...sections,
    `<section><h2>${e('Frequently asked questions')}</h2>${page.faq.map((f) => `<h3>${e(f.question)}</h3><p>${e(f.answer)}</p>`).join('')}</section>`,
    `<section><h2>${e('Related guides and tools')}</h2><ul>${related.join('')}</ul></section>`,
    `<p>Developed by <a href="${e(AUTHOR.url)}">${e(AUTHOR.name)}</a></p>`,
    '</main>',
  ].join('')
}

/**
 * A page's content as plain HTML, placed in a <noscript> block: what a visitor
 * or crawler that runs no JavaScript gets instead of an empty page. It says what
 * the React page says (both read `site.ts` and `seoPages.ts`). No page means the
 * home page, which also links to every content page so they can be found.
 */
export function buildNoscript(page?: HeadPage): string {
  if (page && page.kind !== 'editor') return pageNoscript(page)
  if (page) return `<main><h1>${e(page.title)}</h1><p><a href="/">${e(SITE_NAME)}</a></p></main>`
  return [
    '<main>',
    `<h1>${e(HERO.kicker)} — ${e(HERO.headline)}</h1>`,
    `<p>${e(HERO.text)}</p>`,
    `<p><a href="/editor">${e(HERO.cta)}</a></p>`,
    `<section><h2>${e(HOW_IT_WORKS_HEADING)}</h2><ul>${HOW_IT_WORKS.map((s) => `<li><h3>${e(s.title)}</h3><p>${e(s.text)}</p></li>`).join('')}</ul></section>`,
    `<section><h2>${e(FEATURES_HEADING)}</h2><ul>${FEATURES.map((f) => `<li><h3>${e(f.title)}</h3><p>${e(f.text)}</p></li>`).join('')}</ul></section>`,
    `<section><h2>${e(GUIDES_HEADING)}</h2><ul>${SEO_PAGES.map((p) => `<li><a href="${p.path}">${e(p.h1)}</a> — ${e(p.summary)}</li>`).join('')}</ul></section>`,
    `<section><h2>${e(FAQ_HEADING)}</h2>${FAQ.map((f) => `<h3>${e(f.question)}</h3><p>${e(f.answer)}</p>`).join('')}</section>`,
    `<p>Developed by <a href="${e(AUTHOR.url)}">${e(AUTHOR.name)}</a></p>`,
    '</main>',
  ].join('')
}

/** Every crawler is welcome everywhere — including `/editor`, which says `noindex` itself (a blocked page can never show that). */
export function buildRobotsTxt(siteUrl: string | null): string {
  const lines = ['User-agent: *', 'Allow: /']
  if (siteUrl) lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`)
  return `${lines.join('\n')}\n`
}

/** The home page and every content page, each with the date its content last changed. The editor is a tool, not content, so it is left out. */
export function buildSitemapXml(siteUrl: string, homeLastmod: string = HOME_UPDATED): string {
  const url = (path: string, lastmod: string, priority: string) =>
    `  <url><loc>${escapeHtml(siteUrl)}${path}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>${priority}</priority></url>`
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    url('/', homeLastmod, '1.0'),
    ...SEO_PAGES.map((p) => url(p.path, p.updated, '0.8')),
    '</urlset>',
    '',
  ].join('\n')
}

/*
 * Writing the tags into the built page. `index.html` holds two empty marked
 * blocks — one in <head>, one at the start of <body> — that the build fills
 * with the home page's tags and copy, and then, for each content page and the
 * editor, with that page's own: the built home file is copied to the page's
 * address with just those two blocks swapped, so every file has the same
 * scripts and styles and its own title, canonical link and text. Replacement
 * always uses a function so a `$` in a page's text is never read as a pattern.
 */
const BLOCKS = { head: /<!--seo:head-->[\s\S]*?<!--\/seo:head-->/, body: /<!--seo:body-->[\s\S]*?<!--\/seo:body-->/ } as const

function fillBlock(html: string, name: keyof typeof BLOCKS, content: string): string {
  if (!BLOCKS[name].test(html)) throw new Error(`The page has no <!--seo:${name}--><!--/seo:${name}--> block to fill (see index.html).`)
  return html.replace(BLOCKS[name], () => `<!--seo:${name}-->${content}<!--/seo:${name}-->`)
}

const headContent = (siteUrl: string | null, page?: HeadPage) => buildHeadTags(siteUrl, page).map(serializeTag).join('\n    ')
const bodyContent = (page?: HeadPage) => `<noscript>${buildNoscript(page)}</noscript>`

/** `index.html` with the home page's tags and copy written into its two blocks. */
export function injectSeo(html: string, siteUrl: string | null): string {
  return fillBlock(fillBlock(html, 'head', headContent(siteUrl)), 'body', bodyContent())
}

/** The same built file, with a content page's (or the editor's) tags and copy in place of the home page's. */
export function renderPageHtml(builtHtml: string, siteUrl: string | null, page: HeadPage): string {
  return fillBlock(fillBlock(builtHtml, 'head', headContent(siteUrl, page)), 'body', bodyContent(page))
}

/** Removes the marker comments, leaving what was between them. */
export function stripSeoMarkers(html: string): string {
  return html.replace(/<!--\/?seo:(?:head|body)-->/g, '')
}
