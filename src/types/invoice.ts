/**
 * Core data model for the app. This is the single shape that:
 *  - the Zustand store holds and persists to localStorage
 *  - every template component reads from (via InvoiceTemplateProps)
 *  - every exporter (image/pdf) reads from
 * Keeping one shape shared across all three keeps preview and exports in sync.
 */

export type FontId =
  | 'inter'
  | 'plus-jakarta-sans'
  | 'playfair-display'
  | 'jetbrains-mono'
  | 'dm-serif-display'

export interface FontOption {
  id: FontId
  label: string
  /** CSS font-family value, including fallback stack */
  stack: string
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'inter', label: 'Inter', stack: "'Inter', system-ui, sans-serif" },
  {
    id: 'plus-jakarta-sans',
    label: 'Plus Jakarta Sans',
    stack: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
  {
    id: 'playfair-display',
    label: 'Playfair Display',
    stack: "'Playfair Display', Georgia, serif",
  },
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    stack: "'JetBrains Mono', ui-monospace, monospace",
  },
  {
    id: 'dm-serif-display',
    label: 'DM Serif Display',
    stack: "'DM Serif Display', Georgia, serif",
  },
]

export function fontStack(id: FontId): string {
  return FONT_OPTIONS.find((f) => f.id === id)?.stack ?? FONT_OPTIONS[0].stack
}

export interface Party {
  name: string
  address: string
  email: string
  phone: string
  taxId: string
}

export function emptyParty(): Party {
  return { name: '', address: '', email: '', phone: '', taxId: '' }
}

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  /** Free-text values for user-added custom columns, keyed by `CustomColumn.id`. */
  customValues: Record<string, string>
}

/**
 * A user-added extra column on the line items table (e.g. "SKU", "Hours",
 * "Notes") — informational only, not part of the qty × rate amount
 * calculation. Rendered after the built-in Amount column, in the order
 * they were added.
 */
export interface CustomColumn {
  id: string
  label: string
}

/**
 * Per-column customization for the line items table: a custom header label,
 * plus (for quantity/rate only) whether the column shows at all — e.g. a
 * flat-fee invoice might drop quantity, a retainer invoice might drop rate
 * and just show the total. Description and amount always show (an invoice
 * needs at least an item name and its price), but their labels are still
 * renameable so "Description"/"Amount" aren't hardcoded English.
 */
export interface LineItemColumn {
  label: string
  visible: boolean
}

export interface LineItemColumns {
  description: LineItemColumn
  quantity: LineItemColumn
  rate: LineItemColumn
  amount: LineItemColumn
}

export function defaultLineItemColumns(): LineItemColumns {
  return {
    description: { label: 'Description', visible: true },
    quantity: { label: 'Qty', visible: true },
    rate: { label: 'Rate', visible: true },
    amount: { label: 'Amount', visible: true },
  }
}

/**
 * The Freeform Canvas layout (see registry.ts) positions every section as an
 * independently draggable, width-resizable, deletable/duplicable element
 * instead of a fixed flow layout. Deliberately no `height` on any element —
 * height stays content-driven/auto, so there's no second resize axis and no
 * risk of text clipping. `FreeformTemplate` computes the canvas's own total
 * height from each element's measured content height (see FreeformTemplate.tsx).
 *
 * Two families of element:
 *  - "Bound" kinds (logo/meta/from/to/items/totals/footer/signature) carry no
 *    content of their own — they render straight from the matching `Invoice`
 *    field (`invoice.from`, `invoice.items`, ...), exactly like every other
 *    layout. A bound kind can appear more than once (e.g. two `from` entries
 *    after duplicating) — both stay bound to the same underlying data, so
 *    editing either updates both. That's intentional, not a bug: `Signature`
 *    already derives its name text from that same `invoice.from`/`to`.
 *  - "Free" kinds (text/table/image/divider) are added from the on-canvas
 *    element palette, and `drawing` by drawing on the page; all carry their
 *    own content, since no `Invoice` field backs them.
 */
export type FreeformBoundKind = 'logo' | 'meta' | 'from' | 'to' | 'items' | 'totals' | 'footer' | 'signature'
export type FreeformFreeKind = 'text' | 'table' | 'image' | 'divider' | 'drawing'
export type FreeformElementKind = FreeformBoundKind | FreeformFreeKind

export interface FreeformElementRect {
  x: number
  y: number
  width: number
}

