import { ReceiptText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { HERO, ROBOTS_INDEX, SEO_DESCRIPTION, SEO_TITLE } from '../../lib/site'
import { usePageMeta } from '../../lib/usePageMeta'
import { useStartInvoice } from '../../lib/useStartInvoice'
import { Faq, Features, Guides, HowItWorks, SiteFooter } from './LandingSections'
import { TemplatePickerGrid } from './TemplatePickerGrid'

const STORAGE_KEY = 'invoice-generator/invoice'

const NAV = [
  { href: '#templates', label: 'Templates' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#guides', label: 'Guides' },
  { href: '#faq', label: 'FAQ' },
]

export function TemplateGallery() {
  const navigate = useNavigate()
  const startInvoice = useStartInvoice()
  const hasExistingInvoice = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) !== null
  usePageMeta({ title: SEO_TITLE, description: SEO_DESCRIPTION, robots: ROBOTS_INDEX, canonicalPath: '/' })

  // The headline has one highlighted word, in the page's own style.
  const [headBefore, headAfter] = HERO.headline.split('proud')

  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-white">
            <ReceiptText className="size-[18px]" />
          </span>
          <span className="text-sm font-bold tracking-tight text-ink">Invoice Generator</span>
        </div>
        <nav aria-label="Page sections" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 outline-none transition-colors hover:bg-black/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </a>
          ))}
        </nav>
        {hasExistingInvoice && (
          <Button type="button" className="h-10 rounded-full px-5 text-sm font-semibold" onClick={() => navigate('/editor')}>
            Continue last invoice →
          </Button>
        )}
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-12 pt-10 sm:pt-16">
        <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-black/5">
          <span className="size-1.5 rounded-full bg-brand" /> 105 designs · free · private
        </p>
        <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-[1.04] tracking-tight text-ink sm:text-6xl">
          <span className="mb-3 block text-base font-bold uppercase tracking-[0.16em] text-brand sm:text-lg">{HERO.kicker}</span>{' '}
          {headBefore}
          <span className="relative whitespace-nowrap">
            <span aria-hidden className="absolute inset-x-[-0.1em] bottom-[0.08em] top-[0.52em] -z-0 -rotate-1 rounded-sm bg-[#cdf56a]" />
            <span className="relative">proud</span>
          </span>
          {headAfter}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">{HERO.text}</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button asChild className="h-12 rounded-full px-7 text-base font-semibold">
            {/* A real link (crawlers follow it) that also starts a fresh invoice, as picking a design does. */}
            <a
              href="/editor"
              onClick={(e) => {
                e.preventDefault()
                startInvoice()
              }}
            >
              {HERO.cta} →
            </a>
          </Button>
          <p className="text-sm text-slate-500">or choose a design below</p>
        </div>
      </section>

      <main>
        <section id="templates" aria-labelledby="templates-heading" className="mx-auto max-w-6xl scroll-mt-6 px-6 pb-16">
          <h2 id="templates-heading" className="mb-6 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
            Choose a free invoice template
          </h2>
          <TemplatePickerGrid onSelect={startInvoice} />
        </section>
        <HowItWorks />
        <Features />
        <Guides />
        <Faq />
      </main>

      <SiteFooter />
    </div>
  )
}
