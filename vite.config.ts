import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { buildHeadTags, buildNoscript, buildRobotsTxt, buildSitemapXml, escapeTag, normalizeSiteUrl } from './src/lib/seo.ts'

/**
 * Writes the search-engine side of the site into the build: the <head> tags
 * (title, description, social cards, structured data), a plain-HTML copy of the
 * home page's content for crawlers that run no JavaScript, `robots.txt` and
 * `sitemap.xml`. The words come from `src/lib/site.ts`. The site's address is
 * `VITE_SITE_URL` (set it when deploying); without it nothing that needs an
 * address is written — see `src/lib/seo.ts`.
 */
function seo(siteUrl: string | null): Plugin {
  let building = false
  return {
    name: 'invoice-generator-seo',
    configResolved(config) {
      building = config.command === 'build'
    },
    buildStart() {
      if (building && !siteUrl) {
        this.warn('VITE_SITE_URL is not set: the build has no canonical link, share-card URLs or sitemap.xml. Set it to the address the site is deployed at, e.g. https://example.com')
      }
    },
    transformIndexHtml() {
      return [
        ...buildHeadTags(siteUrl).map((tag) => ({ ...escapeTag(tag), injectTo: 'head' as const })),
        { tag: 'noscript', children: buildNoscript(), injectTo: 'body-prepend' as const },
      ]
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(buildRobotsTxt(siteUrl))
        } else if (url === '/sitemap.xml' && siteUrl) {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8')
          res.end(buildSitemapXml(siteUrl, new Date().toISOString().slice(0, 10)))
        } else {
          next()
        }
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobotsTxt(siteUrl) })
      if (siteUrl) {
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemapXml(siteUrl, new Date().toISOString().slice(0, 10)) })
      }
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
