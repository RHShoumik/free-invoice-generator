import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { addDays, todayLocalIso } from '../lib/date'
import { DEFAULT_STROKE_WIDTH } from '../lib/drawing'
import { createId } from '../lib/id'
import { stripRunFormatting } from '../lib/richText'
import type { RunProp } from '../lib/richText'
import { recordEdit } from './history'
import type { LastEdit } from './history'
import { getTemplate } from '../templates/registry'
import type {
  Drawing,
  FontId,
  FreeformElement,
  FreeformElementRect,
  FreeformElementStyle,
  FreeformFreeContent,
  FreeformFreeKind,
  FreeformLayout,
  Invoice,
  LabelKey,
  LineItem,
  LineItemColumns,
  PagePadding,
  Party,
  SectionOffset,
  SectionVisibility,
} from '../types/invoice'
import {
  defaultFreeformLayout,
  defaultLineItemColumns,
  defaultSectionVisibility,
  emptyParty,
  isFreeformFreeKind,
} from '../types/invoice'

function todayIso(offsetDays = 0): string {
  return addDays(todayLocalIso(), offsetDays)
}

function blankLineItem(): LineItem {
  return { id: createId('item'), description: '', quantity: 1, unitPrice: 0, customValues: {} }
}

export function createBlankInvoice(templateId: string): Invoice {
  const template = getTemplate(templateId)
  return {
    id: createId('inv'),
    templateId,
    theme: {
      accentColor: template.defaultAccentColor,
      font: template.defaultFont,
      padding: template.defaultPadding,
    },
    logoDataUrl: null,
    invoiceNumber: `INV-${new Date().getFullYear()}-001`,
    issueDate: todayIso(),
    dueDate: todayIso(14),
    from: emptyParty(),
    to: emptyParty(),
    items: [blankLineItem()],
    currency: 'USD',
    taxRatePct: 0,
    discountPct: 0,
    notes: '',
    paymentTerms: 'Payment due within 14 days.',
    bankDetails: '',
    sections: defaultSectionVisibility(),
    lineItemColumns: defaultLineItemColumns(),
    customColumns: [],
    freeformLayout: defaultFreeformLayout(),
    sectionOffsets: {},
    sectionStyles: {},
  }
}

export function createSampleInvoice(templateId: string): Invoice {
  const base = createBlankInvoice(templateId)
  return {
    ...base,
    from: {
      name: 'Aster & Co. Studio',
      address: '221B Baker Street, London, NW1 6XE',
      email: 'hello@asterstudio.com',
      phone: '+44 20 7946 0958',
      taxId: 'GB123456789',
    },
    to: {
      name: 'Northwind Traders Ltd.',
      address: '4 Market Square, Manchester, M1 1AA',
      email: 'accounts@northwind.com',
      phone: '+44 161 496 0021',
      taxId: 'GB987654321',
    },
    items: [
      { id: createId('item'), description: 'Brand identity design', quantity: 1, unitPrice: 1200, customValues: {} },
      {
        id: createId('item'),
        description: 'Website UI design (6 pages)',
        quantity: 6,
        unitPrice: 250,
        customValues: {},
      },
      {
        id: createId('item'),
        description: 'Design system documentation',
        quantity: 1,
        unitPrice: 400,
        customValues: {},
      },
    ],
    taxRatePct: 10,
    discountPct: 5,
    notes: 'Thank you for the opportunity — looking forward to working together.',
  }
}

/**
 * Converts persisted `freeformLayout` data of any prior shape into the
 * current `FreeformElement[]`. Exported as a standalone pure function
 * specifically so it's independently unit-testable (see
 * tests/freeformMigration.test.ts) — this is the one place a bug would
 * silently discard a real user's dragged-and-resized Freeform layout, so it
 * gets tested in isolation rather than only exercised incidentally through
 * the store.
 */
