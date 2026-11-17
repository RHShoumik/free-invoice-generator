# Click-to-pick dates on the invoice — design

Status: approved by the user (2026-11-15).

## Intent and why

Clicking the Issue or Due date printed on the invoice should open a date
picker, and the picker should look modern. Today the dates are plain text on
the page and can only be changed in the dock's **Details** popover, which uses
the browser's native date box. Editing in place is the same direction as the
rest of the editor (click a name, a line item, the logo and change it where it
sits).

## Goals

- Clicking the issue date or due date in the live editor opens an anchored
  calendar card; picking a day sets the date and closes the card.
- Works on all 21 layouts (the 20 fixed designs and Freeform Canvas), in the
  same place the date already is, looking the same until it is hovered.
- A modern card that suits the editor's existing look (not a copy of any other
  product's picker).

## Non-goals

- No date library or calendar dependency.
- No change to how dates are stored (`issueDate` / `dueDate` stay ISO
  `YYYY-MM-DD` strings) or formatted (`formatDate`).
- No restriction on the due date (it may be before the issue date).
- The Details popover keeps its current date boxes in this change (switching
  them to the same card is an easy follow-up).

## Anti-goals (a failure even if it "works")

- The date picker or any hover/affordance styling showing up in a downloaded
  PNG, PDF or Word file.
- Clicking a date in a design-picker thumbnail editing the invoice the user is
  working on.
- A date in any design shifting position or changing its look at rest.

## Constraints

- The date sits inside hand-tuned layouts and inside draggable sections
  (`Movable`); the replacement must render the same inline element with the
  same inherited font, color and size, and a click that is not a drag must open
  the picker.
- The primitives shared by all designs follow the opt-in context pattern:
  editable only when `useCanvasEdit()` is non-null (`CanvasEditContext`),
  read-only plain text otherwise (thumbnails, exports).
- The card is portaled outside the invoice page node, so image/PDF export
  never sees it.

## Approaches considered

1. **Native `<input type="date">` opened with `showPicker()`.** Least code, but
   the popup is the browser's own: it can't be styled, differs per browser, and
   can't meet "modern design". Rejected.
2. **A calendar library (e.g. react-day-picker).** Less calendar code, but a new
   dependency that would need heavy restyling to look modern, for a single month
   grid. Rejected.
3. **Hand-built month-grid card in a Radix popover (chosen).** Radix popover is
   already used throughout; the calendar is ~150 lines, fully styleable,
   testable in jsdom, and identical in every browser.

## Design

- **`src/lib/date.ts`** gains pure helpers (no React/DOM): parse an ISO date
  safely (invalid → fall back to today for display of the calendar only),
  `toIsoDate`, build the 6-week grid for a month (weekday-aligned, with
  leading/trailing days from adjacent months), add/subtract months and days.
  `formatDate` is unchanged.
- **`EditableDate` primitive** in `src/templates/shared/primitives/`, exported
  from `index.ts`. Props: `value` (ISO), `field: 'issueDate' | 'dueDate'`,
  `className?`, `style?`. Renders the `formatDate` text in an inline element
  that inherits everything. With `useCanvasEdit()` null it is exactly that
  text. With editing on it is a keyboard-focusable `role="button"` with a
  subtle hover/focus highlight (an underline/tint that is not drawn in
  exports), and opens the picker on click / Enter / Space.
- **`DatePickerCard`** (the popover content): month + year header with previous
  and next buttons; weekday row; day grid; today has a ring; the selected day
  is filled with the invoice accent color; a "Today" shortcut; clicking a day
  calls `edit.updateField(field, iso)` and closes; Esc and outside click close
  (Radix defaults); arrow keys move the focused day, PageUp/PageDown change
  month, Enter picks. Day buttons have accessible names (full date) and
  `aria-selected`/`aria-current="date"`.
- **Wiring:** replace the `{formatDate(invoice.issueDate)}` and
  `{formatDate(invoice.dueDate)}` expressions with `<EditableDate …/>` in all 20
  fixed designs and `FreeformMetaBlock`; remove the "deliberately read-only"
  comment there. Dates that sit inside `Movable` sections open on a click that
  does not move; a drag still drags.
- **Docs:** note the primitive in `docs/ARCHITECTURE.md` / `README.md` /
  `CONTRIBUTING.md` where primitives and inline editing are described.

## Verification

- Unit tests for the date helpers (month grid across month/year boundaries,
  leap February, week start, invalid input).
- Component tests: opens on click and keyboard, picks a day (store updated,
  card closes), is plain text with no context, no `role="button"` in read-only.
- Browser check on several designs including Freeform, a design with the date
  inside a draggable section, dark mode design (contrast of the hover
  highlight), and a PNG export to confirm no picker or highlight appears.
- `tsc`, full `vitest`, lint and build stay clean.

## Left to the builder

- Exact card visuals (spacing, radius, shadow, motion) within "modern, matches
  the editor's cards and popovers".
- The hover/focus affordance on the date, per design, as long as it is
  invisible at rest and in exports and readable on dark designs.
- Where the shared card component lives within `features/invoice-editor/` vs
  the primitives folder, provided the invoice-page primitive stays free of
  shadcn (see "Why shadcn is a separate concern" in `docs/ARCHITECTURE.md`)
  and the portaled card may use it.
