import { Credit } from '@/components/Credit'
import {
  FAQ,
  FAQ_HEADING,
  FEATURES,
  FEATURES_HEADING,
  HOW_IT_WORKS,
  HOW_IT_WORKS_HEADING,
  SITE_NAME,
} from '../../lib/site'

const SECTION = 'mx-auto max-w-6xl scroll-mt-6 px-6 py-14 sm:py-16'
const H2 = 'text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl'
const CARD = 'rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5'

/** Three steps, as a numbered list: the text a search for "how to make an invoice online" is looking for. */
export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className={SECTION}>
      <h2 id="how-it-works-heading" className={H2}>
        {HOW_IT_WORKS_HEADING}
      </h2>
      <ol className="mt-8 grid gap-5 md:grid-cols-3">
        {HOW_IT_WORKS.map((step, index) => (
          <li key={step.title} className={CARD}>
            <span className="flex size-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{index + 1}</span>
            <h3 className="mt-4 text-lg font-bold tracking-tight text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" className={SECTION}>
      <h2 id="features-heading" className={H2}>
        {FEATURES_HEADING}
      </h2>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <li key={feature.title} className={CARD}>
            <h3 className="text-base font-bold tracking-tight text-ink">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The questions are printed in full (not tucked into folding panels) so every answer is on the page for readers and crawlers. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className={SECTION}>
      <h2 id="faq-heading" className={H2}>
        {FAQ_HEADING}
      </h2>
      <dl className="mt-8 grid gap-x-10 gap-y-7 md:grid-cols-2">
        {FAQ.map((item) => (
          <div key={item.question}>
            <dt className="text-base font-bold tracking-tight text-ink">{item.question}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-black/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 sm:flex-row">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} {SITE_NAME} — free invoice generator. No sign-up, nothing uploaded.
        </p>
        <Credit />
      </div>
    </footer>
  )
}
