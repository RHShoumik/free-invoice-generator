import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { EDITOR_PAGE, buildRobotsTxt, buildSitemapXml, injectSeo, normalizeSiteUrl, renderPageHtml, stripSeoMarkers } from './src/lib/seo.ts'
import { SEO_PAGES } from './src/lib/seoPages.ts'

/**
 * Writes the search-engine side of the site into the build: the <head> tags
 * (title, description, canonical link, social cards, structured data) and a
 * plain-HTML copy of the content for crawlers that run no JavaScript — for the
 * home page in `index.html`, and, as a file of their own, for each content page
 * (`/how-to-write-an-invoice/index.html`, …) and the editor (`/editor/index.html`,
 * which says `noindex`). Also `robots.txt` and `sitemap.xml`. The words come from
 * `src/lib/site.ts` and `src/lib/seoPages.ts`. The site's address is
 * `VITE_SITE_URL` (committed in `.env.production`); without it nothing that
 * needs an address is written — see `src/lib/seo.ts`.
 */
function seo(siteUrl: string | null): Plugin {
  let building = false
  return {
    name: 'invoice-generator-seo',
    // After Vite's own HTML step, so the built index.html (with its hashed scripts) is final when we copy it per page.
    enforce: 'post',
    configResolved(config) {
      building = config.command === 'build'
    },
    buildStart() {
      if (building && !siteUrl) {
        this.warn('VITE_SITE_URL is not set: the build has no canonical links, share-card URLs or sitemap.xml. Set it to the address the site is deployed at, e.g. https://example.com')
      }
    },
    transformIndexHtml(html, ctx) {
      const filled = injectSeo(html, siteUrl)
      // In development the markers are just noise; the build keeps them until every page's file has been made.
      return ctx.server ? stripSeoMarkers(filled) : filled
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(buildRobotsTxt(siteUrl))
        } else if (url === '/sitemap.xml' && siteUrl) {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8')
          res.end(buildSitemapXml(siteUrl))
        } else {
          next()
        }
      })
    },
    generateBundle(_options, bundle) {
      const home = bundle['index.html']
      if (home?.type === 'asset') {
        const built = String(home.source)
        for (const page of [...SEO_PAGES, EDITOR_PAGE]) {
          this.emitFile({ type: 'asset', fileName: `${page.path.slice(1)}/index.html`, source: stripSeoMarkers(renderPageHtml(built, siteUrl, page)) })
        }
        home.source = stripSeoMarkers(built)
      }
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobotsTxt(siteUrl) })
      if (siteUrl) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemapXml(siteUrl) })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'VITE_')
  return {
    plugins: [react(), tailwindcss(), seo(normalizeSiteUrl(env.VITE_SITE_URL))],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
  }
})
