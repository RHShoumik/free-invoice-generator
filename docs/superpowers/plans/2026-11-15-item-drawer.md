# Item drawer (click an item, edit it on the left) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking an invoice number, a label, a footer text, a layout's own From lines, an Image element or the watermark opens the left drawer with just that item to edit.

**Architecture:** Clickable texts are inline `<span role="button">` primitives that call `openItem(target)` from `CanvasEditContext`; `EditorLayout` owns a new `'item'` left panel and renders `ItemDrawer`, which reads/writes the store directly. Label wording lives in `invoice.labels` (optional), reaches the primitives through a `LabelsContext` provided by `InvoicePreview`, and every layout's own wording is the fallback.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind v4, Radix/shadcn, vitest + jsdom.

**Spec:** `docs/superpowers/specs/2026-11-15-item-drawer-design.md`

**No git here:** the folder is not a repository, so there are no commit steps. `EditorLayout.tsx`, `Dock.tsx` and `BusinessDrawer.tsx` are edited by a parallel session: targeted `Edit`s only, never whole-file rewrites.

## Global Constraints

- Outside the live editor (design-picker thumbnails, no `CanvasEditContext`) every new primitive renders plain text: no wrapper, no click.
- A clickable text is `<span role="button" tabIndex={0}>`, never a `<button>` (`useSectionDrag` skips drags that start on a `button`).
- Nothing may shift at rest: `-mx-0.5 px-0.5`, tint only on `hover` / `focus-visible` (`hover:bg-current/10`).
- `Invoice.labels` is optional; no persistence migration.
- Label keys, exactly: `title`, `invoiceNumber`, `issueDate`, `dueDate`, `from`, `billTo`, `subtotal`, `discount`, `tax`, `total`, `paymentTerms`, `bankDetails`, `signatureBusiness`, `signatureClient`.
- Gates at the end: `npx tsc -b --noEmit`, `npx vitest run`, `npm run lint` (only the existing `button.tsx` warning), `npm run build`.

## Review Focus

1. A label the user clears to empty: nothing is exported for it (`data-export-hide`), but the editor span stays clickable (Task 2 test).
2. An invoice saved before this feature (no `labels`) loads and renders identically; saved `labels` survive a reload (Task 1 test).
3. Pressing and dragging a label or the invoice number moves its section and does not open the drawer: the span is `role="button"`, not a `<button>` (Task 2 test; browser check in Task 5).
4. The drawer is open on an Image element that is then deleted, or on a watermark after switching away from the Watermark design: it closes, it does not crash (Task 3 test).
5. Switching designs keeps the user's wording; a layout without that role ignores it and still renders (Task 4 test over all 21).
6. Undo: wording typed, a pause, more wording = two steps; undo returns the layout's own wording (Task 1 test).

---

### Task 1: Labels in the data model, the store, and the Word export

**Files:**
- Modify: `src/types/invoice.ts` (add types, `Invoice.labels?`)
- Create: `src/lib/labels.ts`
- Modify: `src/store/invoiceStore.ts` (add `setLabel`), `src/store/history.ts` (signature for `labels`)
- Modify: `src/features/export/exportToDocx.ts` (use labels for the header line, party headings, totals, signature captions)
- Test: `tests/labels.test.ts`

**Interfaces:**
- Produces (types): `export type LabelKey = 'title' | 'invoiceNumber' | 'issueDate' | 'dueDate' | 'from' | 'billTo' | 'subtotal' | 'discount' | 'tax' | 'total' | 'paymentTerms' | 'bankDetails' | 'signatureBusiness' | 'signatureClient'`; `export type InvoiceLabels = Partial<Record<LabelKey, string>>`; `Invoice.labels?: InvoiceLabels`.
- Produces (`src/lib/labels.ts`): `resolveLabel(labels: InvoiceLabels | undefined, key: LabelKey, fallback: string): string` (the override when the key is present, even if `''`; otherwise `fallback`); `LABEL_TITLES: Record<LabelKey, string>` (drawer headings: `title: 'Title'`, `invoiceNumber: 'Invoice number'`, `issueDate: 'Issue date'`, `dueDate: 'Due date'`, `from: 'From'`, `billTo: 'Bill to'`, `subtotal: 'Subtotal'`, `discount: 'Discount'`, `tax: 'Tax'`, `total: 'Total'`, `paymentTerms: 'Payment terms'`, `bankDetails: 'Bank details'`, `signatureBusiness: 'Business signature'`, `signatureClient: 'Client signature'`).
- Produces (store): `setLabel(key: LabelKey, text: string | undefined): void`, undoable; `undefined` removes the override.

