/**
 * Everything the site says about itself to search engines and to people
 * landing on it: one source, read by the landing page (what visitors see), by
 * `seo.ts` (the <head> tags, structured data, robots.txt and sitemap.xml the
 * build writes) and by the tests. Keeping the words here means the page, the
 * snippet Google shows and the structured data can never disagree.
 *
 * Plain data and no browser or Vite APIs, because `vite.config.ts` imports it.
 */

export const SITE_NAME = 'Invoice Generator'

/** The developer credit shown on the landing page and in the editor. */
export const AUTHOR = { name: 'rhshoumik', url: 'https://rhshoumik.dev' } as const

/** The page <title> (and the first thing a search result shows): the main keywords, then the brand's promise. */
export const SEO_TITLE = 'Free Invoice Generator – One Click Invoice Maker (PDF & PNG)'

/** A shorter title for social cards, where there is more room for the brand than for keywords. */
export const SOCIAL_TITLE = 'Free Invoice Generator – One Click Invoice Maker'

export const SEO_DESCRIPTION =
  'Free invoice generator: create a professional invoice online in one click. 100+ invoice templates, no sign-up, no watermark. Download as PDF or PNG.'

export const SOCIAL_IMAGE_ALT = 'Invoice Generator — a free one-click invoice maker with 105 invoice templates'

/** Search phrases the site is about. `<meta name="keywords">` carries little weight today; the words matter in the copy below. */
export const KEYWORDS = [
  'invoice generator',
  'free invoice generator',
  'one click invoice',
  'one click invoice generator',
  'online invoice generator',
  'invoice maker',
  'free invoice maker',
  'invoice creator',
  'invoice template',
  'free invoice template',
  'pdf invoice generator',
  'create invoice online',
  'simple invoice generator',
  'professional invoice generator',
  'invoice generator no sign up',
  'invoice generator no watermark',
  'freelance invoice generator',
  'small business invoice generator',
  'invoice builder',
  'custom invoice generator',
  'invoice generator with logo',
  'invoice generator with tax',
  'download invoice as pdf',
]

export const ROBOTS_INDEX = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
export const ROBOTS_NOINDEX = 'noindex,follow'

export const THEME_COLOR = '#15171a'

export interface Faq {
  question: string
  answer: string
}

export interface Feature {
  title: string
  text: string
}

export interface Step {
  title: string
  text: string
}

export const HERO = {
  kicker: 'Free invoice generator',
  headline: 'Make an invoice you’re proud to send.',
  text: 'Create a professional invoice online in one click: pick a design, change anything by clicking right on the page, and download it as a PDF or PNG. No sign-up, no watermark — and it all happens in your browser, so nothing is uploaded.',
  cta: 'Create an invoice in one click',
} as const

export const HOW_IT_WORKS_HEADING = 'How to create an invoice online in one click'

export const HOW_IT_WORKS: Step[] = [
  {
    title: 'Start in one click',
    text: 'Press “Create an invoice in one click” and a ready-made invoice opens in the editor, or browse the invoice templates and pick the one that fits your business.',
  },
  {
    title: 'Click to edit',
    text: 'Click any text on the invoice — your name, the invoice number, dates, labels, notes — and change it right where it is. Add your logo, line items, tax and discount.',
  },
  {
    title: 'Download your invoice',
    text: 'Press Download and save the invoice as a print-ready PDF or a high-resolution PNG image, ready to email to your client.',
  },
]

export const FEATURES_HEADING = 'A free invoice maker with everything you need'

export const FEATURES: Feature[] = [
  {
    title: '105 free invoice templates',
    text: '21 layouts in 5 colour styles each — classic, minimal, bold, dark, creative and more — all free to use.',
  },
  {
    title: 'One-click invoice',
    text: 'Open a ready-made sample invoice with a single click and replace the details by clicking on the page. No forms to fill in first.',
  },
  {
    title: 'Download as PDF or PNG',
    text: 'Export a crisp, print-ready PDF or a high-resolution image of exactly what you see on screen.',
  },
  {
    title: 'No sign-up, no watermark',
    text: 'There are no accounts, trials or limits. Make as many invoices as you like — nothing is stamped on them.',
  },
  {
    title: 'Private by design',
    text: 'Everything runs in your browser. Your invoices are kept on your own device and are never uploaded to a server.',
  },
  {
    title: 'Your logo, colours and fonts',
    text: 'Add your logo, pick an accent colour and font, move things where you want them, and add text, images, lines or drawings.',
  },
  {
    title: 'Tax, discounts and 10 currencies',
    text: 'Set a tax rate and a discount, choose your currency, and the subtotal and total are worked out for you.',
  },
  {
    title: 'Made for freelancers and small businesses',
    text: 'Contractors, consultants, agencies and shops all need to bill clients quickly. This invoice maker is built to do that in minutes.',
  },
]

export const FAQ_HEADING = 'Invoice generator FAQ'

export const FAQ: Faq[] = [
  {
    question: 'Is this invoice generator really free?',
    answer: 'Yes. It is a free invoice generator with no trial, no paywall and no watermark on your invoices. Make as many as you need.',
  },
  {
    question: 'Do I need to sign up or create an account?',
    answer: 'No. There are no accounts. Open the editor and start making your invoice straight away.',
  },
  {
    question: 'How do I make an invoice in one click?',
    answer:
      'Press “Create an invoice in one click” and a ready-made invoice opens in the editor. Click any text to change it, then press Download to save it as a PDF or PNG.',
  },
  {
    question: 'Can I download my invoice as a PDF?',
    answer:
      'Yes. Press Download and choose PDF for a one-page file that is ready to send, or PNG for a high-resolution image of the invoice.',
  },
  {
    question: 'Is my invoice data private?',
    answer:
      'Yes. Everything happens in your browser. Your invoice is saved on your own device and is never uploaded to a server. Clearing your browser’s site data removes it.',
  },
  {
    question: 'Can I add my logo and change the colours?',
    answer:
      'Yes. Add your logo, choose an accent colour and font, and move or resize anything on the page. You can also add text boxes, images, lines and drawings.',
  },
  {
    question: 'Can I add tax and a discount, and use my own currency?',
    answer:
      'Yes. Open Details to set a tax percentage, a discount percentage and the currency. The subtotal, tax and total are calculated for you.',
  },
  {
    question: 'Can I come back to an invoice later?',
    answer:
      'Yes. Your latest invoice is saved in your browser, so “Continue last invoice” takes you straight back to it. It is stored on that device only, so it is not available on other computers.',
  },
]

/** The structured data for the home page: the site, the free web app, and its FAQ. `url` fields are only added once the site address is known. */
export function structuredData(siteUrl: string | null): Record<string, unknown> {
  const author = { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        inLanguage: 'en',
        ...(siteUrl ? { url: `${siteUrl}/` } : {}),
        publisher: author,
      },
      {
        '@type': 'WebApplication',
        name: SITE_NAME,
        alternateName: ['Free Invoice Generator', 'One Click Invoice Maker'],
        description: SEO_DESCRIPTION,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any (runs in a web browser)',
        browserRequirements: 'Requires JavaScript',
        inLanguage: 'en',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: FEATURES.map((f) => f.title),
        keywords: KEYWORDS.join(', '),
        author,
        ...(siteUrl ? { url: `${siteUrl}/` } : {}),
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  }
}
