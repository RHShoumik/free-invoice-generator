/**
 * The little bit of rich text an added Text box supports: runs of text with a
 * color, bold, and/or italic, plus line breaks. Stored as a restricted HTML
 * string (`<span style="color:#dc2626">…</span>`, `<br>`) next to the plain
 * `text`, so a box can color just the words you select.
 *
 * Everything that reads or writes that HTML goes through `sanitizeRichHtml`.
 * The editing surface is a `contenteditable`, whose DOM can contain almost
 * anything — `<div>`s for lines, `<font>` tags, pasted markup — so what's
 * stored is rebuilt from scratch out of an allow-list: text, `<br>`, and
 * `<span>`s carrying only a validated `color`, `font-weight` and `font-style`.
 * That keeps the stored data small and predictable, keeps it a safe thing to
 * put back into `innerHTML` (the data lives in localStorage, where it could
 * have been edited by hand), and keeps the formatting a simple list of runs.
 */

export type RunProp = 'color' | 'bold' | 'italic'

export interface TextRun {
  /** May contain `\n` for a line break. */
  text: string
  /** `#rrggbb` */
  color?: string
  bold?: boolean
  italic?: boolean
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }
const escapeText = (s: string) => s.replace(/[&<>]/g, (c) => ESCAPES[c])

