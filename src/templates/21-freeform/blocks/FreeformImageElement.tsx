import { useFreeformBlock } from '../../shared/FreeformBlockContext'
import type { FreeformElement } from '../../../types/invoice'

interface FreeformImageElementProps {
  element: Extract<FreeformElement, { kind: 'image' }>
}

/**
 * A free-floating image element added from the canvas palette. Pressing it
 * selects it, which opens the left item drawer with the picture — Replace,
 * Remove (or Upload, while it is empty) live there, not on the page. An empty
 * one shows a dashed placeholder in the editor that never reaches an export.
 */
export function FreeformImageElement({ element }: FreeformImageElementProps) {
  const block = useFreeformBlock()

  if (!block) {
    return element.dataUrl ? (
      <img src={element.dataUrl} alt="" style={{ width: '100%', display: 'block' }} />
    ) : null
  }

  return (
    <div
      data-export-hide={element.dataUrl ? undefined : 'true'}
      style={{
        cursor: 'pointer',
        minHeight: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: element.dataUrl ? undefined : '1px dashed #cbd5e1',
        borderRadius: 6,
        color: '#94a3b8',
        fontSize: 12,
      }}
    >
      {element.dataUrl ? (
        <img src={element.dataUrl} alt="" style={{ width: '100%', display: 'block' }} />
      ) : (
        'Click to add an image'
      )}
    </div>
  )
}
