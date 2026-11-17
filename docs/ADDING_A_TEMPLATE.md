# Adding a new template

There are two ways to contribute a design, at two different effort levels — read [ARCHITECTURE.md's "Layout × Preset"](./ARCHITECTURE.md#layout--preset--how-20-components-become-a-100-entry-catalog) section first if you haven't, it explains why the catalog is structured this way:

- **A new preset of an existing layout** (cheap): pick an existing layout you like and add one more color/font combination to its `buildPresets(...)` call in `registry.ts`. No component to write — skip straight to [step 3](#3-register-it) below with an existing `component`.
- **A whole new layout** (the real work, described below): a single React component that satisfies one contract, plus its own set of presets. This is the main way to meaningfully expand the catalog — you don't need to touch the editor, the store, or the export pipeline.

## The contract

```ts
// src/templates/shared/InvoiceTemplateProps.ts
export interface InvoiceTemplateProps {
  invoice: Invoice
}
```

That's it. Your component receives the current `Invoice` (see `src/types/invoice.ts`) and returns JSX. It will be used, unmodified, in three places automatically once it's registered:

1. The **template picker** (the full-page Gallery and the in-editor drawer both use it), as a live scaled-down thumbnail per preset (real render, not a screenshot — so it can never go out of sync with the actual design).
2. The **editor's live preview**.
3. The **image and PDF exporters**, which rasterize whatever your component renders.


## Steps

### 1. Create a folder and component

```
src/templates/22-your-layout-name/YourLayoutName.tsx
```

Use the next free number prefix (there are 21 layouts today) and a kebab-case folder name — this only affects reading order in the file tree, not behavior.

### 2. Build the component using the shared primitives

Start from this skeleton (copy it directly — it's a complete, working template):

```tsx
import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

export function YourTemplateName({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor

  return (
    <InvoicePage font={invoice.theme.font}>
      <div style={paddingStyle(invoice.theme.padding)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {invoice.sections.logo && (
              <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor={accent} />
            )}
            <div>
              <p className="text-lg font-semibold text-slate-900">{invoice.from.name || 'Your Business'}</p>
              <p className="text-sm text-slate-500">{invoice.from.email}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold uppercase tracking-wide" style={{ color: accent }}>
              <Label id="title">Invoice</Label>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              <FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText>
            </p>
            <p className="text-sm text-slate-500">
              <Label id="issueDate">Issued</Label> <EditableDate value={invoice.issueDate} field="issueDate" /> ·{' '}
              <Label id="dueDate">Due</Label> <EditableDate value={invoice.dueDate} field="dueDate" />
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-8">
          {invoice.sections.from && (
            <PartyBlock
              which="from"
              label="From"
              party={invoice.from}
              labelClassName="text-xs font-semibold uppercase tracking-wider text-slate-400"
              nameClassName="mt-1 font-semibold text-slate-900"
              lineClassName="text-sm text-slate-500"
            />
          )}
          {invoice.sections.to && (
            <PartyBlock
              which="to"
              label="Bill To"
              party={invoice.to}
              labelClassName="text-xs font-semibold uppercase tracking-wider text-slate-400"
              nameClassName="mt-1 font-semibold text-slate-900"
              lineClassName="text-sm text-slate-500"
            />
          )}
        </div>

        <div className="mt-10">
          <LineItemsTable
            items={invoice.items}
            currency={invoice.currency}
            headClassName="border-b-2 border-slate-800"
            headCellClassName="py-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
            rowClassName="border-b border-slate-100"
            cellClassName="py-3 text-sm text-slate-700"
          />
        </div>

        <div className="ml-auto mt-6 w-72">
          <Totals
            invoice={invoice}
            rowClassName="flex justify-between py-1 text-sm text-slate-600"
            totalRowClassName="mt-2 flex justify-between border-t-2 pt-2 text-base font-bold text-slate-900"
            totalRowStyle={{ borderColor: accent }}
          />
        </div>

        {hasFooterContent(invoice) && (
          <div className="mt-14 space-y-3 border-t border-slate-200 pt-6 text-sm text-slate-500">
            {invoice.sections.paymentTerms && invoice.paymentTerms && (
              <p><FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText></p>
            )}
            {invoice.sections.bankDetails && invoice.bankDetails && (
              <p><FieldText field="bankDetails">{invoice.bankDetails}</FieldText></p>
            )}
            {invoice.sections.notes && invoice.notes && <p><FieldText field="notes">{invoice.notes}</FieldText></p>}
          </div>
        )}

        {invoice.sections.signature && (
          <Signature
            invoice={invoice}
            className="mt-16 grid grid-cols-2 gap-10"
            lineClassName="h-px w-full bg-slate-300"
            nameClassName="mt-3 text-sm font-semibold text-slate-900"
            labelClassName="text-xs text-slate-400"
            dateClassName="mt-2 text-xs text-slate-400"
          />
        )}
      </div>
    </InvoicePage>
  )
}
```

From there, make it *yours* — change the layout, colors, typography, spacing, which primitives you use and how. The 20 existing layouts in `src/templates/` (Classic, Bold Gradient, Dark Mode, Elegant Serif, Minimal Mono, Ledger, Watermark, Blueprint, etc.) are meant to be read as real examples of how differently you can style the same primitives.

**Rules of thumb:**

- **Never hardcode the accent color as a Tailwind class.** `invoice.theme.accentColor` is a runtime value (from a color picker) — Tailwind can only generate CSS for class names it sees at build time, so `bg-[${accent}]` silently breaks in production. Always pass dynamic colors through the `style` prop (see how the skeleton above does `totalRowStyle={{ borderColor: accent }}`).
- **Don't set `font-family` on individual elements.** `InvoicePage` already sets it once at the root from `invoice.theme.font`; everything inherits it. If you want one element to always use a specific font regardless of the user's font choice (a decorative heading, say), that's fine — just do it deliberately with an inline `style={{ fontFamily: "...", ...}}` (see `ConsultantCleanTemplate`'s `LETTERHEAD_FONT` for an example), not as your template's default.
- **Wrap everything in `<InvoicePage>`.** It fixes the page to a 794px-wide (A4-proportioned) box so your design exports at a predictable size alongside the other 10.
- **Keep it a pure function of `invoice`.** No local state, no effects — the same `invoice` should always render the same output, since this component is reused verbatim for the gallery thumbnail, the live preview, and the exporters.
- **Honor `invoice.sections`, don't infer visibility from content.** Logo, business details, client details, payment terms, bank details, notes, and the signature block each have a checkbox in the toolbar's Sections popover (`invoice.sections.logo` / `.from` / `.to` / `.paymentTerms` / `.bankDetails` / `.notes` / `.signature`). A section should only render when its toggle is on — use the `hasFooterContent()` helper from `../shared/sectionVisibility` for the combined footer block, and gate `<Logo>`, the two `<PartyBlock>`s, and `<Signature>` directly on their own toggle, exactly as the skeleton above does. If you skip this, unchecking a box in the toolbar won't actually hide anything in your template. If only one of the two `<PartyBlock>`s ends up visible, let it sit alone in the grid rather than reserving space for the hidden one — that's what conditionally rendering it (instead of always rendering both and hiding one with CSS) gets you for free.
- **Print the issue and due dates with `<EditableDate value={invoice.issueDate} field="issueDate" />` (and `dueDate`), never `formatDate(...)` directly.** It renders the same formatted text, inline and inheriting your font/size/color/case, so your layout looks identical — but in the editor, clicking it opens a calendar to pick a new date, and everywhere else (design-picker thumbnails, exports) it's plain text. Put it where the date text goes inside your own `<p>`/`<span>`; keep the label ("Issued", "Due") outside it. `tests/datesOnEveryLayout.test.tsx` fails for a new layout that doesn't.
- **Never hardcode a label word or print the invoice number or footer text bare.** Every printed word around the data — the title ("Invoice"), "Issued" / "Due", "Invoice #", "Payment Terms:" and the like — goes through `<Label id="…">Your Wording</Label>` (ids: `title`, `invoiceNumber`, `issueDate`, `dueDate`, `from`, `billTo`, `subtotal`, `discount`, `tax`, `total`, `paymentTerms`, `bankDetails`, `signatureBusiness`, `signatureClient`), with *your layout's own wording as the child* — so the design looks exactly as you drew it until the user clicks a label and rewords it (the wording is saved with the invoice and used by every design). The invoice number, and the payment terms / bank details / notes text, go through `<FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText>` (or `paymentTerms`, `bankDetails`, `notes`); a line of the business that your layout prints in its own strip rather than through `PartyBlock` goes through `<PartyLine which="from" field="address">`. Clicking any of these turns it into a text box right where it is on the page. `PartyBlock`, `Totals` and `Signature` already do this for their own headings, so a label you pass them (`label="Billed to"`) is handled. Outside the editor (a thumbnail) all of them are just their text. `tests/itemsOnEveryLayout.test.tsx` fails for a new layout that skips them; if a design genuinely has no word for something (a date shown bare, no title), add it to that test's `NO_DATE_LABELS` / `NO_TITLE` list with the reason.
- **Use the shared primitives for the logo, parties, line items, totals and signature — that's what makes them draggable.** Each primitive (`Logo`, `PartyBlock`, `LineItemsTable`, `Totals`, `Signature`) tags its own root element and shifts itself by however far the user has dragged it (`SectionOffsetsContext`), so every layout built from them lets people move those sections anywhere on the page with no extra code. Your own hand-rolled markup — the business-name block, the INVOICE title, the dates box, the footer — isn't a primitive, so tag each piece yourself with `<Movable id="brand">` (also `title`, `meta`, `footer`; `number` for a standalone invoice number): it's a drop-in for the element it replaces, with the same tag and classes, so it won't disturb your flex/grid. If a primitive sits inside a decorated box (a bordered Bill To card, say), wrap the **box** in `<Movable id="to">` with the *same id* as the primitive so the box and its contents move together. Every layout in the repo does this, and `tests/movableSections.test.tsx` picks up a new layout automatically. Tagging a block this way is also what makes it *restyleable*: the style bar's size, color, bold and italic work on anything that's a primitive or a `<Movable>`, applied to every line of text inside it — so avoid giving a block's text a color that must never change (that would defeat a user's override on purpose); a design's accent color on a *decoration* (a border, a background) is unaffected, only text color is overridden. The free-floating Text/Table/Image/Divider elements need nothing from your layout at all — they float over whichever design is active.
- **Always pass `which="from"` / `which="to"` to `<PartyBlock>`.** It's a required prop, not cosmetic: `PartyBlock` uses it internally (via `useCanvasEdit()`) to know which half of the invoice a click-to-edit change should write to. Every field inside `PartyBlock` — including the ones you didn't customize with class props — is click-to-edit on the live invoice preview automatically; there's nothing else to wire up for that.
- **Apply `paddingStyle(invoice.theme.padding)` to your content wrapper, not to `<InvoicePage>`.** If your design has a full-bleed element — a colored header band, a top accent bar — keep that outside the padded wrapper (see `BoldGradientTemplate` or `CorporateBlueTemplate`) so it stays edge-to-edge no matter what padding the user sets.

### 3. Register it

Add one `buildPresets(...)` block to the `TEMPLATES` array in `src/templates/registry.ts`, with 5 curated presets (pick colors deliberately — they're what makes 5 entries actually look like 5 different options, not a random palette):

```ts
import { YourLayoutName } from './22-your-layout-name/YourLayoutName'

// ...appended to the TEMPLATES array:
...buildPresets(
  'your-layout-name',              // layoutId — stable, unique, becomes the persisted templateId for the signature preset
  'Your Layout Name',               // shown as the section heading in the picker
  'One sentence describing the look.',
  YourLayoutName,
  uniformPadding(56),                // base padding in px; use { top, right, bottom, left } for asymmetric
  'inter',                           // base FontId (see src/types/invoice.ts) — presets can override per-entry
  [
    { suffix: 'signature', name: 'Ink', accentColor: '#2563eb' }, // 'signature' → bare id 'your-layout-name'
    { suffix: 'forest', name: 'Forest', accentColor: '#15803d' }, // → id 'your-layout-name-forest'
    { suffix: 'wine', name: 'Wine', accentColor: '#9f1239' },
    { suffix: 'slate', name: 'Slate', accentColor: '#334155' },
    { suffix: 'amber', name: 'Amber', accentColor: '#b45309' },
  ],
),
```

Exactly one preset should use `suffix: 'signature'` — that's the one whose `id` is the bare `layoutId` with no suffix. (This matters for backward compatibility on the 10 original layouts, whose bare ids are already saved in users' `localStorage` — for a brand-new layout it's just a naming convention, but keep it for consistency across the catalog.)

That's the whole integration — no other file needs to change. The picker (Gallery page + in-editor drawer), the editor, and both rasterized exporters all read from this one array; `getLayoutGroups()` automatically sections your 5 presets under the layout name you gave it.

### 4. Check it

```bash
npm run dev
```

Open the app — your layout should appear as a new section in the template picker (search for its name to jump straight to it) with 5 live (not static) thumbnails. Pick one, fill in some sample data, and try both exports (Image / PDF) to confirm nothing overflows or clips oddly at full resolution. If your layout's content area is narrower than the full page width (a sidebar, a split layout — see `SidebarAccentTemplate` or `TwoToneSplitTemplate`), give `LineItemsTable`'s `cellClassName`/`headCellClassName` explicit horizontal padding (e.g. `pl-2 first:pl-0`) — without it, right-aligned numeric columns can visually run together in a narrower table.

Also click directly into the business name, an address line, and a line-item description in the live preview (not a thumbnail) to confirm they're editable in place — this comes for free from `PartyBlock`/`LineItemsTable`, but it's worth a quick check that you didn't accidentally bypass those primitives with custom markup. Drag the Bill To block and the totals somewhere else on the page, confirm they move and that the page doesn't need to reflow around them, then use "Reset positions" in the left drawer. Then click the same fields on one of your layout's *thumbnail* cards in the picker grid and confirm nothing happens — thumbnails must stay inert (see `CanvasEditContext` in [ARCHITECTURE.md](./ARCHITECTURE.md)).
