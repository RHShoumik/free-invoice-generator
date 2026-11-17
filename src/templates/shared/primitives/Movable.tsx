import type { CSSProperties, ElementType, ReactNode } from 'react'
import { MovableOwnersProvider, useMovableOwners, useMovableSection } from '../SectionOffsetsContext'

interface MovableProps {
  /** Key into `invoice.sectionOffsets`, and the label shown on the drag outline (see `SECTION_LABELS`). */
  id: string
  /** The element to render — a drop-in for the tag it replaces (`div` by default). */
  as?: ElementType
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/**
 * Makes a layout's own hand-rolled markup (the business-name line beside the
 * logo, the INVOICE title block, the dates box, the footer paragraphs)
 * draggable like the shared primitives are. It's a drop-in for the element it
 * replaces — `<div className="text-right">` becomes `<Movable id="title"
 * className="text-right">` — rendering the same tag with the same classes,
 * and only adding the drag offset and `data-section-id`. That's deliberate:
 * a wrapper `<div>` around the element would change how a parent flex/grid
 * lays it out, and these layouts are hand-tuned.
 *
 * It can also wrap a decorated container (a bordered box around a primitive)
 * using the *same* id as the primitive inside it, so the box and its contents
 * move as one — the inner primitive stands down (see `MovableOwnersContext`).
 *
 * Outside the live editor (a design-picker thumbnail, where
 * `SectionOffsetsContext` isn't provided) it renders exactly the plain
 * element it replaces.
 *
 */
export function Movable({ id, as: Tag = 'div', className, style, children }: MovableProps) {
  const movable = useMovableSection(id)
  const owners = useMovableOwners()
  // An element with its own transform (the Postcard's tilted stamp) keeps it:
  // the drag offset is applied first, then the element's own rotation/scale.
  const ownTransform = style?.transform
  const merged: CSSProperties = {
    ...style,
    ...movable.style,
    ...(movable.style?.transform && ownTransform ? { transform: `${movable.style.transform} ${ownTransform}` } : {}),
    // Resizing pivots on the top-left corner unless the layout says otherwise (a centred watermark
    // would otherwise drift off-centre as it grows).
    ...(style?.transformOrigin ? { transformOrigin: style.transformOrigin } : {}),
  }
  return (
    <Tag className={className} style={merged} {...movable.attrs}>
      <MovableOwnersProvider value={[...owners, id]}>{children}</MovableOwnersProvider>
    </Tag>
  )
}