- [ ] **Step 1: Write the failing tests** in `tests/labels.test.ts`: `resolveLabel` returns the fallback when unset, the override when set, and `''` (not the fallback) when the override is the empty string; `setLabel('issueDate', 'Date issued')` then `useInvoiceStore.getState().invoice.labels?.issueDate === 'Date issued'`; `setLabel('issueDate', undefined)` removes the key; `undo()` after two `setLabel` calls 2 s apart (fake `Date` only, as in `tests/history.test.ts`) steps back one at a time and the second undo restores `labels?.issueDate === undefined`; two calls inside `COALESCE_MS` are one undo step; the store's `merge` keeps a persisted `labels` and an old persisted invoice with no `labels` loads with `invoice.labels === undefined`.
- [ ] **Step 2: Run** `npx vitest run tests/labels.test.ts` — Expected: FAIL (`resolveLabel` / `setLabel` not defined).
- [ ] **Step 3: Implement** the types, `src/lib/labels.ts`, and `setLabel` through the store's undo-aware `set` wrapper. In `changeSignature` add a `'labels'` case producing `labels.<key>` for each key whose value changed, so typing one label merges and two labels don't.
- [ ] **Step 4: Word export.** Read `exportToDocx.ts`; replace each hardcoded word that maps to a key with `resolveLabel(invoice.labels, key, '<today's word>')` (header "Issued"/"Due", "From"/"Bill To", Subtotal/Discount/Tax/Total, the two signature captions). Behavior with no `labels` must be byte-for-byte what it was.
- [ ] **Step 5: Run** `npx vitest run` and `npx tsc -b --noEmit` — Expected: all green.

### Task 2: The clickable-text primitives and the context

**Files:**
- Create: `src/templates/shared/ItemTarget.ts`, `src/templates/shared/LabelsContext.ts`, `src/templates/shared/primitives/ItemText.tsx`, `src/templates/shared/primitives/Label.tsx`
- Modify: `src/templates/shared/CanvasEditContext.ts` (add `openItem?`), `src/templates/shared/primitives/index.ts` (exports), `PartyBlock.tsx`, `Totals.tsx`, `Signature.tsx` (headings/captions become `Label`s)
- Test: `tests/itemText.test.tsx`

**Interfaces:**
- Produces (`ItemTarget.ts`): `export type ItemTarget = { kind: 'label'; key: LabelKey; fallback: string } | { kind: 'field'; field: 'invoiceNumber' | 'notes' | 'paymentTerms' | 'bankDetails' } | { kind: 'party'; which: 'from' | 'to'; field: 'name' | 'address' | 'email' | 'phone' | 'taxId' } | { kind: 'image'; elementId: string } | { kind: 'watermark' }`; `itemKey(t: ItemTarget): string` (`label:issueDate`, `field:notes`, `party:from.address`, `image:<id>`, `watermark`).
- Produces (`LabelsContext.ts`): `LabelsProvider`, `useLabels(): InvoiceLabels | undefined`.
- Produces (`CanvasEditContext`): `openItem?: (target: ItemTarget) => void` on the context value.
- Produces (primitives): `ItemText({ target: ItemTarget, children: ReactNode })`: without `useCanvasEdit()?.openItem` returns `<>{children}</>`; otherwise an inline `<span role="button" tabIndex={0} data-item={itemKey(target)} aria-label={...}>` with the date's hover/focus tint, click and Enter/Space call `openItem(target)`. `Label({ id: LabelKey, children: string })`: text = `resolveLabel(useLabels(), id, children)` inside `ItemText` with target `{kind:'label', key: id, fallback: children}`; an empty text keeps the span `min-width: 1.5ch` and sets `data-export-hide="true"`. `FieldText({ field, children })` and `PartyLine({ which, field, children })`: thin `ItemText` wrappers.
- `PartyBlock` heading: `<Label id={which === 'from' ? 'from' : 'billTo'}>{label}</Label>`; `Totals`: ids `subtotal`, `discount` (the `({pct}%)` suffix stays outside the label), `tax`, `total`; `Signature`: `signatureBusiness` ("Authorized signature") and `signatureClient` ("Accepted by").

