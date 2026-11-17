# Click-to-pick Dates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking the Issue or Due date printed on the invoice opens a modern calendar card; picking a day sets the date.

**Architecture:** A pure date-helper layer (`src/lib/date.ts`), a presentational `DatePickerCard`, and an `EditableDate` primitive (Radix popover; editable only when `useCanvasEdit()` is non-null, plain text otherwise) replace the 21 `formatDate(invoice.issueDate|dueDate)` expressions. Same opt-in-context pattern as `Logo`/`PartyBlock`.

**Tech Stack:** React 19, TypeScript, Tailwind v4, Radix popover (`@/components/ui/popover`), lucide-react, vitest + jsdom.

**Spec:** `docs/superpowers/specs/2026-11-15-date-picker-design.md`

Not a git repo: there are no commit steps. Each task ends with its verification command.

## Global Constraints

- No new dependency (no date or calendar library).
- `issueDate` / `dueDate` stay ISO `YYYY-MM-DD` strings; `formatDate` output is unchanged (`'Nov 15, 2026'`, `'—'` for empty).
- Due date is unrestricted (may be before the issue date). Week starts on Sunday.
- Design-picker thumbnails and exports render exactly the plain text they do today: no Popover tree, no `role`, no extra DOM (`useCanvasEdit()` null).
- At rest a date must not move or change look; the editable span adds no layout (`-mx-0.5 px-0.5` cancel out).
- The editable date is a `<span role="button">`, **not** a `<button>`: `useSectionDrag` (`useSectionDrag.ts:132`) skips drag only for `button` / `[data-no-section-drag]`, so a span keeps "drag the section by grabbing the date" while a click without movement opens the picker.
- `tsconfig` has `noUnusedLocals`: remove the `formatDate` import from each template once unused.
- Test conventions: `createRoot` + `act` with `IS_REACT_ACT_ENVIRONMENT = true`; Radix popover in jsdom needs a stubbed `ResizeObserver` (`class { observe(){} unobserve(){} disconnect(){} }`).

## Review Focus

1. Empty or invalid stored date (`''`, `'garbage'`, `'2026-02-30'`): trigger shows `—` and still opens; card opens on the current month; nothing throws. (Tasks 2, 3)
2. Month-end navigation: Jan 31 → next month is Feb 28/29, never March. (Task 1)
3. Leap February and year rollover (Dec → Jan, Jan → Dec). (Tasks 1, 2)
4. Timezone: "today" and parsing use local date parts, never `new Date('YYYY-MM-DD')` (UTC). The user's zone is UTC+6, where `toISOString()` is a day behind after midnight; the store's own `todayIso` has that bug and is fixed in Task 1. (Task 1)
5. A pointer press inside the portaled card must not reach the invoice's `onPointerDown` (React events bubble through portals; it would clear the section outline or start a drag). (Tasks 2, 3)

---

### Task 1: Date helpers

**Files:**
- Modify: `src/lib/date.ts` (keep `formatDate` as is)
- Modify: `src/store/invoiceStore.ts:35-39` (`todayIso` → `return addDays(todayLocalIso(), offsetDays)`; import from `../lib/date`)
- Test: `tests/dates.test.ts`