export function migrateFreeformLayout(raw: unknown): FreeformLayout {
  if (Array.isArray(raw)) return raw as FreeformLayout
  if (raw && typeof raw === 'object') {
    // Pre-array shape: Record<FreeformBoundKind, {x,y,width}> — convert one
    // entry per key, preserving whatever position the user had dragged it to.
    return Object.entries(raw as Record<string, FreeformElementRect>).map(([kind, rect]) => ({
      id: kind,
      kind,
      ...rect,
    })) as FreeformLayout
  }
  return defaultFreeformLayout()
}

/** Default starter content for a newly palette-added "free" element. */
function defaultFreeElementContent(kind: FreeformFreeKind): FreeformFreeContent {
  switch (kind) {
    case 'text':
      return { text: '' }
    case 'table':
      return {
        rows: [
          ['', ''],
          ['', ''],
        ],
      }
    case 'image':
      return { dataUrl: null }
    case 'divider':
      return {}
    case 'drawing':
      // Drawings come from the draw tools (`addDrawing`), which supply their own shape; this is only a stand-in.
      return { drawing: { tool: 'rectangle', w: 120, h: 80, points: [[4, 4], [116, 76]], strokeWidth: DEFAULT_STROKE_WIDTH, fill: 'none' } }
  }
}

const NEW_ELEMENT_WIDTH = 300
const CANVAS_WIDTH = 794
const GRID = 8

function snapToGrid(v: number): number {
  return Math.round(v / GRID) * GRID
}

/**
 * Where a click-to-add element lands. On Freeform Canvas every default
 * section lives in `layout`, so a new element goes below the lowest one. On
 * the fixed layouts the bound entries in `layout` mean nothing (their real
 * position comes from the design's own flow), so basing it on them would
 * drop the element off the bottom of the page — those instead cascade from
 * just under a typical header, one step per already-added free element.
 */
function nextFreeformPosition(layout: FreeformLayout, isFreeformLayout: boolean): FreeformElementRect {
  if (isFreeformLayout) {
    const maxY = layout.reduce((max, el) => Math.max(max, el.y), 0)
    return { x: 48, y: maxY + 60, width: NEW_ELEMENT_WIDTH }
  }
  // Drawings are placed where they were drawn, so they don't count toward where the next click-added element cascades to.
  const n = layout.filter((el) => isFreeformFreeKind(el.kind) && el.kind !== 'drawing').length
  return { x: 48 + (n % 6) * 24, y: 160 + (n % 8) * 40, width: NEW_ELEMENT_WIDTH }
}

/**
 * Where the cursor was (canvas px) when a card was dropped → a snapped,
 * on-page rect for the new element, centered horizontally on the cursor so
 * it lands under it rather than hanging off to the right.
 */
function rectAt(at: { x: number; y: number }): FreeformElementRect {
  const x = Math.min(Math.max(0, snapToGrid(at.x - NEW_ELEMENT_WIDTH / 2)), CANVAS_WIDTH - NEW_ELEMENT_WIDTH)
  return { x, y: Math.max(0, snapToGrid(at.y - 16)), width: NEW_ELEMENT_WIDTH }
}

/** Section toggles whose visibility a Freeform element is tied to when deleted/re-added. */
const FOOTER_SECTION_FLAGS: (keyof SectionVisibility)[] = ['paymentTerms', 'bankDetails', 'notes']

/** Reconciles `freeformLayout` so it has (or doesn't have) a bound element for each section flag's current state. */
function syncFreeformLayoutWithSections(layout: FreeformLayout, sections: SectionVisibility): FreeformLayout {
  const wants: { kind: 'logo' | 'from' | 'to' | 'footer' | 'signature'; visible: boolean }[] = [
    { kind: 'logo', visible: sections.logo },
    { kind: 'from', visible: sections.from },
    { kind: 'to', visible: sections.to },
    { kind: 'footer', visible: sections.paymentTerms || sections.bankDetails || sections.notes },
    { kind: 'signature', visible: sections.signature },
  ]

  let next = layout
  for (const { kind, visible } of wants) {
    const has = next.some((el) => el.kind === kind)
    if (visible && !has) {
      const fallback = defaultFreeformLayout().find((el) => el.kind === kind)
      if (fallback) next = [...next, { ...fallback, id: createId('el') }]
    } else if (!visible && has) {
      next = next.filter((el) => el.kind !== kind)
    }
  }
  return next
}

