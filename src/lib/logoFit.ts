import type { LogoFit, LogoPosition } from '../types/invoice'

/** CSS `object-fit` for a user-chosen fit. Unset is `contain`: the whole image, which is what every logo did before this was a choice. */
export function logoObjectFit(fit: LogoFit | undefined): 'contain' | 'cover' | 'fill' {
  switch (fit) {
    case 'fill':
      return 'cover'
    case 'stretch':
      return 'fill'
    default:
      return 'contain'
  }
}

const OBJECT_POSITIONS: Record<LogoPosition, string> = {
  'top-left': 'left top',
  top: 'center top',
  'top-right': 'right top',
  left: 'left center',
  center: 'center',
  right: 'right center',
  'bottom-left': 'left bottom',
  bottom: 'center bottom',
  'bottom-right': 'right bottom',
}

/** CSS `object-position` for a user-chosen position; the center when unset. */
export function logoObjectPosition(position: LogoPosition | undefined): string {
  return OBJECT_POSITIONS[position ?? 'center']
}

/** The nine positions in 3×3 grid order (row by row, top-left first), with the name a screen reader says. */
export const LOGO_POSITIONS: { position: LogoPosition; label: string }[] = [
  { position: 'top-left', label: 'Top left' },
  { position: 'top', label: 'Top' },
  { position: 'top-right', label: 'Top right' },
  { position: 'left', label: 'Left' },
  { position: 'center', label: 'Center' },
  { position: 'right', label: 'Right' },
  { position: 'bottom-left', label: 'Bottom left' },
  { position: 'bottom', label: 'Bottom' },
  { position: 'bottom-right', label: 'Bottom right' },
]