- [ ] **Step 1: Write the failing tests** (`tests/itemText.test.tsx`): without a provider `<Label id="issueDate">Issue Date</Label>` renders exactly the text with no `role="button"` and no wrapper; with `CanvasEditProvider` (spy `openItem`) the span has `role="button"`, `tabIndex 0`, is not a `<button>`, click calls `openItem({kind:'label', key:'issueDate', fallback:'Issue Date'})`, Enter and Space do too; with `LabelsProvider value={{issueDate:'Date issued'}}` it renders `Date issued` and the target's `fallback` is still `Issue Date`; `labels={{issueDate:''}}` renders an empty span that is still `role="button"` with `data-export-hide="true"`; `FieldText` click calls `openItem({kind:'field', field:'invoiceNumber'})`; `<Totals>` with `LabelsProvider {total:'Amount due'}` prints `Amount due` and still `Discount (10%)` keeps its suffix when `discount` is overridden; pressing (`pointerdown`) inside a label does not bubble a `stopPropagation` (it must reach the page's drag handler).
- [ ] **Step 2: Run** `npx vitest run tests/itemText.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement** the files above, reusing `EditableDate`'s class string and key handling.
- [ ] **Step 4: Run** `npx vitest run` and `npx tsc -b --noEmit` — Expected: all green (existing `PartyBlock`/`Totals`/`Signature` tests unchanged).

### Task 3: `ItemDrawer` and the editor wiring

**Files:**
- Create: `src/features/invoice-editor/ItemDrawer.tsx`
- Modify: `src/features/invoice-editor/toolbar/Dock.tsx` (`LeftPanel` gains `'item'`), `src/features/invoice-editor/EditorLayout.tsx` (state, `openItem` in the context value, render branch, `handleSelect`), `src/features/invoice-editor/InvoicePreview.tsx` (wrap the template in `LabelsProvider value={invoice.labels}`)
- Test: `tests/itemDrawer.test.tsx`

**Interfaces:**
- Consumes: `ItemTarget`, `itemKey`, `LABEL_TITLES`, `setLabel`, `useLogoUpload`, `defaultWatermarkText` (find where `EditorLayout` imports it from), store `updateField` / `updateFrom` / `updateTo` / `updateFreeformElementContent` / `resetWatermark`.
- Produces: `ItemDrawer({ target, onClose }: { target: ItemTarget; onClose: () => void })`, an `<aside>` in `BusinessDrawer`'s shell (`w-72`, header with `<h2>`, ✕ labelled `Close item panel`), keyed by `itemKey(target)` by the caller.
  - `label`: `<h2>{LABEL_TITLES[key]} label</h2>`, an `Input aria-label="Label text"` showing `labels[key] ?? target.fallback`, focused and selected on open; typing calls `setLabel`; a `Reset to default wording` button only while an override exists (calls `setLabel(key, undefined)`).
  - `field`: input (`invoiceNumber`) or `textarea` (`notes`, `paymentTerms`, `bankDetails`), `aria-label` = the field's title, bound to `invoice[field]` via `updateField`.
  - `party`: input/textarea bound to `invoice[which][field]` via `updateFrom` / `updateTo`.
  - `image`: the element from `invoice.freeformLayout` (`kind === 'image'`): preview, `Replace image` and `Remove image` (sets `dataUrl: null`); if the element no longer exists, `onClose()` runs and nothing renders.
  - `watermark`: text input (`watermarkText ?? defaultWatermarkText(invoice.from.name)`), image preview + `Replace image` / `Remove image` when `watermarkImage` is set, `Reset` (calls `resetWatermark`).
- `EditorLayout`: `const [item, setItem] = useState<ItemTarget | null>(null)`; `openItem = (t) => { setItem(t); setLeftPanel('item') }` added to the `CanvasEditProvider` value; branch `leftPanel === 'item' && item` renders `<ItemDrawer key={itemKey(item)} target={item} onClose={() => setLeftPanel(null)} />`; `handleSelect(id)` also opens the Business drawer for `id === 'logo'`, `openItem({kind:'watermark'})` for `id === 'watermark'`, and `openItem({kind:'image', elementId: id})` when `id` is an `image` element of `invoice.freeformLayout`.

- [ ] **Step 1: Write the failing tests** (`tests/itemDrawer.test.tsx`, store reset in `beforeEach` as `tests/businessDrawer.test.tsx` does): label target shows the fallback, typing `Date issued` updates `useInvoiceStore.getState().invoice.labels.issueDate`, `Reset to default wording` appears only then and clears it; a `field:notes` target is a `textarea` and edits `invoice.notes`; `field:invoiceNumber` edits `invoice.invoiceNumber`; `party:from.address` edits `invoice.from.address`; an `image` target with a dataUrl element shows `Replace image` / `Remove image`, Remove sets `dataUrl` null; an `image` target for a deleted element calls `onClose`; a `watermark` target edits `watermarkText` and `Reset` restores it. An integration test mounts `EditorLayout` (as `businessDrawer.test.tsx` does) and asserts: clicking the `[data-item="field:invoiceNumber"]` span shows the `Invoice number` drawer with that number; clicking the logo (`[data-section-id="logo"]`) shows the Business drawer; clicking a date still opens the calendar and not the drawer.
- [ ] **Step 2: Run** `npx vitest run tests/itemDrawer.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement** `ItemDrawer` and the targeted edits listed above.
- [ ] **Step 4: Run** `npx vitest run` and `npx tsc -b --noEmit` — Expected: all green.

