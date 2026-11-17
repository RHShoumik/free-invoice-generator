import type { FreeformElementStyle } from '../../../types/invoice'

interface FreeformDividerElementProps {
  style?: FreeformElementStyle
}

/** A free-floating horizontal divider added from the canvas palette — no editable content, just a line whose color can be overridden. */
export function FreeformDividerElement({ style }: FreeformDividerElementProps) {
  return <hr style={{ border: 'none', borderTop: `1px solid ${style?.color ?? '#cbd5e1'}`, margin: 0 }} />
}
