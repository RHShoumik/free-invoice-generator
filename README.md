# Invoice Generator

A free, private invoice generator that runs entirely in your browser. Pick from 105 designs (21 distinct layouts, each in 5 curated color styles — including a Freeform Canvas layout with an open element palette for adding and freely positioning content), click directly on the invoice to edit your details, reorder line items by drag-and-drop, and download the result as an **image (PNG)** or a **PDF**.

There is no backend, no account, and no upload — everything (including your logo) stays on your device in `localStorage`. This project is open source; see [CONTRIBUTING.md](CONTRIBUTING.md) if you'd like to add a design or feature.

## Features

- **105 designs** — 21 distinct layouts (Classic, Modern Minimal, Bold Gradient, Corporate Blue, Creative Agency, Dark Mode, Elegant Serif, Startup/Tech, Minimal Mono, Consultant Clean, Ledger, Boarding Pass, Editorial, Watermark, Sidebar Accent, Postcard, Timeline, Two-Tone Split, Stamp & Seal, Blueprint, Freeform Canvas), each offered in 5 curated color presets
- **No sidebar — click-to-edit, like a page builder** — business info, client info, line items, and the logo are editable by clicking them directly on the invoice, clicking the issue or due date opens a calendar to pick a new one, and clicking any other text (the invoice number, the "Invoice" title, a label like "Issue Date" or "Total", the notes, payment terms and bank details, a design's own From lines) or an image opens a left drawer with just that item to edit, on every one of the 21 layouts; a slim top toolbar holds only what has no visual home on the page (dates, currency/tax/discount, column visibility, section show/hide, design/style)
- **Canvas on every design** — a floating Elements card works on all 105 designs: drag a Text, Table, Image, or Divider card onto the page to drop it right where you let go (or just click it), then move, resize, duplicate, and delete it. You can also drag *any* part of the design — the logo, business name, INVOICE title, dates, From, Bill To, line items, totals, notes, signature — anywhere on the page, overlapping anything, without anything else moving, with a one-click "Reset positions"
- **Color just some words** — in a Text box you added, select some words and pick a color (or bold / italic) to change only those; with nothing selected, the change applies to the whole box
- **Uploads drawer** — a left drawer that keeps the images you upload (logos, stamps, photos) in your browser across invoices: drag one onto the page to drop it where you let go, click it to add it, or use it as the logo
- **Draw on the page** — a Draw tool on the dock: pencil, line, arrow, rectangle and ellipse, with a color, a thickness and (for shapes) a fill; Shift keeps a shape square or a line at 45°. A drawing is a normal element afterward — move it, resize it, recolor it, fade it, undo it — and drawing around something never gets in the way of clicking it
- **Your own watermark** — the Watermark design's background watermark is yours to change: type any text ("PAID", "DRAFT", your name) or upload an image (a logo, a stamp), then move, resize, fade and (for text) recolor it
- **Restyle anything** — click any part of the page, built into the design or added by you (business info, line items, totals, the title, notes, the logo…), and the bar under the header changes its size, color, bold, and italic, with a one-click Reset. Everything moves and restyles independently, and undo covers it
- **Freeform Canvas** — one of the 21 layouts is a blank canvas instead of a fixed design: *every* element, including your business info, line items, and totals, is freely positioned and width-resizable, and can be duplicated or deleted
- **A light, floating editor** — a slim top bar with undo/redo and a one-click Download menu (PNG or PDF), a floating dock of tools (Designs, Elements, Uploads, Draw, Details, Columns, Sections, Style), a floating style pill that appears when you click something, and a dotted-paper workspace with the invoice sitting on it as a page
- **Browse designs without leaving the editor** — the *Designs* tool opens a large modal of live design previews (the current one is marked), alongside the full-page Template Gallery, both searchable and grouped by layout
- **Drag-and-drop line items** — reorder items with a mouse or touch by grabbing the handle directly on the invoice preview
- **Undo / redo** — a button pair in the header (or Ctrl/⌘+Z, Ctrl/⌘+Shift+Z) steps back and forward through every edit: typing, moving things, adding or deleting elements, restyling, switching designs. Typing a word is one step, not one per letter
- **Click any text, edit it right there** — the invoice number, the title, every printed label ("Issued", "Bill To", "Subtotal", "Total", "Payment Terms"…), the notes / payment terms / bank details text, and a design's own address / email / phone lines turn into a text box in place when you click them: the cursor lands where you clicked, Enter or clicking away finishes, Escape puts the text back. Pictures open the left drawer instead (an added Image or the watermark → the picture with Replace / Remove; the logo → the Business drawer below). Reworded labels are saved with the invoice, shared by every design, and shown in the PNG and PDF. Undo covers it
- **Business drawer** — click the business name on the invoice (or the From block on Freeform Canvas) and a left drawer opens with the business name, email and logo, all editable there. The logo gets a *Fit* choice — **Fill** (covers the square and crops the overflow), **Fit** (the whole image) or **Stretch** — a 3×3 **Position** grid for which part of the image stays in view, and the square / rounded / circle shape, with a preview that matches what prints
- **Logo panel** — click the logo on the invoice and a panel offers Replace, Remove, a square / rounded / circle shape and a size (double-click it to jump straight to the file picker); resized client-side before storage, so it stays fast and small
- **Two-party signature block** — an optional sign-off section for both business and client
- **Show/hide any optional section** — checkboxes in the toolbar's Sections menu for the logo, your business details, client details, payment terms, bank details, notes, and the signature block; hiding one keeps the text you entered, it just leaves it off the invoice
- **Customizable line-item table** — rename any column header (Description, Qty, Rate, Amount), hide the Qty or Rate column entirely for invoices that don't need that breakdown, and add your own custom columns (SKU, Hours, etc.) with the "+ Add column" button
- **Adjustable page padding** — independent top/right/bottom/left spacing, with a one-click reset back to the design's default
- **Live, WYSIWYG preview** — what you see in the editor is exactly what gets exported
- **Switch designs anytime** without losing your entered data
- **Per-invoice styling** — accent color, font, and padding, independent of the base design
- **Two export formats**: PNG image and PDF — both are a picture of exactly what's on screen
- **Autosave** — your in-progress invoice persists in `localStorage` across page reloads
- **No backend, no tracking, no sign-up**

## Tech stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives) for the app UI — `npx shadcn add <component>` to pull in more
- [Zustand](https://github.com/pmndrs/zustand) for state, with its `persist` middleware backing `localStorage`
- [@dnd-kit](https://dndkit.com/) for accessible drag-and-drop
- [html-to-image](https://github.com/bubkoo/html-to-image) + [jsPDF](https://github.com/parallax/jsPDF) for the image/PDF export pipeline
- Self-hosted [Fontsource](https://fontsource.org/) fonts (no external font CDN)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how these fit together and why.

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open the printed local URL. That's it — there's no environment configuration, no API keys, and no database to set up.

Other scripts:

```bash
npm run build      # type-check and build a static production bundle to dist/
npm run preview    # serve the production build locally
npx vitest run     # run unit tests (calculation logic)
npm run lint        # lint the codebase
```

`npm run build` produces a fully static `dist/` folder — deploy it anywhere that serves static files (GitHub Pages, Netlify, Vercel, or just open `dist/index.html`).

## Project layout

```
src/
├── features/
│   ├── template-gallery/   # the design picker (grid, search, lazy thumbnails) — full page + shared with the drawer
│   ├── invoice-editor/     # the editor: toolbar + live, click-to-edit preview + the in-editor Designs modal
│   └── export/             # the two exporters (image, pdf)
├── templates/               # 21 layouts × 5 presets = 105 designs — see docs/ADDING_A_TEMPLATE.md
├── store/                   # the single Zustand store (+ localStorage persistence)
├── types/                   # the Invoice data model
├── lib/                     # pure helpers: totals math, currency, dates, color, image resize
└── components/ui/           # small shared UI primitives (Button, Field, Popover, ...)
```

Full write-up: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Deploying and search engines (SEO)

The home page is built to rank for searches like *invoice generator*, *free invoice generator* and *one click invoice*: keyword-bearing title, description and headings, a "how it works" section, features and an FAQ on the page, structured data (`WebSite`, `WebApplication`, `FAQPage`), social-share cards, a plain-HTML copy of the page for crawlers that run no JavaScript, `robots.txt` and `sitemap.xml`. The editor (`/editor`) tells search engines not to index it; the home page is what ranks.

**The site's address is `https://free-invoice-generator.rhshoumik.dev`**, set in `.env.production` (committed — it isn't a secret, it's printed in the page). Production builds, including Vercel's, read it and write it into the canonical link, the share-card image URLs, `sitemap.xml`, `robots.txt` and the structured data; the build writes none of those without an address, because a wrong one does harm. To deploy at a different address, change that one line, or set `VITE_SITE_URL` in the host's dashboard (it overrides the file) — see `.env.example`.

To go live on Vercel with that address: import the repo at vercel.com/new (Vite is detected; `vercel.json` handles `/editor` and caching), add `free-invoice-generator.rhshoumik.dev` under the project's Settings → Domains, and create the DNS record Vercel shows — at Hostinger that is a `CNAME` named `free-invoice-generator` (just that part) pointing to the target Vercel gives you. Then add the site in [Google Search Console](https://search.google.com/search-console), submit `https://free-invoice-generator.rhshoumik.dev/sitemap.xml`, and check the page with Google's Rich Results Test. On other hosts, make sure `/editor` serves `index.html`.

**Analytics.** `<Analytics />` from [`@vercel/analytics`](https://vercel.com/docs/analytics) is in `src/main.tsx`. It counts anonymous page visits (`/` and `/editor`) — no cookies, and nothing from an invoice ever leaves the browser. It does nothing until you switch Analytics on for the project in Vercel (Project → Analytics → Enable) and redeploy; in local development it only logs to the console. The privacy FAQ on the home page tells visitors about it. To remove it, delete that component and the package.

**Content pages.** Besides the home page there are five pages, each answering a search the home page can't answer in full — `/freelance-invoice-generator`, `/invoice-generator-no-sign-up`, `/how-to-write-an-invoice`, `/invoice-template-pdf` and `/invoice-payment-terms` — each with its own title, description, canonical link, structured data (an `Article` for the guides, plus a breadcrumb and its own FAQ) and a plain-HTML copy. The build writes each one as a file of its own (`dist/<page>/index.html`) so a crawler gets that page's tags and text in the first response, and lists them all in `sitemap.xml`. The editor (`/editor`) gets its own file saying `noindex`; any address the app doesn't know shows a "not found" page that also says `noindex`. **To add or change a page, edit `src/lib/seoPages.ts`** (and bump its `updated` date): the page, its tags, its sitemap entry and the home page's link to it all follow, and `tests/seoPages.test.ts` fails if a page is too thin, repeats another's title, or claims something the app doesn't do.

Everything the site says about itself — title, description, keywords, headline, steps, features, FAQ, and the "Developed by" credit — lives in `src/lib/site.ts` (and the content pages in `src/lib/seoPages.ts`); the page, the `<head>` tags and the structured data all read it, so they cannot disagree. Rankings can't be promised: this is the technical and on-page groundwork, and where the site lands depends on the competition, the site's age and the links pointing at it.

## Adding a new design

Templates are the main extension point for contributors, at two effort levels: add one more color preset to an existing layout (cheap — one registry entry), or build a whole new layout (one new component + its own presets). Walkthrough: [docs/ADDING_A_TEMPLATE.md](docs/ADDING_A_TEMPLATE.md).

## Known limitations

- **PDF text isn't selectable.** The PDF export rasterizes the on-screen design (so it's pixel-identical to whichever template is active) rather than generating vector text. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#export-pipeline) for the trade-off.
- **Very long invoices export as one tall PDF page** rather than paginating across multiple A4 pages.
- **On a phone, tap to edit; sections can't be dragged.** A finger moving over the page is scrolling it, so on touch screens the fixed designs' sections are not draggable (tapping selects and edits; use a mouse to reposition them). The invoice is shrunk to fit the screen — pinch to zoom in. The bottom tool dock scrolls sideways, and panels float over the page instead of making room beside it.

## License

[MIT](LICENSE)
