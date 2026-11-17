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
  SEO_DESCRIPTION,
  SEO_TITLE,
  SITE_NAME,
  SOCIAL_IMAGE_ALT,
  SOCIAL_TITLE,
  THEME_COLOR,
  structuredData,
} from './site.ts'

/**
 * The search-engine side of the site, as pure functions: the <head> tags, the
 * plain-HTML copy of the page, `robots.txt` and `sitemap.xml`. `vite.config.ts`
 * writes them into the build; the tests check them. No browser or Vite APIs.
 *
 * The site's own address is not known until it is deployed, so everything that
 * needs it (the canonical link, share-card URLs, the sitemap) is written only
 * when `VITE_SITE_URL` is set — a page with no canonical is fine, a page that
 * names the wrong one is not.
 */

/** A tag in the shape Vite's `transformIndexHtml` takes. */
export interface HeadTag {
  tag: string
  attrs?: Record<string, string | boolean>
  children?: string
  injectTo?: 'head' | 'body' | 'head-prepend' | 'body-prepend'
}

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
 * escaped, because Vite writes `attrs` and `children` out as they are. (The
 * structured data and the <noscript> block are already safe: the first has no
 * `<`, the second is escaped as it is built.)
 */
export function escapeTag(tag: HeadTag): HeadTag {
  return {
    ...tag,
    attrs: tag.attrs && Object.fromEntries(Object.entries(tag.attrs).map(([k, v]) => [k, typeof v === 'string' ? escapeHtml(v) : v])),
    children: tag.tag === 'title' && tag.children !== undefined ? escapeHtml(tag.children) : tag.children,
  }
}

const meta = (key: 'name' | 'property', value: string, content: string): HeadTag => ({ tag: 'meta', attrs: { [key]: value, content } })

/** Every tag the home page's <head> needs: title, description, robots, icons, social cards and the structured data. */
export function buildHeadTags(siteUrl: string | null): HeadTag[] {
  const home = siteUrl ? `${siteUrl}/` : null
  const image = siteUrl ? `${siteUrl}${SOCIAL_IMAGE.path}` : null

  const tags: HeadTag[] = [
    { tag: 'title', children: SEO_TITLE },
    meta('name', 'description', SEO_DESCRIPTION),
    meta('name', 'keywords', KEYWORDS.join(', ')),
    meta('name', 'author', AUTHOR.name),
    meta('name', 'robots', ROBOTS_INDEX),
    meta('name', 'application-name', SITE_NAME),
    meta('name', 'theme-color', THEME_COLOR),
    { tag: 'link', attrs: { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' } },
    { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' } },
    { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' } },
    { tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
  ]
  if (home) tags.push({ tag: 'link', attrs: { rel: 'canonical', href: home } })

  tags.push(
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', SITE_NAME),
    meta('property', 'og:title', SOCIAL_TITLE),
    meta('property', 'og:description', SEO_DESCRIPTION),
    meta('property', 'og:locale', 'en_US'),
  )
  if (home) tags.push(meta('property', 'og:url', home))
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
    meta('name', 'twitter:title', SOCIAL_TITLE),
    meta('name', 'twitter:description', SEO_DESCRIPTION),
  )
  if (image) tags.push(meta('name', 'twitter:image', image), meta('name', 'twitter:image:alt', SOCIAL_IMAGE_ALT))

  tags.push({
    tag: 'script',
    attrs: { type: 'application/ld+json' },
    // `<` becomes an escape so no text in the data can ever close the script element.
    children: JSON.stringify(structuredData(siteUrl)).replace(/</g, '\\u003c'),
  })
  return tags
}

/**
 * The home page's content as plain HTML, placed in a <noscript> block: what a
 * visitor or crawler that runs no JavaScript gets instead of an empty page.
 * It says what the React landing page says (both read `site.ts`).
 */
export function buildNoscript(): string {
  const e = escapeHtml
  return [
    '<main>',
    `<h1>${e(HERO.kicker)} — ${e(HERO.headline)}</h1>`,
    `<p>${e(HERO.text)}</p>`,
    `<p><a href="/editor">${e(HERO.cta)}</a></p>`,
    `<section><h2>${e(HOW_IT_WORKS_HEADING)}</h2><ul>${HOW_IT_WORKS.map((s) => `<li><h3>${e(s.title)}</h3><p>${e(s.text)}</p></li>`).join('')}</ul></section>`,
    `<section><h2>${e(FEATURES_HEADING)}</h2><ul>${FEATURES.map((f) => `<li><h3>${e(f.title)}</h3><p>${e(f.text)}</p></li>`).join('')}</ul></section>`,
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

/** The one page worth indexing is the home page; the editor is a tool, not content. */
export function buildSitemapXml(siteUrl: string, lastmod: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <url><loc>${escapeHtml(siteUrl)}/</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>`,
    '</urlset>',
    '',
  ].join('\n')
}
