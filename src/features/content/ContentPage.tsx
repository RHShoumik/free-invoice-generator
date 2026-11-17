import { ReceiptText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { HERO, ROBOTS_INDEX } from '../../lib/site'
import { SEO_PAGES } from '../../lib/seoPages'
import type { PageSection, SeoPage } from '../../lib/seoPages'
import { useStartInvoice } from '../../lib/useStartInvoice'
import { usePageMeta } from '../../lib/usePageMeta'
import { SiteFooter } from '../template-gallery/LandingSections'

const H2 = 'mt-12 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl'
const P = 'mt-4 text-base leading-relaxed text-slate-700'

function Section({ section }: { section: PageSection }) {
  return (
    <section>
      <h2 className={H2}>{section.heading}</h2>
      {section.paragraphs?.map((text) => (
        <p key={text} className={P}>
          {text}
        </p>
      ))}
      {section.bullets && (
        <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-slate-700 marker:text-slate-400">
          {section.bullets.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      )}
      {section.steps && (
        <ol className="mt-5 space-y-5">
          {section.steps.map((step) => (
            <li key={step.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h3 className="text-base font-bold tracking-tight text-ink">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      )}
      {section.list && (
        <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {section.list.map((item) => (
            <div key={item.term}>
              <dt className="text-sm font-bold text-ink">{item.term}</dt>
              <dd className="mt-0.5 text-sm leading-relaxed text-slate-600">{item.text}</dd>
            </div>
          ))}
        </dl>
      )}
      {section.table && (
        <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <caption className="sr-only">{section.table.caption}</caption>
            <thead>
              <tr className="border-b border-black/10 bg-slate-50">
                {section.table.head.map((cell) => (
                  <th key={cell} scope="col" className="px-4 py-3 font-semibold text-ink">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row) => (
                <tr key={row[0]} className="border-b border-black/5 last:border-0">
                  {row.map((cell, i) => (
                    <td key={`${row[0]}-${i}`} className={i === 0 ? 'px-4 py-3 font-semibold text-ink' : 'px-4 py-3 text-slate-600'}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {section.closing?.map((text) => (
        <p key={text} className={section.table ? 'mt-4 text-base font-semibold text-ink' : P}>
          {text}
        </p>
      ))}
    </section>
  )
}

/**
 * One of the content pages (`lib/seoPages.ts`): a guide or tool page with its own
 * address, written for a search the home page can't answer in full. Everything it
 * shows comes from that data, which the build also writes into the page's own
 * static file, so what a crawler reads and what a visitor sees are the same words.
 */
export function ContentPage({ page }: { page: SeoPage }) {
  usePageMeta({ title: page.title, description: page.description, robots: ROBOTS_INDEX, canonicalPath: page.path })
  const start = useStartInvoice()
  const related = page.related.map((path) => SEO_PAGES.find((p) => p.path === path)).filter((p): p is SeoPage => !!p)

  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link to="/" className="flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-white">
            <ReceiptText className="size-[18px]" />
          </span>
          <span className="text-sm font-bold tracking-tight text-ink">Invoice Generator</span>
        </Link>
        <Button asChild className="h-10 rounded-full px-5 text-sm font-semibold">
          <a
            href="/editor"
            onClick={(e) => {
              e.preventDefault()
              start()
            }}
          >
            Make an invoice →
          </a>
        </Button>
      </header>

      <main>
        <article className="mx-auto max-w-3xl px-6 pb-20 pt-6">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to="/" className="underline decoration-black/20 underline-offset-2 hover:decoration-ink">
                  Home
                </Link>
              </li>
              <li aria-hidden>›</li>
              <li aria-current="page" className="text-slate-700">
                {page.h1}
              </li>
            </ol>
          </nav>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.16em] text-brand">{page.kicker}</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl">{page.h1}</h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-700">{page.intro}</p>
          <div className="mt-7">
            <Button asChild className="h-12 rounded-full px-7 text-base font-semibold">
              <a
                href="/editor"
                onClick={(e) => {
                  e.preventDefault()
                  start()
                }}
              >
                {HERO.cta} →
              </a>
            </Button>
          </div>

          {page.sections.map((section) => (
            <Section key={section.heading} section={section} />
          ))}

          <section>
            <h2 className={H2}>Frequently asked questions</h2>
            <dl className="mt-5 space-y-6">
              {page.faq.map((item) => (
                <div key={item.question}>
                  <dt className="text-base font-bold tracking-tight text-ink">{item.question}</dt>
                  <dd className="mt-1.5 text-base leading-relaxed text-slate-700">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className={H2}>Related guides and tools</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {related.map((p) => (
                <li key={p.path}>
                  <Link to={p.path} className="block h-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="block text-base font-bold tracking-tight text-ink">{p.h1}</span>
                    <span className="mt-1.5 block text-sm leading-relaxed text-slate-600">{p.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
