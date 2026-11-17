import type { Invoice } from '../types/invoice'

/** Most undo steps kept. Snapshots share structure (every edit is immutable), so this is cheap. */
export const HISTORY_LIMIT = 100

/**
 * Edits to the same thing within this long of each other are one undo step —
 * typing "Northwind" is one step, not nine, and mashing the font-size "+"
 * is one step. A pause longer than this starts a new step.
 */
export const COALESCE_MS = 1000

export interface History {
  past: Invoice[]
  future: Invoice[]
}

export interface LastEdit {
  signature: string
  at: number
}

type Dict = Record<string, unknown>

const isPlainObject = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Keys whose value differs by reference. Every store update is immutable, so an unchanged part keeps its reference. */
function diffKeys(a: Dict, b: Dict): string[] {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => a[k] !== b[k])
}

/**
 * For a list of `{id}` records (line items, custom columns, canvas elements):
 * which field of which record changed — or `structure` if one was added,
 * removed, or reordered, which is never merged with its neighbors (three
 * quick "add text" clicks are three steps).
 */
function listSignature(label: string, a: Dict[], b: Dict[]): string[] {
  if (a.length !== b.length || a.some((rec, i) => rec.id !== b[i].id)) return [`${label}:structure`]
  const parts: string[] = []
  a.forEach((before, i) => {
    const after = b[i]
    if (before === after) return
    for (const field of diffKeys(before, after)) {
      const x = before[field]
      const y = after[field]
      // One level deeper for plain objects (a canvas element's `style`, an item's `customValues`),
      // so changing the color and then the size are different edits.
      if (isPlainObject(x) || isPlainObject(y)) {
        for (const sub of diffKeys((x as Dict) ?? {}, (y as Dict) ?? {})) parts.push(`${label}:${before.id}.${field}.${sub}`)
      } else {
        parts.push(`${label}:${before.id}.${field}`)
      }
    }
  })
  return parts
}

/**
 * A short, stable description of *what* an edit changed, e.g. `from.name`,
 * `items:item_3.description`, `free:el_9.style.color`. Two edits with the
 * same signature are the same kind of change to the same thing, which is
 * what lets `recordEdit` merge them into one undo step.
 */
export function changeSignature(prev: Invoice, next: Invoice): string {
  const a = prev as unknown as Dict
  const b = next as unknown as Dict
  const parts: string[] = []
  for (const key of diffKeys(a, b)) {
    switch (key) {
      case 'items':
        parts.push(...listSignature('items', prev.items as unknown as Dict[], next.items as unknown as Dict[]))
        break
      case 'customColumns':
        parts.push(...listSignature('columns', prev.customColumns as unknown as Dict[], next.customColumns as unknown as Dict[]))
        break
      case 'freeformLayout':
        parts.push(...listSignature('free', prev.freeformLayout as unknown as Dict[], next.freeformLayout as unknown as Dict[]))
        break
      case 'sectionStyles': {
        const before = prev.sectionStyles as unknown as Record<string, Dict | undefined>
        const after = next.sectionStyles as unknown as Record<string, Dict | undefined>
        for (const id of diffKeys(before, after)) {
          for (const prop of diffKeys(before[id] ?? {}, after[id] ?? {})) parts.push(`sectionStyle:${id}.${prop}`)
        }
        break
      }
      case 'sectionOffsets':
        parts.push(...diffKeys(prev.sectionOffsets as unknown as Dict, next.sectionOffsets as unknown as Dict).map((id) => `offset:${id}`))
        break
      case 'labels':
        parts.push(...diffKeys((prev.labels ?? {}) as Dict, (next.labels ?? {}) as Dict).map((label) => `labels.${label}`))
        break
      case 'from':
      case 'to':
      case 'theme':
      case 'sections':
      case 'lineItemColumns':
        parts.push(...diffKeys(a[key] as Dict, b[key] as Dict).map((sub) => `${key}.${sub}`))
        break
      default:
        parts.push(key)
    }
  }
  return parts.sort().join('|')
}

/**
 * Pure: the history after `prev` became `next`. A new step pushes `prev` onto
 * `past` and clears `future` (a fresh edit after an undo discards the redo
 * branch, as everywhere). An edit that continues the last one — same
 * signature, within `COALESCE_MS`, not a structural change — is folded into
 * the step already on the stack instead.
 */
export function recordEdit(
  history: History,
  prev: Invoice,
  next: Invoice,
  last: LastEdit | null,
  now: number,
): { history: History; last: LastEdit | null } {
  if (prev === next) return { history, last }
  const signature = changeSignature(prev, next)
  const continuesLast =
    last !== null &&
    last.signature === signature &&
    now - last.at <= COALESCE_MS &&
    !signature.includes('structure') &&
    history.past.length > 0
  if (continuesLast) return { history, last: { signature, at: now } }
  return {
    history: { past: [...history.past.slice(-(HISTORY_LIMIT - 1)), prev], future: [] },
    last: { signature, at: now },
  }
}