interface InvoiceState {
  invoice: Invoice
  /** Undo/redo stacks of whole-invoice snapshots. In-memory only — never persisted (see `partialize`). */
  past: Invoice[]
  future: Invoice[]
  undo: () => void
  redo: () => void
  setTemplate: (templateId: string) => void
  startNewInvoice: (templateId: string, sample?: boolean) => void
  setAccentColor: (color: string) => void
  setFont: (font: FontId) => void
  setPadding: (patch: Partial<PagePadding>) => void
  resetPaddingToDefault: () => void
  setLogo: (dataUrl: string | null) => void
  setSectionVisible: (key: keyof SectionVisibility, visible: boolean) => void
  setColumnLabel: (column: keyof LineItemColumns, label: string) => void
  setColumnVisible: (column: 'quantity' | 'rate', visible: boolean) => void
  addCustomColumn: () => void
  removeCustomColumn: (id: string) => void
  setCustomColumnLabel: (id: string, label: string) => void
  setItemCustomValue: (itemId: string, columnId: string, value: string) => void
  setElementRect: (id: string, patch: Partial<FreeformElementRect>) => void
  addFreeformElement: (kind: FreeformFreeKind, at?: { x: number; y: number }, content?: FreeformFreeContent) => void
  /** Puts a finished drawing on the page at exactly `rect`, in `color`, and returns its id. */
  addDrawing: (rect: FreeformElementRect, drawing: Drawing, color: string) => string
  setSectionOffset: (id: string, offset: SectionOffset | null) => void
  resetSectionOffsets: () => void
  updateSectionStyle: (id: string, patch: Partial<FreeformElementStyle>) => void
  /** Reword a printed label for every layout; `undefined` returns it to the layout's own wording. See `LabelKey`. */
  setLabel: (key: LabelKey, text: string | undefined) => void
  resetWatermark: () => void
  removeFreeformElement: (id: string) => void
  duplicateFreeformElement: (id: string) => void
  updateFreeformElementContent: (id: string, patch: Partial<FreeformFreeContent>) => void
  updateFreeformElementStyle: (id: string, patch: Partial<FreeformElementStyle>) => void
  updateFrom: (patch: Partial<Party>) => void
  updateTo: (patch: Partial<Party>) => void
  updateField: <K extends keyof Invoice>(key: K, value: Invoice[K]) => void
  addItem: () => void
  updateItem: (id: string, patch: Partial<Omit<LineItem, 'id'>>) => void
  removeItem: (id: string) => void
  reorderItems: (fromIndex: number, toIndex: number) => void
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (rawSet) => {
      // What the previous edit was and when, so a run of keystrokes (or "+" clicks)
      // folds into one undo step — see `recordEdit`. Reset whenever the history is
      // reshuffled (undo/redo/new invoice) so the next edit always starts a fresh step.
      let lastEdit: LastEdit | null = null

      /**
       * Every action goes through this instead of the raw `set`: if the action
       * changed `invoice`, the previous invoice is pushed onto the undo stack.
       * Doing it here means a new action can't forget to be undoable.
       */
      const set = (updater: (state: InvoiceState) => Partial<InvoiceState>) =>
        rawSet((state) => {
          const patch = updater(state)
          if (!patch.invoice || patch.invoice === state.invoice) return patch
          const next = recordEdit({ past: state.past, future: state.future }, state.invoice, patch.invoice, lastEdit, Date.now())
          lastEdit = next.last
          return { ...patch, ...next.history }
        })

      return {
        invoice: createSampleInvoice('classic'),
        past: [],
        future: [],

        undo: () =>
          rawSet((state) => {
            const previous = state.past[state.past.length - 1]
            if (!previous) return state
            lastEdit = null
            return { invoice: previous, past: state.past.slice(0, -1), future: [state.invoice, ...state.future] }
          }),

        redo: () =>
          rawSet((state) => {
            const [next, ...rest] = state.future
            if (!next) return state
            lastEdit = null
            return { invoice: next, past: [...state.past, state.invoice], future: rest }
          }),

        setTemplate: (templateId) =>
          set((state) => ({ invoice: { ...state.invoice, templateId } })),

        // A brand-new document: its history starts empty rather than letting undo
        // wander back into the invoice that was just replaced.
        startNewInvoice: (templateId, sample = false) => {
          lastEdit = null
          rawSet(() => ({
            invoice: sample ? createSampleInvoice(templateId) : createBlankInvoice(templateId),
            past: [],
            future: [],
          }))
        },

        setAccentColor: (accentColor) =>
          set((state) => ({ invoice: { ...state.invoice, theme: { ...state.invoice.theme, accentColor } } })),

        setFont: (font) =>
          set((state) => ({ invoice: { ...state.invoice, theme: { ...state.invoice.theme, font } } })),

        setPadding: (patch) =>
          set((state) => ({
            invoice: { ...state.invoice, theme: { ...state.invoice.theme, padding: { ...state.invoice.theme.padding, ...patch } } },
          })),

        resetPaddingToDefault: () =>
          set((state) => ({
            invoice: {
              ...state.invoice,
              theme: { ...state.invoice.theme, padding: getTemplate(state.invoice.templateId).defaultPadding },
            },
          })),

        setLogo: (logoDataUrl) => set((state) => ({ invoice: { ...state.invoice, logoDataUrl } })),

        setSectionVisible: (key, visible) =>
          set((state) => {
            const sections = { ...state.invoice.sections, [key]: visible }
            return {
              invoice: {
                ...state.invoice,
                sections,
                freeformLayout: syncFreeformLayoutWithSections(state.invoice.freeformLayout, sections),
              },
            }
          }),

        setColumnLabel: (column, label) =>
          set((state) => ({
            invoice: {
              ...state.invoice,
              lineItemColumns: {
                ...state.invoice.lineItemColumns,
                [column]: { ...state.invoice.lineItemColumns[column], label },
              },
            },
          })),

        setColumnVisible: (column, visible) =>
          set((state) => ({
            invoice: {
              ...state.invoice,
              lineItemColumns: {
                ...state.invoice.lineItemColumns,
                [column]: { ...state.invoice.lineItemColumns[column], visible },
              },
            },
          })),

        addCustomColumn: () =>
          set((state) => ({
            invoice: {
              ...state.invoice,
              customColumns: [...state.invoice.customColumns, { id: createId('col'), label: '' }],
            },
          })),

        removeCustomColumn: (id) =>
          set((state) => ({
            invoice: {
              ...state.invoice,
              customColumns: state.invoice.customColumns.filter((c) => c.id !== id),
              items: state.invoice.items.map((item) => {
                if (!(id in item.customValues)) return item
                const { [id]: _removed, ...rest } = item.customValues
                return { ...item, customValues: rest }
              }),
            },
          })),

        setCustomColumnLabel: (id, label) =>
          set((state) => ({
            invoice: {
              ...state.invoice,
              customColumns: state.invoice.customColumns.map((c) => (c.id === id ? { ...c, label } : c)),
            },
          })),

        setItemCustomValue: (itemId, columnId, value) =>
          set((state) => ({
            invoice: {
              ...state.invoice,
              items: state.invoice.items.map((item) =>
                item.id === itemId ? { ...item, customValues: { ...item.customValues, [columnId]: value } } : item,
              ),
            },
          })),

        setElementRect: (id, patch) =>
          set((state) => ({
            invoice: {
              ...state.invoice,
              freeformLayout: state.invoice.freeformLayout.map((el) => (el.id === id ? { ...el, ...patch } : el)),
            },
          })),

        addFreeformElement: (kind, at, content) =>
          set((state) => {
            const isFreeformLayout = getTemplate(state.invoice.templateId).layoutId === 'freeform'
            const rect = at ? rectAt(at) : nextFreeformPosition(state.invoice.freeformLayout, isFreeformLayout)
            const element = {
              id: createId('el'),
              kind,
              ...rect,
              ...defaultFreeElementContent(kind),
              ...content,
            } as FreeformElement
            return { invoice: { ...state.invoice, freeformLayout: [...state.invoice.freeformLayout, element] } }
          }),

        addDrawing: (rect, drawing, color) => {
          const id = createId('el')
          set((state) => ({
            invoice: {
              ...state.invoice,
              freeformLayout: [...state.invoice.freeformLayout, { id, kind: 'drawing', ...rect, drawing, style: { color } }],
            },
          }))
          return id
        },

        setSectionOffset: (id, offset) =>
          set((state) => {
            const next = { ...state.invoice.sectionOffsets }
            if (offset && (offset.x !== 0 || offset.y !== 0)) next[id] = offset
            else delete next[id]
            return { invoice: { ...state.invoice, sectionOffsets: next } }
          }),

        resetSectionOffsets: () => set((state) => ({ invoice: { ...state.invoice, sectionOffsets: {} } })),

        // Back to the Watermark design's own watermark (text, image *and* look) as ONE edit, so a single undo
        // restores both — doing it as a style update then a text update would be two steps.
        resetWatermark: () =>
          set((state) => {
            const { watermark: _removed, ...sectionStyles } = state.invoice.sectionStyles
            return { invoice: { ...state.invoice, watermarkText: undefined, watermarkImage: undefined, sectionStyles } }
          }),

        // `undefined` puts the layout's own wording back (the key is removed, and the last one takes `labels`
        // with it); an empty string is kept — it is the user's choice to print nothing there.
        setLabel: (key, text) =>
          set((state) => {
            const { labels: current, ...rest } = state.invoice
            const labels = { ...current }
            if (text === undefined) delete labels[key]
            else labels[key] = text
            return { invoice: Object.keys(labels).length > 0 ? { ...rest, labels } : rest }
          }),

        // A key patched to `undefined` is removed, and a section left with no overrides drops out
        // entirely — so "Reset" really returns it to the design's own look.
        updateSectionStyle: (id, patch) =>
          set((state) => {
            const merged = Object.fromEntries(
              Object.entries({ ...state.invoice.sectionStyles[id], ...patch }).filter(([, v]) => v !== undefined),
            )
            const sectionStyles = { ...state.invoice.sectionStyles }
            if (Object.keys(merged).length > 0) sectionStyles[id] = merged
            else delete sectionStyles[id]
            return { invoice: { ...state.invoice, sectionStyles } }
          }),

        removeFreeformElement: (id) =>
          set((state) => {
            const removed = state.invoice.freeformLayout.find((el) => el.id === id)
            const layout = state.invoice.freeformLayout.filter((el) => el.id !== id)
            if (!removed) return { invoice: { ...state.invoice, freeformLayout: layout } }

            const stillHasKind = layout.some((el) => el.kind === removed.kind)
            if (stillHasKind) return { invoice: { ...state.invoice, freeformLayout: layout } }

            const sections = { ...state.invoice.sections }
            if (removed.kind === 'logo') sections.logo = false
            else if (removed.kind === 'from') sections.from = false
            else if (removed.kind === 'to') sections.to = false
            else if (removed.kind === 'signature') sections.signature = false
            else if (removed.kind === 'footer') for (const flag of FOOTER_SECTION_FLAGS) sections[flag] = false

            return { invoice: { ...state.invoice, sections, freeformLayout: layout } }
          }),

        duplicateFreeformElement: (id) =>
          set((state) => {
            const source = state.invoice.freeformLayout.find((el) => el.id === id)
            if (!source) return state
            const clone = { ...source, id: createId('el'), x: source.x + 16, y: source.y + 16 }
            return { invoice: { ...state.invoice, freeformLayout: [...state.invoice.freeformLayout, clone] } }
          }),

        updateFreeformElementContent: (id, patch) =>
          set((state) => ({
            invoice: {
              ...state.invoice,
              freeformLayout: state.invoice.freeformLayout.map((el) => (el.id === id ? { ...el, ...patch } : el)),
            },
          })),

        updateFreeformElementStyle: (id, patch) =>
          set((state) => ({
            invoice: {
              ...state.invoice,
              freeformLayout: state.invoice.freeformLayout.map((el) => {
                if (el.id !== id) return el
                const style = { ...el.style, ...patch }
                // Setting a property for the *whole* text box also clears it from words that were
                // formatted individually — otherwise "make everything red" would leave the one
                // word you'd made blue, blue. (Formatting a *selection* never comes through here;
                // it edits the box's `html` directly.) Same single store update, so it's one undo.
                if (el.kind === 'text' && el.html) {
                  const clear = (['color', 'bold', 'italic'] as RunProp[]).filter((prop) => prop in patch)
                  if (clear.length > 0) return { ...el, style, html: stripRunFormatting(el.html, clear) }
                }
                return { ...el, style }
              }),
            },
          })),

        updateFrom: (patch) =>
          set((state) => ({ invoice: { ...state.invoice, from: { ...state.invoice.from, ...patch } } })),

        updateTo: (patch) =>
          set((state) => ({ invoice: { ...state.invoice, to: { ...state.invoice.to, ...patch } } })),

        updateField: (key, value) => set((state) => ({ invoice: { ...state.invoice, [key]: value } })),

        addItem: () =>
          set((state) => ({ invoice: { ...state.invoice, items: [...state.invoice.items, blankLineItem()] } })),

        updateItem: (id, patch) =>
          set((state) => ({
            invoice: {
              ...state.invoice,
              items: state.invoice.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
            },
          })),

        removeItem: (id) =>
          set((state) => ({
            invoice: { ...state.invoice, items: state.invoice.items.filter((item) => item.id !== id) },
          })),

        reorderItems: (fromIndex, toIndex) =>
          set((state) => {
            const items = [...state.invoice.items]
            const [moved] = items.splice(fromIndex, 1)
            items.splice(toIndex, 0, moved)
            return { invoice: { ...state.invoice, items } }
          }),
      }
    },
    {
      name: 'invoice-generator/invoice',
      // Only the invoice is saved. Without this the undo/redo stacks (up to 100
      // snapshots, each carrying the logo's data URL) would be written to
      // localStorage on every edit and quickly blow its ~5MB quota.
      partialize: (state) => ({ invoice: state.invoice }),
      // Backfills fields for invoices persisted before they existed — without
      // this, older localStorage data would rehydrate with e.g.
      // `invoice.sections === undefined` or `invoice.theme.padding === undefined`
      // and every template would crash trying to read them.
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<InvoiceState> | undefined
        if (!persisted?.invoice) return currentState
        const templateDefaults = getTemplate(persisted.invoice.templateId)
        const sections = { ...defaultSectionVisibility(), ...persisted.invoice.sections }
        return {
          ...currentState,
          ...persisted,
          invoice: {
            ...currentState.invoice,
            ...persisted.invoice,
            theme: {
              ...currentState.invoice.theme,
              ...persisted.invoice.theme,
              padding: persisted.invoice.theme?.padding ?? templateDefaults.defaultPadding,
            },
            sections,
            lineItemColumns: {
              ...defaultLineItemColumns(),
              ...persisted.invoice.lineItemColumns,
            },
            customColumns: persisted.invoice.customColumns ?? [],
            sectionOffsets: persisted.invoice.sectionOffsets ?? {},
            sectionStyles: persisted.invoice.sectionStyles ?? {},
            // Reconciled against `sections` too — a pre-array-shape freeformLayout
            // (see migrateFreeformLayout) carries all 8 old block ids
            // unconditionally, regardless of what was hidden at the time, so
            // without this a hidden section could silently reappear on canvas
            // the first time old data loads under the new shape.
            freeformLayout: syncFreeformLayoutWithSections(
              migrateFreeformLayout(persisted.invoice.freeformLayout),
              sections,
            ),
            items: (persisted.invoice.items ?? currentState.invoice.items).map((item) => ({
              ...item,
              customValues: item.customValues ?? {},
            })),
          },
        }
      },
    },
  ),
)
