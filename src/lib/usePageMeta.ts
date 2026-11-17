import { useEffect } from 'react'
import { normalizeSiteUrl } from './seo'

interface PageMeta {
  title: string
  description: string
  /** The `robots` meta value: whether this page may be indexed. */
  robots: string
  /** The path the page's canonical link names, or null for none (a page kept out of the index has none). */
  canonicalPath: string | null
}

function setNamedMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.name = name
    document.head.appendChild(el)
  }
  el.content = content
}

function setCanonical(href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!href) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

/**
 * Sets a page's own title, description, robots and canonical link while it is
 * on screen. The site is one HTML file, so the <head> the build wrote is the
 * home page's; each route calls this so search engines that run the page's
 * JavaScript (Google does) see the right values for it — most importantly the
 * editor, which is a tool rather than content and says `noindex`.
 */
export function usePageMeta({ title, description, robots, canonicalPath }: PageMeta) {
  useEffect(() => {
    document.title = title
    setNamedMeta('description', description)
    setNamedMeta('robots', robots)
    const site = normalizeSiteUrl(import.meta.env.VITE_SITE_URL)
    setCanonical(site && canonicalPath !== null ? `${site}${canonicalPath}` : null)
  }, [title, description, robots, canonicalPath])
}
