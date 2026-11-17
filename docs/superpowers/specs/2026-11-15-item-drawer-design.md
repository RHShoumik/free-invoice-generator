# Click an item, edit it in the left drawer — design

Date: 2026-11-15 · Status: approved by the user in chat ("just open the left bar with the clicked data, if it text then
I can edit the text, if it image then I can edit the image").

## Revision, 2026-11-15 (later the same day): text is edited in place

The user then said: "no make the text edit in inline canvas not in the drawer". So the rule is now:

- **Text** (the invoice number, every label, the notes / payment terms / bank details text, a layout's own From lines)
  is edited **in place on the page**: a click turns that same span into a text box, with the cursor where the click
  landed. Enter or clicking away finishes; Escape puts it back. No drawer opens for text.
- **Pictures** still open the left drawer: an added Image element, the Watermark design's picture, and (as before) the
  logo, which opens the Business drawer.

Consequences, all in the code: the drawer's text panels (and the label **Reset to default wording** button) are gone —
undo, or Escape while typing, is the way back to a design's own words; the watermark panel is just its picture (its
text was already an on-page `InlineText`); `openItem` left the editing context for `editText(target, text)`. Everything
below is the original design; read "drawer" for text as "in place".

## Intent

Today only the business name opens the left drawer. Everything else that is text on the invoice is either typed in place
(party blocks, line items, column headers, Freeform fields), or cannot be edited at all: the invoice number (only in the
Details popover, 20 of 21 layouts), every label ("Invoice", "Issue Date", "Due Date", "Bill To", "Subtotal", "Total",
"Payment Terms"…), the notes / payment terms / bank details text (no editor on the 20 fixed layouts), and the address,
phone and tax-ID lines in a layout's own colored strip (Sidebar Accent, Two-Tone Split).

The user wants one rule: **click a thing on the invoice and the left drawer opens with just that thing — text → edit the
text, image → edit the image.**

## Goals

- Click any of these and the left drawer opens with only that item:
  - the invoice number; the "Invoice" title; every label; the notes, payment terms and bank details text; a layout's
    own From lines (address / email / phone / tax ID);
  - an image: the logo (→ the existing Business drawer, which already edits it), an Image element added to the page,
    the Watermark design's image (and its text).
- Label wording is stored with the invoice (`invoice.labels`), so it survives a design switch. Each layout's own wording
  stays the fallback, so nothing changes at rest.
- Undo/redo covers it; typing in the drawer is one undo step per pause.
- Exports (PNG/PDF from the live page, and Word) show the user's wording.
- All 21 layouts. Design-picker thumbnails and exports stay plain (no tint, no click).

## Non-goals / anti-goals

- No giant form: the drawer never lists everything, only the clicked item.
- Not changing what already works: dates keep the calendar popover (clicking a date's *label* opens the drawer);
  party names / line items / column headers stay typed in place; added Text boxes stay rich-text in place.
- Not adding an "empty" way to bring back a hidden-because-empty notes / terms / bank line (the footer paragraph still
  disappears while empty, as it always has).
- No backend, no new dependency.

## Constraints

- Opt-in-via-context pattern (`CanvasEditContext`): outside the live editor every new primitive renders plain text.
- `useSectionDrag` leaves presses on `button` / `[data-no-section-drag]` alone and swallows the click that ends a drag,
  so a clickable text is a `<span role="button" tabIndex=0>` — pressing and dragging it still moves its section.
- No layout may shift at rest: the click target is an inline span with `-mx-0.5 px-0.5`, tinted only on hover/focus/active.
- `EditorLayout.tsx` and `BusinessDrawer.tsx` are also being edited by a parallel session: targeted edits only.

## Approaches

1. **Type in place** (contenteditable labels). Simple, but the user asked for the drawer. Rejected.
2. **One drawer driven by `openItem(target)` from the context** (chosen). Each clickable text knows its `ItemTarget`;
   the editor owns which panel is open; the drawer renders one field (or the image controls) for the target. Matches
   how the business name already works.
3. **One big "Invoice text" form in the drawer.** The user said "only open that item I clicked". Rejected.

## Design

- `ItemTarget` (shared type): `label{key, fallback}` · `field{invoiceNumber|notes|paymentTerms|bankDetails}` ·
  `party{which, field}` · `image{elementId}` · `watermark`.
- Data: `Invoice.labels?: Partial<Record<LabelKey, string>>` (optional → no migration). Keys: `title`, `invoiceNumber`,
  `issueDate`, `dueDate`, `from`, `billTo`, `subtotal`, `discount`, `tax`, `total`, `paymentTerms`, `bankDetails`,
  `signatureBusiness`, `signatureClient`. `setLabel(key, text | undefined)` is undoable; `undefined` = back to the layout's
  own wording; an empty string is allowed (the user can hide a label) and exports nothing.
- Primitives (`templates/shared/primitives`): `ItemText` (clickable wrapper, plain without context), `Label`
  (`<Label id="issueDate">Issue Date</Label>` — children are the layout's own wording).
  `PartyBlock` and `Totals` use `Label` for their headings; `Signature` for its two captions.
- Context: `CanvasEditContext` gains `openItem(target)`; a new `LabelsContext` (provided by `InvoicePreview`) carries
  `invoice.labels` to the primitives. A `label` target carries the layout's own wording (`fallback`), because only the
  clicked text knows it and the drawer must show what is printed. There is deliberately no persistent "this item is open"
  tint on the page: it would be baked into a PNG/PDF exported while the drawer is open.
- Editor: `LeftPanel` gains `'item'`; `ItemDrawer` (same shell as `BusinessDrawer`) shows the title, one field
  (input; textarea for notes/terms/bank), "Reset to default wording" for a label with an override, and ✕. The image
  variant shows the preview with Replace / Remove. `handleSelect` opens the Business drawer for the logo, and the item
  drawer for an Image element / the watermark.
- Word export resolves the same labels (`lib/labels.ts#resolveLabel`).

## What's left to the builder

Which exact words each of the 21 layouts maps to which key (fallback = whatever the layout prints today); the small
visual design of the drawer (copy `BusinessDrawer`'s shell); test layout.