### Task 4: Wire all 21 layouts

**Files:**
- Modify: the 21 `src/templates/*/…Template.tsx`, plus `src/templates/21-freeform/blocks/FreeformMetaBlock.tsx` and `FreeformFooterBlock.tsx`
- Test: `tests/itemsOnEveryLayout.test.tsx`

**Interfaces:**
- Consumes: `Label`, `FieldText`, `PartyLine` from `../shared/primitives`.
- Rules, applied to what each layout prints today (the wording stays the fallback, character for character, including any `uppercase` class on the parent):
  - the title word ("Invoice", "Invoice Pass", "Statement of Invoice"…) → `<Label id="title">`
  - the number and the word in front of it ("Invoice #", "No.", "Doc", "Invoice No", `#`) → `<Label id="invoiceNumber">` + `<FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText>`
  - "Issue Date" / "Issued" / "Rev." / "issued" → `<Label id="issueDate">`; "Due Date" / "Due" / "due" → `<Label id="dueDate">`
  - "Payment Terms: " / "Bank Details: " → `paymentTerms` / `bankDetails` labels; the `invoice.paymentTerms` / `bankDetails` / `notes` paragraphs → `FieldText` of that field
  - hand-rolled From lines (`address`, `email`, `phone`, `taxId` outside `PartyBlock` and outside the `brand` block) → `PartyLine`
  - Postcard's "Total Due" → `<Label id="total">`
  - `FreeformMetaBlock`'s typed number (`InlineField`) → `FieldText` like the rest

- [ ] **Step 1: Write the failing test** (`tests/itemsOnEveryLayout.test.tsx`): for each of the 21 layouts' first template, render it inside `CanvasEditProvider` (spy `openItem`) with `createSampleInvoice`: the container has `[data-item="field:invoiceNumber"]`, `label:issueDate`, `label:dueDate`, `label:subtotal`, `label:total`; clicking each calls `openItem` with the matching target; every `[data-item]` span is `role="button"` and no `<button>` is added; wrapped in `LabelsProvider value={{ issueDate: 'ZZ-issue', total: 'ZZ-total' }}` each layout's text contains `ZZ-issue` and `ZZ-total` and never the old word in that spot; with no providers each layout's `textContent` equals its text from a render of the same file at HEAD (snapshot taken before the edit in Step 2, stored under `tests/__fixtures__/layout-text.json`); with `labels` set for every key, all 21 render without throwing. Layouts with no title word are listed in an `NO_TITLE` constant in the test, with the reason.
- [ ] **Step 2: Before editing any template**, run a throwaway script (scratchpad) that renders all 21 with no providers and writes `tests/__fixtures__/layout-text.json` (layout id → `textContent`). Then run `npx vitest run tests/itemsOnEveryLayout.test.tsx` — Expected: FAIL (no `data-item` spans yet).
- [ ] **Step 3: Edit the 21 layouts** by the rules above (one-off wiring script in the scratchpad plus manual fixes for the odd ones: Boarding Pass `Field`, Postcard, Minimal Mono's `issued:`/`due:`, Sidebar Accent and Two-Tone Split From lines, Consultant Clean's joined address line).
- [ ] **Step 4: Run** `npx vitest run` and `npx tsc -b --noEmit` — Expected: all green, including every earlier test file.

### Task 5: Docs, gates, and a real-browser check

**Files:**
- Modify: `docs/ARCHITECTURE.md`, `README.md`, `CONTRIBUTING.md`, `docs/ADDING_A_TEMPLATE.md`

- [ ] **Step 1: Docs.** ARCHITECTURE: primitives list gains `ItemText`, `Label`, `FieldText`, `PartyLine`; a short "Click an item, edit it on the left" section (the `openItem` flow, `invoice.labels` + fallback rule, why no persistent open-tint). README: one bullet. CONTRIBUTING: pointer. ADDING_A_TEMPLATE: skeleton uses `<Label id=…>` for every label and `FieldText` for the number; guideline "never hardcode a label word".
- [ ] **Step 2: Run the four gates** (see Global Constraints) — Expected: tsc clean, all tests pass, lint only the `button.tsx` warning, build OK.
- [ ] **Step 3: Browser check** (`preview_start`): on Classic and Sidebar Accent, click the invoice number, a label, the notes text, a From line; each opens the left drawer with only that item; type a new label wording and see it on the page; drag a label's section and confirm the drawer does not open; add an Image element and click it; switch design and confirm the wording stays; undo reverts it. Report anything not verified (hidden Browser pane limits as before).
