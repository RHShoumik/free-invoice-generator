import type { Faq, Step } from './site.ts'

/**
 * The content pages: one for each thing people search for that the home page
 * can't answer in full. Each has its own address, title, description, canonical
 * link, structured data and a plain-HTML copy — `seo.ts` builds those from this
 * file, and `features/content/ContentPage.tsx` renders it for visitors, so the
 * words can never differ between what a crawler reads and what a person sees.
 *
 * Every page has to earn its place: real guidance, in its own words, with a
 * FAQ of its own (`tests/seoPages.test.ts` guards length, uniqueness and the
 * claims about the app). Plain data and no browser or Vite APIs, because
 * `vite.config.ts` imports it.
 */

export interface PageTable {
  caption: string
  head: string[]
  rows: string[][]
}

export interface PageSection {
  heading: string
  /** Shown first. */
  paragraphs?: string[]
  /** Then at most one of these. */
  bullets?: string[]
  steps?: Step[]
  list?: { term: string; text: string }[]
  table?: PageTable
  /** Shown last, after the list or table. */
  closing?: string[]
}

export interface SeoPage {
  path: string
  /** `article` pages are guides (structured as an Article); the rest are tool pages. */
  kind: 'page' | 'article'
  /** The exact phrase the page is about: it must be in the title, the main heading and the description. */
  keyword: string
  title: string
  description: string
  kicker: string
  h1: string
  /** One line for the cards that link here. */
  summary: string
  intro: string
  sections: PageSection[]
  faq: Faq[]
  /** Other content pages to link to (their addresses). */
  related: string[]
  /** When the content last changed, `YYYY-MM-DD` — the sitemap's and the structured data's date. */
  updated: string
}

/** The heading of the home page's list of these pages. */
export const GUIDES_HEADING = 'Invoice guides, templates and tools'

/** The home page's own last-changed date, for the sitemap. */
export const HOME_UPDATED = '2026-11-17'

/** The layouts, by the names the app uses. `tests/seoPages.test.ts` checks this list against the real registry. */
export const LAYOUT_STYLES: { name: string; description: string }[] = [
  { name: 'Classic', description: 'Traditional centered header with ruled sections — familiar and safe.' },
  { name: 'Modern Minimal', description: 'Generous whitespace, thin dividers, small-caps labels.' },
  { name: 'Bold Gradient', description: 'Full-width gradient header band that puts your brand color front and center.' },
  { name: 'Corporate Blue', description: 'Structured, boxed sections with a banded header — formal and financial.' },
  { name: 'Creative Agency', description: 'Asymmetric layout with oversized type — for design and creative studios.' },
  { name: 'Dark Mode', description: 'Dark canvas with a bright accent — a modern, tech-forward look.' },
  { name: 'Elegant Serif', description: 'Ivory background, serif display type, thin gold rules — boutique and refined.' },
  { name: 'Startup / Tech', description: 'Rounded cards, soft shadows, friendly bright accent — product-company feel.' },
  { name: 'Minimal Mono', description: 'Monospace type throughout — a developer / indie-hacker aesthetic.' },
  { name: 'Consultant Clean', description: 'Plain, left-aligned, letter-style layout — high readability, minimal color.' },
  { name: 'Ledger', description: 'Ruled accounting-ledger lines throughout — a "paper ledger book" feel.' },
  { name: 'Boarding Pass', description: 'Ticket-stub layout with a perforated divider — for a fun, memorable invoice.' },
  { name: 'Editorial', description: 'Newspaper-masthead nameplate and rules — a bold editorial statement.' },
  { name: 'Watermark', description: 'A large faint background watermark behind a clean modern foreground.' },
  { name: 'Sidebar Accent', description: 'A solid-color vertical sidebar holds your identity; content flows beside it.' },
  { name: 'Postcard', description: 'A dashed card border and a playful stamp-style total badge.' },
  { name: 'Timeline', description: 'Line items as a vertical dotted timeline instead of a table.' },
  { name: 'Two-Tone Split', description: 'The page splits into two vertical color blocks — a bold graphic statement.' },
  { name: 'Stamp & Seal', description: 'Formal parchment feel with a circular seal badge near the total.' },
  { name: 'Blueprint', description: 'Technical engineering-drawing aesthetic with a subtle grid background.' },
  { name: 'Freeform Canvas', description: 'Drag, resize, and edit every section directly on the page.' },
]

