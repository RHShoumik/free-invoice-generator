# Contributing

Thanks for considering a contribution. This is a small, client-only React app — there's no backend to run, no environment variables, and no database, so getting set up should take a couple of minutes.

## Setup

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Before opening a PR:

```bash
npx tsc -b --noEmit   # type-check
npx vitest run        # unit tests
npm run lint           # lint
npm run build          # confirm a clean production build
```

## Where things live

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full picture. The short version:

- **A new invoice design** → [docs/ADDING_A_TEMPLATE.md](docs/ADDING_A_TEMPLATE.md) — this is the most contributor-friendly surface in the codebase, by design.
- **A new toolbar control or editor behavior** → `src/features/invoice-editor/toolbar/` (settings with no visual home on the invoice), `src/templates/shared/CanvasEditContext.ts` (click-to-edit fields on the invoice itself; the click-to-pick dates are `EditableDate` + `DatePickerCard`, and the click-to-reword labels, invoice number and footer text are `Label` / `FieldText` / `PartyLine`, edited in place, in `src/templates/shared/primitives/`; a picture opens `ItemDrawer` in `src/features/invoice-editor/`), or `src/features/invoice-editor/` (`ElementsDrawer`, `UploadsDrawer`, `BusinessDrawer`, `DrawLayer`, `useSectionDrag`, `FreeLayer` — the canvas behavior every design gets), wired to `src/store/invoiceStore.ts`.
- **A new store action** → add it to `src/store/invoiceStore.ts` and call the store's `set` wrapper (not the raw one) so the edit is undoable automatically; if it's a change that should merge with its neighbors when repeated quickly, give it a distinct field path in `changeSignature` (`src/store/history.ts`).
- **Export logic (image/PDF)** → `src/features/export/`.
- **What the site says to search engines and visitors** (title, description, keywords, headline, FAQ, the "Developed by" credit) → `src/lib/site.ts`; the tags, `robots.txt` and `sitemap.xml` built from it are `src/lib/seo.ts` and the `seo` plugin in `vite.config.ts`.
- **The `Invoice` data shape** → `src/types/invoice.ts`. Changing this touches every template and both exporters, so treat it as the one genuinely cross-cutting file in the project.

## Guidelines

- Keep templates pure functions of their `invoice` prop — no local state or effects (see [docs/ADDING_A_TEMPLATE.md](docs/ADDING_A_TEMPLATE.md) for why).
- Don't hardcode a user-configurable color (accent color) as a Tailwind class — it has to go through the `style` prop, since Tailwind can't compile a class name it only learns about at runtime.
- Prefer reusing the shared primitives (`src/templates/shared/primitives/`) over duplicating line-item/totals rendering logic in a new template.
- Add a unit test in `tests/` for anything that touches invoice math (`src/lib/calculations.ts`) — that file is the one place correctness really matters.
- No backend, ever, is a deliberate project constraint, not an oversight — please don't propose adding one (e.g. for cloud sync or sharing links) without opening an issue to discuss first.

## Reporting bugs / proposing features

Open a GitHub issue. For a bug, include your browser, the template you were using, and (if export-related) which format failed. For a feature, a short description of the use case is more useful than a full design up front — happy to help shape it in the issue.
