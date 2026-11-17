import type { LogoShape } from '../types/invoice'

/**
 * The logo's corner radius for a user-chosen shape, or the design's own
 * radius when none was chosen. "Rounded" scales with the logo (a fixed 8px on
 * a 140px logo would look square), and "circle" is just a radius larger than
 * the logo can ever be.
 */
export function logoRadius(shape: LogoShape | undefined, size: number, designRadius: number): number {
  switch (shape) {
    case 'square':
      return 0
    case 'rounded':
      return Math.round(size * 0.2)
    case 'circle':
      return 9999
    default:
      return designRadius
  }
}
