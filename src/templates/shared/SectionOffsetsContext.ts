import { createContext, useContext } from 'react'
import type { CSSProperties } from 'react'
import type { FreeformElementStyle, SectionOffsets, SectionStyles } from '../../types/invoice'
import { styleOverride } from './elementStyle'

/**
 * Lets the user drag any shared section (logo, from, to, line items, totals,
 * signature) anywhere on a *fixed* layout without rebuilding that layout as
 * an absolutely-positioned canvas: each primitive shifts itself with a CSS
 * `translate` by however far it's been dragged from where its design puts it.
 * The design underneath keeps its look and flow; the section just moves.
 *
 * Same opt-in-via-context, gate-on-null pattern as `CanvasEditContext`:
 * only `InvoicePreview` (the one live, store-backed render) provides it, so
 * the 105 design-picker thumbnails never shift, never carry the drag
 * attribute, and can never move a section on the invoice being edited.
 * `InvoicePreview` also provides `null` on Freeform Canvas, whose blocks are
 * positioned absolutely through `invoice.freeformLayout` instead — applying
 * a second offset on top would double-move them.
 */
const SectionOffsetsContext = createContext<SectionOffsets | null>(null)

export const SectionOffsetsProvider = SectionOffsetsContext.Provider

/**
 * The matching per-section color/size/bold/italic overrides (`invoice.sectionStyles`).
 * Provided and gated exactly like the offsets above — and read by the same
 * `useMovableSection`, so any section that can be moved can be restyled.
 */
const SectionStylesContext = createContext<SectionStyles | null>(null)

export const SectionStylesProvider = SectionStylesContext.Provider

/** The user's style override for a section, if any — for a primitive that needs more than a transform (the logo's shape). */
export function useSectionStyle(id: string): FreeformElementStyle | undefined {
  return useContext(SectionStylesContext)?.[id]
}

/** What a primitive spreads onto its root element to be movable. Empty when offsets aren't active. */
interface MovableSectionProps {
  attrs: Record<string, string>
  style: CSSProperties | undefined
}

/**
 * Ids of the enclosing `Movable` wrappers. A layout can wrap a decorated
 * container — the bordered box around a Bill To, the rounded frame around the
 * table — in `<Movable id="to">` so the box and its contents move together.
 * The primitive inside (`<PartyBlock which="to">`) then sees its own id
 * already owned by an ancestor and stands down: without that, both would
 * apply the same offset and the contents would move twice as far as the box.
 */
const MovableOwnersContext = createContext<readonly string[]>([])

export const MovableOwnersProvider = MovableOwnersContext.Provider

export function useMovableOwners(): readonly string[] {
  return useContext(MovableOwnersContext)
}

export function useMovableSection(id: string): MovableSectionProps {
  const offsets = useContext(SectionOffsetsContext)
  const styles = useContext(SectionStylesContext)
  const owners = useContext(MovableOwnersContext)
  if (!offsets || owners.includes(id)) return { attrs: {}, style: undefined }

  const offset = offsets[id]
  const override = styleOverride(styles?.[id])
  // Move first, then scale about the top-left corner, so the section keeps its anchor and grows
  // down and to the right. Transforms never reflow, so scaling can't push a neighbor around.
  const transform = [offset ? `translate(${offset.x}px, ${offset.y}px)` : '', override.scale !== 1 ? `scale(${override.scale})` : '']
    .filter(Boolean)
    .join(' ')
  const style: CSSProperties = {
    ...override.vars,
    ...(transform ? { transform } : {}),
    ...(override.scale !== 1 ? { transformOrigin: 'top left' } : {}),
    ...(override.opacity !== undefined ? { opacity: override.opacity } : {}),
  }
  return {
    attrs: { 'data-section-id': id, ...override.attrs },
    style: Object.keys(style).length > 0 ? style : undefined,
  }
}
