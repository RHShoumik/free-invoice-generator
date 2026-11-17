import type { RefObject } from 'react'
import { FreeformBlockWrapper } from '../../templates/21-freeform/blocks/FreeformBlockWrapper'
import { FreeformFreeElement } from '../../templates/21-freeform/blocks/FreeformFreeElement'
import { isFreeformFreeKind } from '../../types/invoice'
import type { FreeformElement, FreeformElementRect } from '../../types/invoice'

export interface LiveDrag {
  id: string
  rect: FreeformElementRect
}

interface FreeLayerProps {
  elements: FreeformElement[]
  canvasRef: RefObject<HTMLDivElement | null>
  liveDrag: LiveDrag | null
  onLiveDrag: (drag: LiveDrag | null) => void
  onCommit: (id: string, rect: FreeformElementRect) => void
  onMeasuredHeight: (id: string, height: number) => void
}

/**
 * The free-floating Text/Table/Image/Divider elements, drawn over whichever
 * fixed layout is active so every design can take them — not just Freeform
 * Canvas. Each is the same `FreeformBlockWrapper` Freeform Canvas uses, so
 * dragging, resizing, selecting and duplicating behave identically; only the
 * container differs. The layer itself is click-through (`pointer-events:
 * none`), and each element opts back in, so it never blocks click-to-edit on
 * the design underneath. It lives inside the exported node, so these
 * elements land in the PNG/PDF exactly where they sit on screen.
 */
export function FreeLayer({ elements, canvasRef, liveDrag, onLiveDrag, onCommit, onMeasuredHeight }: FreeLayerProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {elements
        .filter((el) => isFreeformFreeKind(el.kind))
        .map((el) => {
          const rect = liveDrag?.id === el.id ? liveDrag.rect : el
          return (
            <FreeformBlockWrapper
              key={el.id}
              id={el.id}
              rect={rect}
              canvasRef={canvasRef}
              onLiveChange={(r) => onLiveDrag({ id: el.id, rect: r })}
              onCommitChange={(r) => {
                onCommit(el.id, r)
                onLiveDrag(null)
              }}
              onMeasuredHeight={(h) => onMeasuredHeight(el.id, h)}
              passThrough={el.kind === 'drawing'}
            >
              <FreeformFreeElement element={el} />
            </FreeformBlockWrapper>
          )
        })}
    </div>
  )
}