**Interfaces:**
- Produces (all in `src/lib/date.ts`, no React/DOM):
  - `interface DateParts { year: number; month: number; day: number }` (month 1–12)
  - `interface CalendarDay { iso: string; day: number; inMonth: boolean }`
  - `parseIsoDate(iso: string): DateParts | null` (null for `''`, junk, non-padded, or non-existent dates like `2026-02-30`)
  - `toIsoDate(parts: DateParts): string`
  - `todayLocalIso(): string` (local `getFullYear/Month/Date`)
  - `monthGrid(year: number, month: number): CalendarDay[]` (always 42 cells, Sunday first, leading/trailing days `inMonth: false`)
  - `addDays(iso: string, days: number): string`
  - `addMonths(iso: string, months: number): string` (clamps the day to the target month's length)
  - `formatMonthYear(year: number, month: number): string` → `'November 2026'`
  - `formatLongDate(iso: string): string` → `'Sunday, November 15, 2026'` (en-US; for aria-labels)

- [ ] **Step 1: Write the failing tests in `tests/dates.test.ts`**
  - `parseIsoDate('2026-11-15')` equals `{ year: 2026, month: 11, day: 15 }`; `''`, `'garbage'`, `'2026-02-30'`, `'2026-13-01'`, `'2026-1-5'` → `null`.
  - `toIsoDate({ year: 2026, month: 3, day: 5 })` → `'2026-03-05'`.
  - `monthGrid(2026, 11)`: length 42; `[0]` is `{ iso: '2026-11-01', inMonth: true }`; `[29].iso === '2026-11-30'`; `[30]` is `{ iso: '2026-12-01', inMonth: false }`; `[41].iso === '2026-12-12'`.
  - `monthGrid(2026, 12)`: `[0]` is `{ iso: '2026-11-29', inMonth: false }`, `[2]` is `{ iso: '2026-12-01', inMonth: true }`.
  - Leap: `monthGrid(2028, 2).filter(d => d.inMonth)` has 29 cells ending `'2028-02-29'`; for `(2027, 2)` it has 28.
  - `addMonths('2026-01-31', 1)` → `'2026-02-28'`; `('2028-01-31', 1)` → `'2028-02-29'`; `('2026-12-15', 1)` → `'2027-01-15'`; `('2026-01-15', -1)` → `'2025-12-15'`.
  - `addDays('2026-12-31', 1)` → `'2027-01-01'`; `('2026-03-01', -1)` → `'2026-02-28'`.
  - `todayLocalIso()` with `vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 15, 0, 30))` → `'2026-11-15'` (restore real timers in `afterEach`).
  - `formatMonthYear(2026, 11)` → `'November 2026'`; `formatLongDate('2026-11-15')` → `'Sunday, November 15, 2026'`; `formatDate('2026-11-15')` → `'Nov 15, 2026'`; `formatDate('')` → `'—'`.
- [ ] **Step 2: Run to verify failure** — `npx vitest run tests/dates.test.ts` → FAIL (helpers not exported).
- [ ] **Step 3: Implement the helpers in `src/lib/date.ts`.** Do all arithmetic with `Date.UTC(...)` + `getUTC*` (no DST drift, no string-to-`Date` parsing); validate by round-tripping the parsed parts.
- [ ] **Step 4: Fix the store's `todayIso`** as listed under Files so a new invoice's default dates agree with the picker's "Today".
- [ ] **Step 5: Verify** — `TZ=Asia/Dhaka npx vitest run tests/dates.test.ts` and `TZ=America/Los_Angeles npx vitest run tests/dates.test.ts` → PASS both; then `npx vitest run` → all existing tests still pass.

---

### Task 2: `DatePickerCard`

**Files:**
- Create: `src/lib/contrast.ts` — `onAccentColor(hex: string): '#ffffff' | '#0f172a'` (dark text on light accents, by relative luminance; non-hex input → `'#ffffff'`)
- Create: `src/templates/shared/primitives/DatePickerCard.tsx`
- Test: `tests/datePicker.test.tsx`

**Interfaces:**
- Consumes: Task 1 helpers.
- Produces: `DatePickerCard({ value, accent, onPick }: { value: string; accent?: string; onPick: (iso: string) => void }): ReactElement`. `value` may be empty/invalid (calendar shows the current month, nothing selected). `accent` defaults to `'var(--color-brand)'`. It owns no popover; `EditableDate` (Task 3) hosts it.

Behavior to build:
- Header: `formatMonthYear` text plus `Previous month` / `Next month` icon buttons (`aria-label`s as written; lucide chevrons). A `Today` text button.
- Weekday row (S M T W T F S) and a 42-cell grid of day buttons from `monthGrid`. Each day button: `aria-label={formatLongDate(iso)}`; selected → `aria-pressed="true"` and inline `background: accent; color: onAccentColor(accent)`; today → `aria-current="date"` plus a ring; out-of-month days dimmed but clickable (picking one jumps there).
- Click a day → `onPick(iso)` once. `Today` → `onPick(todayLocalIso())`.
- Roving focus: the focused day (initially the selected day, else today) has `tabIndex=0`, others `-1`. ArrowLeft/Right ±1 day, ArrowUp/Down ±7, PageUp/PageDown ±1 month (`addMonths`); the visible month follows the focused day and focus moves to its button.
- The card's root `div` calls `stopPropagation` on `onPointerDown` (Review Focus 5).
- Look (builder's call within): `w-72 rounded-2xl bg-white p-4`, `size-9 rounded-full` day cells, soft hover tint, selected day filled with the accent, tabular numerals. Match `DetailsPopover`'s card (`rounded-2xl shadow-xl`). `aria-pressed` is used rather than the spec's `aria-selected`, which is not valid on a button (builder call).

- [ ] **Step 1: Write the failing tests in `tests/datePicker.test.tsx`** (mount with `createRoot`; fake time `new Date(2026, 10, 15)`):
  - `onAccentColor('#facc15')` → `'#0f172a'`; `onAccentColor('#1e3a8a')` → `'#ffffff'`; `onAccentColor('not a color')` → `'#ffffff'`.
  - `value="2026-11-15"`: header text `November 2026`; button named `Sunday, November 15, 2026` has `aria-pressed="true"` and is the only pressed one; it has `aria-current="date"` (fake today); its inline background equals the `accent` prop.
  - `value=""` and `value="garbage"` render without throwing, header `November 2026`, no pressed day.
  - `Next month` → `December 2026`; `Previous month` twice from there → `October 2026`; from `value="2026-01-10"`, `Previous month` → `December 2025`.
  - Click `Wednesday, November 18, 2026` → `onPick` called once with `'2026-11-18'`. After `Next month`, click the leading day `Sunday, November 29, 2026` → `'2026-11-29'`.
  - `Today` → `onPick('2026-11-15')`.
  - Keyboard on the focused selected day: ArrowRight focuses `Monday, November 16, 2026`; ArrowDown then focuses `Monday, November 23, 2026`; PageDown focuses `Wednesday, December 23, 2026` and the header becomes `December 2026`; with focus on Dec 1, ArrowLeft focuses `Monday, November 30, 2026` and the header becomes `November 2026`.
  - A `pointerdown` dispatched on a day button (bubbling) does not call a wrapping parent's `onPointerDown` spy.
- [ ] **Step 2: Run** — `npx vitest run tests/datePicker.test.tsx` → FAIL.
- [ ] **Step 3: Implement `onAccentColor` and `DatePickerCard`** per the behavior above. Keep the "focused day" as component state; derive the visible year/month from it.
- [ ] **Step 4: Verify** — `npx vitest run tests/datePicker.test.tsx` → PASS; `npx tsc -b --noEmit` clean.

---

### Task 3: `EditableDate` primitive and edit-context accent

**Files:**
- Modify: `src/templates/shared/CanvasEditContext.ts` — add `accentColor?: string` to `CanvasEditContextValue` (doc: the invoice's accent, for chrome portaled out of the page; falls back to the editor's brand color)
- Modify: `src/features/invoice-editor/EditorLayout.tsx:128-140` — add `accentColor: invoice.theme.accentColor` to the provider value
- Create: `src/templates/shared/primitives/EditableDate.tsx`; export it from `primitives/index.ts`
- Test: `tests/editableDate.test.tsx`

**Interfaces:**
- Consumes: `useCanvasEdit()`, `formatDate`, `DatePickerCard`, `Popover`/`PopoverTrigger`/`PopoverContent` from `@/components/ui/popover`.
- Produces: `EditableDate({ value, field }: { value: string; field: 'issueDate' | 'dueDate' }): ReactElement`.

Behavior to build:
- `useCanvasEdit()` null → return `<>{formatDate(value)}</>` (no wrapper, no Popover). Otherwise render an inner component holding `open` state: `<Popover open onOpenChange>` + `<PopoverTrigger asChild>` on `<span role="button" tabIndex={0} data-editable-date={field} aria-haspopup="dialog" aria-label="Change issue date" | "Change due date">` showing `formatDate(value)`.
- Enter and Space on the span open the card (`preventDefault`); other keys do nothing.
- `PopoverContent` (`side="bottom" align="start" sideOffset={8}`, no padding/border of its own — the card supplies the look) hosts `<DatePickerCard value accent={edit.accentColor} onPick={(iso) => { edit.updateField(field, iso); setOpen(false) }} />`.
- Affordance classes on the span (invisible at rest): `cursor-pointer rounded-sm -mx-0.5 px-0.5 outline-none transition-colors hover:bg-current/10 focus-visible:bg-current/10 focus-visible:ring-2 focus-visible:ring-current/40 data-[state=open]:bg-current/10`. `bg-current/10` follows the text color, so it reads on dark designs too.

- [ ] **Step 1: Write the failing tests in `tests/editableDate.test.tsx`** (stub `ResizeObserver`; fake `updateField` via `vi.fn()` in a `CanvasEditProvider`; `value="2026-11-15"`):
  - No provider (`renderToStaticMarkup`): output is exactly `Nov 15, 2026`; no `role=`, no `data-editable-date`.
  - With provider: one element `[data-editable-date="issueDate"]` whose `tagName` is `SPAN` (not `BUTTON`), `role="button"`, `tabindex="0"`, text `Nov 15, 2026`, `aria-label="Change issue date"`; with `field="dueDate"` the label is `Change due date`.
  - Click → a `[role="dialog"]` appears in `document.body` containing `November 2026`; clicking `Wednesday, November 18, 2026` → `updateField` called once with `('issueDate', '2026-11-18')` and the dialog is gone.
  - Enter and Space each open it; `a` does not.
  - Escape closes it and `document.activeElement` is the span again.
  - `value=""` shows `—`, still opens, no throw; `value="garbage"` shows `garbage`, still opens.
  - A `pointerdown` inside the open card does not reach an ancestor `onPointerDown` spy.
  - `accentColor: '#facc15'` in the context → the selected day's inline background is `#facc15` (rgb-equivalent in jsdom).
- [ ] **Step 2: Run** — `npx vitest run tests/editableDate.test.tsx` → FAIL.
- [ ] **Step 3: Implement** the context field, the `EditorLayout` value, and `EditableDate` as described. Split into an outer component (reads context, returns text or the inner) and an inner stateful component so hooks are not conditional.
- [ ] **Step 4: Verify** — `npx vitest run tests/editableDate.test.tsx` → PASS; `npx tsc -b --noEmit` clean.

---

### Task 4: Wire all 21 sites

**Files (Modify):** `src/templates/{01-classic/ClassicTemplate,02-modern-minimal/ModernMinimalTemplate,03-bold-gradient/BoldGradientTemplate,04-corporate-blue/CorporateBlueTemplate,05-creative-agency/CreativeAgencyTemplate,06-dark-mode/DarkModeTemplate,07-elegant-serif/ElegantSerifTemplate,08-startup-tech/StartupTechTemplate,09-minimal-mono/MinimalMonoTemplate,10-consultant-clean/ConsultantCleanTemplate,11-ledger/LedgerTemplate,12-boarding-pass/BoardingPassTemplate,13-editorial/EditorialTemplate,14-watermark/WatermarkTemplate,15-sidebar-accent/SidebarAccentTemplate,16-postcard/PostcardTemplate,17-timeline/TimelineTemplate,18-two-tone-split/TwoToneSplitTemplate,19-stamp-seal/StampSealTemplate,20-blueprint/BlueprintTemplate}.tsx` and `src/templates/21-freeform/blocks/FreeformMetaBlock.tsx` (also delete its "deliberately read-only" doc comment).
**Test:** `tests/datesOnEveryLayout.test.tsx`

**Interfaces:** Consumes `EditableDate` (Task 3).

Pattern: replace each `{formatDate(invoice.issueDate)}` with `<EditableDate value={invoice.issueDate} field="issueDate" />` and likewise `dueDate`; keep the surrounding element and classes; add `EditableDate` to the `../shared/primitives` import (`FreeformMetaBlock` uses `../../shared/primitives`); drop the unused `formatDate` import. Boarding Pass: widen its local `Field` prop to `value: ReactNode`.

- [ ] **Step 1: Capture a layout baseline in the browser** (dev server running via `preview_start invoice-generator`). For the first design of each of the 21 layouts, set `templateId` in the persisted invoice in `localStorage`, reload, and record, via `javascript_tool`, the bounding rect of every text node whose text matches that invoice's `formatDate` output for issue and due dates (use a `Range` per text node). Save the JSON to `/private/tmp/claude-501/-Users-rhshoumik-invoice-generator/9cbe6319-c883-4fd8-951b-d351302e258e/scratchpad/date-rects-before.json`.
- [ ] **Step 2: Write the failing test `tests/datesOnEveryLayout.test.tsx`.** For the first template of each layout in `TEMPLATES` (21, Freeform included; render `FreeformMetaBlock` directly if `FreeformTemplate` needs a block context), render with `CanvasEditProvider` (stub context, `as never`, as in `tests/movableSections.test.tsx`) via `renderToStaticMarkup`: exactly two `[data-editable-date]` elements, `issueDate` then `dueDate` (in some order), each with text `formatDate(invoice.<field>)`. Rendered with no provider: zero `[data-editable-date]`, and the HTML still contains both formatted dates.
- [ ] **Step 3: Run** — `npx vitest run tests/datesOnEveryLayout.test.tsx` → FAIL.
- [ ] **Step 4: Make the 21 edits** per the pattern.
- [ ] **Step 5: Verify** — `npx vitest run tests/datesOnEveryLayout.test.tsx` → PASS; `grep -rnE "formatDate\(invoice\.(issue|due)Date\)" src/templates` → no output; `npx tsc -b --noEmit` clean; full `npx vitest run` passes.
- [ ] **Step 6: Re-capture the same date rects** after the edits (same method) and compare with `date-rects-before.json`: every rect within 0.5px for all 21 layouts (nothing moved at rest).

---

### Task 5: Docs and end-to-end verification

**Files:** Modify `docs/ARCHITECTURE.md` (primitives list near line 90; context list near line 221; the "What's not covered yet" paragraph near line 167 — dates are now click-to-edit; say why `EditableDate` is a span, and why the portaled card may use shadcn's popover), `README.md` (feature list), `CONTRIBUTING.md` and `docs/ADDING_A_TEMPLATE.md` (new layouts render dates through `EditableDate`, not `formatDate`).

- [ ] **Step 1: Update the docs** as listed (grep each file for `formatDate`, `InlineField` and the primitives list to find the right spots).
- [ ] **Step 2: Browser sweep** (`javascript_tool` + a few real clicks): for each of the 21 layouts, `document.elementFromPoint` at the center of the issue-date span returns that span (no watermark/stamp layer covers it); clicking it opens `[role="dialog"]`; picking a day updates the printed date; undo (`Cmd/Ctrl+Z`) restores it. In Classic, drag the dates box (`meta`) by pressing on the date text and moving 30px: the section moves and no picker opens; a plain click opens it.
- [ ] **Step 3: Screenshots** of the open card on Classic (light) and Dark Mode (check readable text, selected day, hover tint), and on a narrow viewport (`resize_window` mobile) to confirm the card stays on screen.
- [ ] **Step 4: Export check** — export PNG with the card open and with a date hovered: the image contains the plain dates only (no card, no tint). Confirm the design-picker thumbnails show no hover/pointer behavior on dates.
- [ ] **Step 5: Full gate** — `npx tsc -b --noEmit`, `npx vitest run`, `npm run lint` (only the pre-existing `button.tsx` warning), `npm run build` (pre-existing chunk-size warning only); all clean.