export const SEO_PAGES: SeoPage[] = [
  {
    path: '/freelance-invoice-generator',
    kind: 'page',
    keyword: 'invoice generator for freelancers',
    title: 'Free Invoice Generator for Freelancers (PDF, No Sign-Up)',
    description:
      'Make a professional freelance invoice in minutes with a free invoice generator for freelancers. Hourly or fixed-price lines, tax, PDF download, no sign-up.',
    kicker: 'For freelancers and contractors',
    h1: 'Free invoice generator for freelancers',
    summary: 'Hourly or fixed-price invoices for freelancers and contractors, ready to send as a PDF.',
    intro:
      'Invoicing should take minutes, not an afternoon. This free invoice generator for freelancers lets you build a professional invoice by clicking straight onto the page — your details, your hourly rate or project fee, tax if you charge it — and download it as a PDF or PNG. There is nothing to sign up for and no watermark.',
    sections: [
      {
        heading: 'What a freelance invoice should include',
        paragraphs: ['A clear invoice gets paid faster because the client never has to write back with a question. Every freelance invoice should have:'],
        bullets: [
          'Your name or business name, address and contact details.',
          'Your client’s name, company and billing address.',
          'A unique invoice number, so you and the client can both refer to it.',
          'The issue date and the due date.',
          'A line for each piece of work, with a short description, a quantity and a rate.',
          'The subtotal, any tax or discount, and the total due.',
          'How to pay you — bank details or payment instructions — and your payment terms.',
        ],
      },
      {
        heading: 'Hourly rate or fixed price',
        paragraphs: [
          'For hourly work, make each line a task or a day: set the quantity to the hours worked and the rate to your hourly rate. The generator multiplies them for you and keeps the totals in step as you edit.',
          'For a fixed-price project, use a quantity of 1 and put the agreed fee in the rate, or split it into milestones such as “Design — 50% deposit” and “Delivery — balance”. Either way, describe the work specifically, for example “Homepage redesign, 12–20 November”, so the client’s accounts team can match each line to what you agreed.',
        ],
      },
      {
        heading: 'Get paid faster',
        bullets: [
          'Send the invoice as soon as the work is delivered or the milestone is met.',
          'Put a clear due date on it and state your payment terms, such as Net 14 or Net 30.',
          'Include your bank details or a payment link in the notes, so paying takes one step.',
          'Use one invoice-number format and never reuse a number.',
          'If the due date passes, follow up politely the next day.',
        ],
        closing: ['Not sure which terms to use? Our guide to invoice payment terms explains the common ones and when each suits a freelancer.'],
      },
      {
        heading: 'Make your invoice look like your brand',
        paragraphs: [
          'Choose from 105 free designs in 21 layouts, add your logo, pick an accent colour and a font, and move anything to where you want it. A tidy, consistent invoice reads as professional before the client has read a single line.',
          'Your invoice is saved in your browser, so you can close the tab and pick up where you left off.',
        ],
      },
      {
        heading: 'Create a freelance invoice in three steps',
        steps: [
          { title: 'Start', text: 'Press “Create an invoice in one click” for a ready-made invoice, or choose a design.' },
          { title: 'Fill it in', text: 'Click any text to change it. Add your logo, your client’s details and a line for each piece of work.' },
          { title: 'Download', text: 'Choose PDF to send and file, or PNG for a picture you can paste into a message.' },
        ],
      },
    ],
    faq: [
      {
        question: 'Do freelancers have to charge tax on invoices?',
        answer:
          'It depends on your country, your client’s country and your income. Some freelancers must charge VAT, GST or sales tax and others don’t. Ask your tax authority or an accountant; the generator simply lets you set a tax percentage, or leave it at 0.',
      },
      {
        question: 'What invoice number should a freelancer use?',
        answer:
          'Anything unique and in order works: INV-001, INV-002, or a date-based style such as 2026-014. Keep the same format for every client and never reuse a number.',
      },
      {
        question: 'Can I send the invoice to my client by email?',
        answer: 'Yes. Download it as a PDF and attach it to your email, or save it as a PNG image if you would rather paste it into a message.',
      },
      {
        question: 'Is the invoice generator really free for freelancers?',
        answer: 'Yes. It is free, there is no sign-up, there is no watermark, and there is no limit on how many invoices you make.',
      },
    ],
    related: ['/how-to-write-an-invoice', '/invoice-payment-terms', '/invoice-template-pdf', '/invoice-generator-no-sign-up'],
    updated: '2026-11-17',
  },
  {
    path: '/invoice-generator-no-sign-up',
    kind: 'page',
    keyword: 'invoice generator with no sign-up',
    title: 'Invoice Generator With No Sign-Up or Watermark (Free)',
    description:
      'Use an invoice generator with no sign-up, no account and no watermark. Create a free invoice in your browser, then download it as a PDF or PNG.',
    kicker: 'No account needed',
    h1: 'Invoice generator with no sign-up and no watermark',
    summary: 'Make and download an invoice without an account, an email address or a watermark.',
    intro:
      'Most invoice tools ask for an email address and a password before you can make anything, then print their logo on your invoice unless you pay. This one doesn’t. Open it, make your invoice, download it. That is the whole process.',
    sections: [
      {
        heading: 'What “no sign-up” means here',
        bullets: [
          'No account, email address or password.',
          'No free trial that turns into a bill, and no credit card.',
          'No watermark or branding added to your invoice.',
          'No limit on how many invoices you make.',
        ],
      },
      {
        heading: 'Where your invoice is stored',
        paragraphs: [
          'Your invoice is kept in your own browser, on your own device. It is never uploaded to a server — which is why there is no account: there is nothing to log in to.',
          'The site counts anonymous page visits with Vercel Web Analytics. It uses no cookies, and nothing from your invoices is ever sent.',
        ],
      },
      {
        heading: 'What to know before you start',
        paragraphs: ['Keeping everything private has trade-offs, and it is better to know them up front:'],
        bullets: [
          'Your invoice lives in one browser on one device. It is not synced to your other devices, and clearing your browser’s site data deletes it — so download a PDF to keep a copy.',
          'There are no payment links, automatic reminders or recurring invoices. This is a generator for making and downloading invoices, not an accounting system.',
          'Long invoices are exported as one tall page rather than being split across several pages.',
        ],
      },
      {
        heading: 'How to make an invoice without signing up',
        steps: [
          { title: 'Open the editor', text: 'Press “Create an invoice in one click” and a ready-made invoice opens straight away.' },
          { title: 'Click to edit', text: 'Click any text to change it: your details, your client’s, the invoice number, the dates and each line of work.' },
          { title: 'Download it', text: 'Press Download and choose PDF or PNG. The file is saved to your device.' },
        ],
      },
      {
        heading: 'What you can do without signing up',
        bullets: [
          'Pick from 105 free designs in 21 layouts.',
          'Add your logo, choose colours and fonts, and move things where you want them.',
          'Edit any text by clicking it, including the invoice number and every label.',
          'Add tax, a discount and your own currency, with the totals worked out for you.',
          'Download the finished invoice as a PDF or a PNG image.',
        ],
      },
      {
        heading: 'When a tool with accounts is the better choice',
        paragraphs: [
          'An account-based invoicing service makes sense if you need recurring invoices, online card payments, automatic payment reminders or a client portal. Those features need a server that remembers you, which is exactly what this generator avoids.',
          'If you just need a good-looking invoice, fast, and you want your client’s details to stay on your own device, an invoice generator with no sign-up is quicker and more private.',
        ],
      },
    ],
    faq: [
      {
        question: 'Do I need an account to download my invoice?',
        answer: 'No. You can create and download an invoice straight away, without an account or an email address.',
      },
      {
        question: 'Will my invoice have a watermark?',
        answer: 'No. Nothing is added to your invoice. The Watermark design is a style you can choose if you like that look, but it is your own design choice.',
      },
      {
        question: 'Can I get my invoice back later?',
        answer:
          'On the same browser and device, yes: choose “Continue last invoice” on the home page. On another device, no. That is the trade-off of keeping everything private, so download a PDF of anything you need to keep.',
      },
      {
        question: 'Is my invoice data sent anywhere?',
        answer:
          'No. Your invoice is saved in your browser and is never uploaded. The only thing counted is anonymous page visits, with no cookies and no invoice content.',
      },
    ],
    related: ['/freelance-invoice-generator', '/invoice-template-pdf', '/how-to-write-an-invoice'],
    updated: '2026-11-17',
  },
  {
    path: '/how-to-write-an-invoice',
    kind: 'article',
    keyword: 'how to write an invoice',
    title: 'How to Write an Invoice: Step-by-Step Guide and Example',
    description:
      'Learn how to write an invoice step by step: what to include, how to number it, a worked example and common mistakes — then make yours free in minutes.',
    kicker: 'Guide',
    h1: 'How to write an invoice: a step-by-step guide',
    summary: 'What to put on an invoice, in order, with a worked example and the mistakes that delay payment.',
    intro:
      'An invoice is a document that asks a client to pay for work you have done or goods you have supplied. A good one is easy to read, easy to match to your agreement and easy to pay. Here is what to put on it, in the order people expect to see it — plus a worked example and the mistakes that slow payment down.',
    sections: [
      {
        heading: 'What to include on an invoice',
        steps: [
          {
            title: '1. Label it as an invoice and give it a number',
            text: 'Put the word “Invoice” at the top, then a unique invoice number. Numbers let you and your client refer to the document and keep your records in order. Never reuse one.',
          },
          {
            title: '2. Add the dates',
            text: 'The issue date is the day you create the invoice. The due date is the day you expect to be paid. If the invoice covers a period of work, say so in the description, for example “March 2026”.',
          },
          {
            title: '3. Add your details',
            text: 'Your name or business name, address, email and phone number. If you are registered for VAT, GST or a similar tax, add your tax ID as well.',
          },
          {
            title: '4. Add your client’s details',
            text: 'Their name, company and billing address and, if they need it, a purchase-order number. Check the legal name with their accounts team.',
          },
          {
            title: '5. List what you are charging for',
            text: 'One line per item or task: a clear description, the quantity (hours, days or units), the rate and the line amount. Be specific enough that the client can match each line to what was agreed.',
          },
          {
            title: '6. Show the subtotal, tax, discount and total',
            text: 'Add the lines to get a subtotal, apply any discount, add tax if you charge it, and show the total due in the currency you agreed. Rules on charging tax vary by country, so check with an accountant or your tax authority.',
          },
          {
            title: '7. Say how and when to pay',
            text: 'State how you want to be paid — bank details or a payment link — and your payment terms, such as “Net 14” or “Due on receipt”. Our guide to invoice payment terms has examples.',
          },
          {
            title: '8. Add a note',
            text: 'A short thank-you, a project reference, or late-payment terms you agreed in advance.',
          },
        ],
      },
      {
        heading: 'An invoice example',
        paragraphs: ['Invoice INV-014, issued 12 November 2026 and due 26 November 2026 (Net 14), for a small design project:'],
        table: {
          caption: 'Example invoice line items',
          head: ['Description', 'Qty', 'Rate', 'Amount'],
          rows: [
            ['Website design — homepage and 3 inner pages', '1', '$1,200.00', '$1,200.00'],
            ['Logo and brand colours', '1', '$450.00', '$450.00'],
            ['Content updates (hours)', '6', '$60.00', '$360.00'],
          ],
        },
        closing: ['Subtotal $2,010.00 · Tax (10%) $201.00 · Total due $2,211.00'],
      },
      {
        heading: 'Invoice numbers: simple formats',
        bullets: [
          'Sequential: INV-001, INV-002, INV-003.',
          'Year and sequence: 2026-001, 2026-002, 2026-003.',
          'Client prefix: ACME-001, ACME-002.',
        ],
        closing: ['Pick one format and keep it. Gaps and duplicates make your records harder to follow, and harder to explain to an accountant.'],
      },
      {
        heading: 'Mistakes that delay payment',
        bullets: [
          'No due date or payment terms, so the client has no deadline to work to.',
          'A missing or duplicated invoice number.',
          'Vague descriptions such as “Services”, which the client cannot match to an agreement.',
          'Wrong or out-of-date client billing details.',
          'No payment instructions, so the client has to ask how to pay.',
          'Sending it late. Invoice when the work is done, not weeks afterwards.',
        ],
      },
      {
        heading: 'Make your invoice in minutes',
        paragraphs: [
          'Skip the blank page. The free invoice generator gives you a ready-made invoice: pick a design, click each part to fill it in, and download it as a PDF or PNG. There is no sign-up and no watermark.',
        ],
      },
    ],
    faq: [
      {
        question: 'What is the difference between an invoice and a receipt?',
        answer: 'An invoice asks for payment for work or goods. A receipt confirms that payment has been received.',
      },
      {
        question: 'Does an invoice need an invoice number?',
        answer:
          'A unique number is standard practice and is often required for tax purposes. It also lets you and your client refer to the right document. Check the rules that apply where you work.',
      },
      {
        question: 'How long should I give a client to pay an invoice?',
        answer:
          'Fourteen or thirty days from the invoice date are the most common choices. Shorter terms get you paid sooner; longer ones are sometimes required by larger clients.',
      },
      {
        question: 'Can I write an invoice in a free online tool?',
        answer: 'Yes. A free invoice generator fills in the layout and the maths for you, so you only enter your details, your client’s and the work you are charging for.',
      },
    ],
    related: ['/invoice-payment-terms', '/freelance-invoice-generator', '/invoice-template-pdf'],
    updated: '2026-11-17',
  },
  {
    path: '/invoice-template-pdf',
    kind: 'page',
    keyword: 'invoice templates',
    title: 'Free Invoice Templates – Download as PDF or PNG',
    description:
      'Browse 105 free invoice templates in 21 layouts. Click to fill in your details, then download your invoice as a PDF or PNG. No sign-up, no watermark.',
    kicker: 'Templates',
    h1: 'Free invoice templates you can download as PDF',
    summary: '105 free invoice templates in 21 layouts: pick one, fill it in, download a PDF or PNG.',
    intro:
      'Choose from 105 free invoice templates — 21 layouts, each in 5 colour styles. Pick one, click any text on it to fill in your own details, then download the finished invoice as a PDF or a PNG. There is no sign-up and no watermark.',
    sections: [
      {
        heading: 'How the invoice templates work',
        paragraphs: [
          'These are not files to download and then edit in another program. Each template is a live design in your browser: you click straight onto the invoice to change the text, add your logo and line items, change colours and fonts, then export it.',
          'Because you edit on the page itself, what you see is exactly what you download.',
        ],
      },
      {
        heading: 'The 21 invoice layouts',
        paragraphs: ['Every layout comes in five colour styles, so there are 105 designs in all:'],
        list: LAYOUT_STYLES.map((l) => ({ term: l.name, text: l.description })),
      },
      {
        heading: 'How to choose an invoice template',
        bullets: [
          'Professional services, consulting and finance: Classic, Corporate Blue, Consultant Clean or Ledger read as formal and trustworthy.',
          'Design, creative and marketing work: Creative Agency, Bold Gradient or Editorial let your own style show.',
          'Technology and product companies: Dark Mode, Startup / Tech or Minimal Mono suit a modern, technical brand.',
          'You want it simple: Modern Minimal keeps the focus on the numbers.',
          'You want full control: Freeform Canvas lets you drag, resize and place every section yourself.',
        ],
        closing: ['Whichever you pick, you can change the colours, the font and the layout of the page afterwards.'],
      },
      {
        heading: 'PDF or PNG?',
        paragraphs: [
          'Download a PDF to email to a client or keep for your records: it is a single page that opens anywhere. Download a PNG when you want a picture of the invoice to paste into a chat or a document.',
        ],
      },
    ],
    faq: [
      {
        question: 'Are the invoice templates really free?',
        answer: 'Yes. All 105 designs are free to use, with no sign-up and no watermark on the invoice you download.',
      },
      {
        question: 'Can I change a template’s colours and fonts?',
        answer: 'Yes. Pick an accent colour and a font for any design, add your logo, and move or resize parts of the page.',
      },
      {
        question: 'Can I use these templates for any kind of business?',
        answer: 'Yes. They are general-purpose invoices: you enter your own business details, your client’s and the items you are charging for.',
      },
      {
        question: 'Do I have to download anything to use a template?',
        answer: 'No. Templates open in your browser and you download only the finished invoice, as a PDF or a PNG.',
      },
    ],
    related: ['/freelance-invoice-generator', '/how-to-write-an-invoice', '/invoice-generator-no-sign-up'],
    updated: '2026-11-17',
  },
  {
    path: '/invoice-payment-terms',
    kind: 'article',
    keyword: 'invoice payment terms',
    title: 'Invoice Payment Terms: Examples (Net 30, Due on Receipt)',
    description:
      'Invoice payment terms explained: Net 7, Net 14, Net 30, due on receipt and more, with example wording and tips on choosing and enforcing terms.',
    kicker: 'Guide',
    h1: 'Invoice payment terms: examples and how to choose',
    summary: 'Net 7, Net 14, Net 30, due on receipt and more — what each means and how to word it.',
    intro:
      'Payment terms tell a client when and how you expect to be paid. Clear terms on every invoice are the simplest way to get paid on time. Below are the most common ones, what they mean and when each is a good choice.',
    sections: [
      {
        heading: 'Common invoice payment terms',
        table: {
          caption: 'Common payment terms',
          head: ['Term', 'What it means', 'Good for'],
          rows: [
            ['Due on receipt', 'Payment is due as soon as the client receives the invoice.', 'Small jobs, new clients and one-off work.'],
            ['Net 7', 'Payment is due 7 days after the invoice date.', 'Quick projects and retainers.'],
            ['Net 14', 'Payment is due 14 days after the invoice date.', 'Freelance and small-business work.'],
            ['Net 30', 'Payment is due 30 days after the invoice date.', 'Larger companies, which often pay on a monthly cycle.'],
            ['Net 60 or Net 90', 'Payment is due 60 or 90 days after the invoice date.', 'Only when the client requires it — it delays your cash flow.'],
            ['End of month (EOM)', 'Payment is due at the end of the month. State which month.', 'Clients who pay on a monthly run.'],
            ['2/10 Net 30', 'A 2% discount if paid within 10 days; otherwise the full amount is due in 30 days.', 'Encouraging early payment.'],
            ['50% upfront, 50% on delivery', 'Half before work starts, the rest when it is done.', 'Larger projects and custom work.'],
          ],
        },
      },
      {
        heading: 'How to choose payment terms',
        bullets: [
          'The shorter the term, the sooner you are paid. Net 14 or due on receipt suit most freelancers and small businesses.',
          'Larger clients often have fixed payment cycles of 30 days or more. Agree the term in your quote or contract before you start.',
          'For new clients or big projects, ask for a deposit so you are not carrying the whole cost of the work.',
          'Use the same terms on every invoice to the same client, so they know what to expect.',
        ],
      },
      {
        heading: 'How to word payment terms on an invoice',
        paragraphs: ['Keep it short and specific. Examples you can copy:'],
        bullets: [
          '“Payment due within 14 days of the invoice date.”',
          '“Payment due by 26 November 2026. Please pay by bank transfer to the account below.”',
          '“50% deposit due now; the balance is due on delivery.”',
          '“2% discount if paid within 10 days; full amount due within 30 days.”',
        ],
      },
      {
        heading: 'Late fees and interest',
        paragraphs: [
          'You can charge a late fee or interest only if it was agreed in advance. Put it in your contract or quote, and repeat it on the invoice. Limits and rules differ from country to country, so check the ones that apply to you.',
        ],
      },
      {
        heading: 'Add payment terms in the invoice generator',
        paragraphs: [
          'Most designs show a Payment Terms line in the footer. Click it and type your terms. Add your bank details or a payment link the same way, so your client can pay in one step.',
        ],
      },
    ],
    faq: [
      {
        question: 'What does Net 30 mean on an invoice?',
        answer: 'It means payment is due 30 days after the invoice date. Net 14 means 14 days, and so on.',
      },
      {
        question: 'What payment terms are best for freelancers?',
        answer:
          'Net 14 or due on receipt are the most common choices for freelancers, with a deposit for larger projects. Use longer terms only when a client requires them.',
      },
      {
        question: 'Can I use different payment terms for different clients?',
        answer: 'Yes. Agree the terms with each client in advance, write them on every invoice, and keep them the same for that client from then on.',
      },
      {
        question: 'Do I have to charge late fees?',
        answer: 'No. You only can if it was agreed in advance. Many businesses simply state the due date clearly and follow up politely.',
      },
    ],
    related: ['/how-to-write-an-invoice', '/freelance-invoice-generator', '/invoice-template-pdf'],
    updated: '2026-11-17',
  },
]

export function pageByPath(path: string): SeoPage | undefined {
  return SEO_PAGES.find((p) => p.path === path)
}

/** Every piece of text on a page, in reading order — for word counts and for checking what the page says. */
export function pageText(page: SeoPage): string {
  const parts: string[] = [page.title, page.description, page.kicker, page.h1, page.intro]
  for (const s of page.sections) {
    parts.push(s.heading, ...(s.paragraphs ?? []), ...(s.bullets ?? []))
    for (const step of s.steps ?? []) parts.push(step.title, step.text)
    for (const item of s.list ?? []) parts.push(item.term, item.text)
    if (s.table) parts.push(s.table.caption, ...s.table.head, ...s.table.rows.flat())
    parts.push(...(s.closing ?? []))
  }
  for (const q of page.faq) parts.push(q.question, q.answer)
  return parts.join('\n')
}

/** The words a reader gets: the body of the page, not the title or description. */
export function wordCount(page: SeoPage): number {
  const body = pageText(page).split('\n').slice(5).join(' ')
  return body.split(/\s+/).filter(Boolean).length
}