/** Elements dropped along with everything inside them. */
const SKIP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'NOSCRIPT'])
/** Elements that start and end a line; what `contenteditable` makes for Enter in some browsers, and for pasted paragraphs. */
const BLOCK = new Set(['DIV', 'P', 'LI', 'UL', 'OL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'TR'])

/** `#rrggbb` for a hex or opaque `rgb()` color; null for anything else (names, alpha, junk). */
export function normalizeColor(raw: string): string | null {
  const v = raw.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(v)) return v
  const short = v.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/)
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`
  const rgb = v.match(/^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?:[,/]\s*([\d.]+)(%?)\s*)?\)$/)
  if (!rgb) return null
  if (rgb[4] !== undefined && Number(rgb[4]) / (rgb[5] ? 100 : 1) !== 1) return null
  const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map((n) => Math.min(255, Number(n)))
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

function normalizeWeight(raw: string): 'bold' | 'normal' | null {
  const v = raw.trim().toLowerCase()
  if (v === 'bold' || v === 'bolder') return 'bold'
  if (v === 'normal' || v === 'lighter') return 'normal'
  const n = Number(v)
  return Number.isNaN(n) ? null : n >= 600 ? 'bold' : 'normal'
}

function normalizeStyle(raw: string): 'italic' | 'normal' | null {
  const v = raw.trim().toLowerCase()
  if (v === 'italic' || v === 'oblique') return 'italic'
  return v === 'normal' ? 'normal' : null
}

interface Format {
  color?: string
  /** `normal` is kept (not dropped) because it can override a bold/italic *box*: un-bolding one word of a bold box. */
  bold?: 'bold' | 'normal'
  italic?: 'italic' | 'normal'
}

function formatOf(el: Element): Format {
  const f: Format = {}
  const tag = el.tagName
  if (tag === 'B' || tag === 'STRONG') f.bold = 'bold'
  if (tag === 'I' || tag === 'EM') f.italic = 'italic'
  if (tag === 'FONT') {
    const color = el.getAttribute('color')
    const n = color ? normalizeColor(color) : null
    if (n) f.color = n
  }
  // An inline style wins over what the tag itself implies.
  const style = (el as HTMLElement).style
  if (style) {
    const color = style.color ? normalizeColor(style.color) : null
    if (color) f.color = color
    const weight = style.fontWeight ? normalizeWeight(style.fontWeight) : null
    if (weight) f.bold = weight
    const italic = style.fontStyle ? normalizeStyle(style.fontStyle) : null
    if (italic) f.italic = italic
  }
  return f
}

function styleString(f: Format): string {
  const parts: string[] = []
  if (f.color) parts.push(`color:${f.color}`)
  if (f.bold) parts.push(`font-weight:${f.bold}`)
  if (f.italic) parts.push(`font-style:${f.italic}`)
  return parts.join(';')
}

function dropProps(f: Format, drop: ReadonlySet<RunProp>): Format {
  const next = { ...f }
  if (drop.has('color')) delete next.color
  if (drop.has('bold')) delete next.bold
  if (drop.has('italic')) delete next.italic
  return next
}

const endsWithBreak = (out: string[]) => out.length > 0 && out[out.length - 1] === '<br>'

function walk(node: Node, out: string[], drop: ReadonlySet<RunProp>): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 3) {
      out.push(escapeText(child.textContent ?? ''))
      continue
    }
    if (child.nodeType !== 1) continue
    const el = child as Element
    const tag = el.tagName
    if (SKIP.has(tag)) continue
    if (tag === 'BR') {
      out.push('<br>')
      continue
    }
    if (BLOCK.has(tag)) {
      // A block is its own line(s): break before it if something precedes, and after it —
      // unless its own content already ended in a break (Chrome's empty line is `<div><br></div>`).
      if (out.length > 0 && !endsWithBreak(out)) out.push('<br>')
      walk(el, out, drop)
      if (!endsWithBreak(out)) out.push('<br>')
      continue
    }
    const style = styleString(dropProps(formatOf(el), drop))
    const inner: string[] = []
    walk(el, inner, drop)
    if (style && inner.length > 0) out.push(`<span style="${style}">`, ...inner, '</span>')
    else out.push(...inner)
  }
}

/**
 * Rebuilds `html` out of the allow-list described above. `drop` removes the
 * named formatting from every run (how "color the whole box" clears the
 * colors of words that were colored individually). A single trailing `<br>`
 * is removed: `contenteditable` keeps one as a placeholder at the end of the
 * text, and it has no visible effect.
 */
export function sanitizeRichHtml(html: string, drop: ReadonlySet<RunProp> = new Set()): string {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const out: string[] = []
  walk(doc.body, out, drop)
  if (endsWithBreak(out)) out.pop()
  return out.join('')
}

/** Removes the given formatting from every run of `html`. */
export function stripRunFormatting(html: string, props: readonly RunProp[]): string {
  return sanitizeRichHtml(html, new Set(props))
}

/** Plain text → the HTML a box shows for it (what a box created before rich text, or pasted text, becomes). */
export function plainTextToHtml(text: string): string {
  return escapeText(text).replace(/\r?\n/g, '<br>')
}

/**
 * The runs in `html`, in order, with each run's *own* formatting (bold
 * `normal` is a real value — it overrides a bold box — so it's kept as
 * `false`, not as "unset").
 */
export function htmlToRuns(html: string): TextRun[] {
  const clean = sanitizeRichHtml(html)
  if (!clean) return []
  const doc = new DOMParser().parseFromString(`<body>${clean}</body>`, 'text/html')
  const runs: TextRun[] = []
  const visit = (node: Node, inherited: Format) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3) {
        const text = child.textContent ?? ''
        if (!text) continue
        runs.push({
          text,
          ...(inherited.color ? { color: inherited.color } : {}),
          ...(inherited.bold ? { bold: inherited.bold === 'bold' } : {}),
          ...(inherited.italic ? { italic: inherited.italic === 'italic' } : {}),
        })
      } else if (child.nodeType === 1) {
        const el = child as Element
        if (el.tagName === 'BR') runs.push({ text: '\n' })
        else visit(el, { ...inherited, ...formatOf(el) })
      }
    }
  }
  visit(doc.body, {})
  return runs
}

/** `html` as plain text, with `\n` for each line break. */
export function htmlToPlainText(html: string): string {
  return htmlToRuns(html)
    .map((r) => r.text)
    .join('')
}