/**
 * Per-element text styling override, set from the contextual style toolbar
 * when anything on the page is selected — see ARCHITECTURE.md. Two kinds of
 * target, with different size semantics:
 *
 *  - A "free" text/table element is plain text with no styling of its own, so
 *    `fontSize` is a real font size in px.
 *  - Everything else (business info, line items, the logo, a design's title
 *    or notes, …) is hand-styled with a different size and weight on every
 *    line (a label, a name, an address line), so one px value would flatten
 *    it. Those take `scale` instead — the whole block grows or shrinks
 *    together, keeping its proportions.
 *
 * `color`/`bold`/`italic` apply to every line of text in the target.
 */
export type LogoShape = 'square' | 'rounded' | 'circle'

/**
 * How the logo image sits in its box (see `lib/logoFit.ts`): `fill` covers the whole box and crops the
 * overflow, `fit` shows the whole image with empty space if it isn't square, `stretch` squashes it to the box.
 */
export type LogoFit = 'fill' | 'fit' | 'stretch'

/** Which part of a cropped (`fill`) or smaller (`fit`) image stays in view — the nine cells of a 3×3 grid. */
export type LogoPosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right'

/** What the draw tools can make. */
export type DrawingTool = 'pencil' | 'line' | 'arrow' | 'rectangle' | 'ellipse'
/** How a rectangle or ellipse is filled: not at all, a light wash of its color, or solid. */
export type DrawingFill = 'none' | 'tint' | 'solid'

/**
 * One drawn shape. It lives in its own `0 0 w h` box (the element's rect puts
 * that box on the page) and scales with the element's width, keeping the
 * `w`:`h` ratio — so resizing a drawing scales its lines too, like an image.
 * Its color is the element's `style.color`; `points` are in the box's own
 * coordinates: the stroke for `pencil`, the two ends for `line`/`arrow`, and
 * two opposite corners for `rectangle`/`ellipse`. See `lib/drawing.ts`.
 */
export interface Drawing {
  tool: DrawingTool
  w: number
  h: number
  points: [number, number][]
  strokeWidth: number
  fill: DrawingFill
}

export interface FreeformElementStyle {
  fontSize?: number
  /** Size multiplier for non-free targets; 1 (or unset) is the design's own size. */
  scale?: number
  /** 0–1. Only the Watermark design's watermark exposes this control; elsewhere unset. */
  opacity?: number
  /** The logo's corner shape; unset keeps whatever the design uses. Only the logo exposes this. */
  shape?: LogoShape
  /** How the logo image fills its box; unset shows the whole image (`fit`). Only the logo exposes this. */
  fit?: LogoFit
  /** Which part of the logo image stays in view; unset is the center. Only the logo exposes this. */
  imagePosition?: LogoPosition
  color?: string
  bold?: boolean
  italic?: boolean
}

interface FreeformElementBase extends FreeformElementRect {
  id: string
  style?: FreeformElementStyle
}

/**
 * The union of every "free" kind's own content fields, each optional — a
 * discriminated union's per-branch fields (`text`/`rows`/`dataUrl` below)
 * aren't valid `keyof`/`Pick` targets on the union as a whole, so this is
 * the type `updateFreeformElementContent`/`onUpdateContent` patch with
 * instead.
 */
export interface FreeformFreeContent {
  text?: string
  html?: string
  rows?: string[][]
  dataUrl?: string | null
  drawing?: Drawing
}

export type FreeformElement =
  | (FreeformElementBase & { kind: FreeformBoundKind })
  // `text` is always the plain text (search, and what shows before the rich text loads). `html` is the same content
  // with per-word color/bold/italic (see `lib/richText.ts`); absent on a box that has none, or that
  // predates rich text, in which case the box shows `text`.
  | (FreeformElementBase & { kind: 'text'; text: string; html?: string })
  | (FreeformElementBase & { kind: 'table'; rows: string[][] })
  | (FreeformElementBase & { kind: 'image'; dataUrl: string | null })
  | (FreeformElementBase & { kind: 'divider' })
  | (FreeformElementBase & { kind: 'drawing'; drawing: Drawing })

export type FreeformLayout = FreeformElement[]

export function isFreeformFreeKind(kind: FreeformElementKind): kind is FreeformFreeKind {
  return kind === 'text' || kind === 'table' || kind === 'image' || kind === 'divider' || kind === 'drawing'
}

/** Same starting arrangement the layout has always used — see the module doc above. */
export function defaultFreeformLayout(): FreeformLayout {
  return [
    { id: 'logo', kind: 'logo', x: 48, y: 48, width: 88 },
    { id: 'meta', kind: 'meta', x: 470, y: 48, width: 276 },
    { id: 'from', kind: 'from', x: 48, y: 170, width: 340 },
    { id: 'to', kind: 'to', x: 430, y: 170, width: 316 },
    { id: 'items', kind: 'items', x: 48, y: 380, width: 698 },
    { id: 'totals', kind: 'totals', x: 470, y: 680, width: 276 },
    { id: 'footer', kind: 'footer', x: 48, y: 820, width: 698 },
    { id: 'signature', kind: 'signature', x: 48, y: 950, width: 698 },
  ]
}

