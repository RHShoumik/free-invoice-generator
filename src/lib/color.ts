/** Small color helpers so templates can derive gradients/tints from the user's one accent color. */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const num = parseInt(full, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')}`
}

/** amount in [-1, 1]; positive mixes toward white, negative mixes toward black. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const target = amount > 0 ? 255 : 0
  const factor = Math.abs(amount)
  return rgbToHex([
    r + (target - r) * factor,
    g + (target - g) * factor,
    b + (target - b) * factor,
  ])
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