/** Page padding in px, one value per side — see docs/ARCHITECTURE.md for why this lives per-template rather than as one global default. */
export interface PagePadding {
  top: number
  right: number
  bottom: number
  left: number
}

export function uniformPadding(px: number): PagePadding {
  return { top: px, right: px, bottom: px, left: px }
}

export interface InvoiceTheme {
  accentColor: string
  font: FontId
  padding: PagePadding
}

/**
 * Per-invoice show/hide switches for the optional sections. Every template
 * is expected to honor these (see docs/ADDING_A_TEMPLATE.md) rather than
 * inferring visibility from whether a field happens to be non-empty, so the
 * editor's checkboxes always match what actually renders/exports.
 *
 * Line items, and the invoice number/dates, are deliberately NOT here — an
 * invoice without them isn't really an invoice. Tax/discount aren't here
 * either: hiding a tax row while it's still folded into the total would
 * make the displayed math not add up, so those stay tied to their rate
 * being non-zero instead of an independent switch.
 */
export interface SectionVisibility {
  logo: boolean
  from: boolean
  to: boolean
  paymentTerms: boolean
  bankDetails: boolean
  notes: boolean
  signature: boolean
}

export function defaultSectionVisibility(): SectionVisibility {
  return {
    logo: true,
    from: true,
    to: true,
    paymentTerms: true,
    bankDetails: true,
    notes: true,
    signature: false,
  }
}

/**
 * The printed words around the invoice's data — "Invoice", "Issue Date", "Bill To", "Subtotal", "Total"… — that the
 * user can reword by clicking them. One key per role, shared by all 21 layouts: a layout that prints "Issued" where
 * another prints "Issue Date" still reads `issueDate`, and falls back to its own wording until the user sets one.
 */
export type LabelKey =
  | 'title'
  | 'invoiceNumber'
  | 'issueDate'
  | 'dueDate'
  | 'from'
  | 'billTo'
  | 'subtotal'
  | 'discount'
  | 'tax'
  | 'total'
  | 'paymentTerms'
  | 'bankDetails'
  | 'signatureBusiness'
  | 'signatureClient'

/** The user's own wording, by role. A key that is absent means "the layout's own wording"; `''` means "show nothing". */
export type InvoiceLabels = Partial<Record<LabelKey, string>>

export interface Invoice {
  id: string
  templateId: string
  theme: InvoiceTheme
  logoDataUrl: string | null
  invoiceNumber: string
  issueDate: string
  dueDate: string
  from: Party
  to: Party
  items: LineItem[]
  currency: string
  taxRatePct: number
  discountPct: number
  notes: string
  paymentTerms: string
  bankDetails: string
  sections: SectionVisibility
  lineItemColumns: LineItemColumns
  customColumns: CustomColumn[]
  /**
   * Free-floating Text/Table/Image/Divider elements (and, on the Freeform
   * Canvas layout, the position of every default section too). On every
   * *other* layout only the "free" kinds in here are used — they render as
   * an overlay on top of the design.
   */
  freeformLayout: FreeformLayout
  /**
   * How far the user has dragged each shared section (logo/from/to/items/
   * totals/signature) from where its design places it, in canvas px. Only
   * used by the 20 fixed layouts — Freeform Canvas positions blocks absolutely
   * through `freeformLayout` instead. See `SectionOffsetsContext`.
   */
  sectionOffsets: SectionOffsets
  /** Color/size/bold/italic overrides for the shared sections and a design's own blocks, keyed like `sectionOffsets`. Fixed layouts only. */
  sectionStyles: SectionStyles
  /** The user's wording for the printed labels (see `LabelKey`). Unset on an invoice that has never reworded one. */
  labels?: InvoiceLabels
  /**
   * The Watermark design's watermark text. Unset means "automatic" — the first
   * letter of the business name, which is what that design always showed — so
   * old invoices look the same; an empty string means the user removed it.
   */
  watermarkText?: string
  /**
   * An image to use as the watermark instead of text (a logo, a "PAID" stamp).
   * When set, it replaces the text; removing it brings the text back.
   */
  watermarkImage?: string
}

export interface SectionOffset {
  x: number
  y: number
}

export type SectionOffsets = Record<string, SectionOffset>

export type SectionStyles = Record<string, FreeformElementStyle>
