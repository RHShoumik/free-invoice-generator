/**
 * The Watermark design's watermark: what it says by default, how big it is,
 * and how faint. Lives here (not inline in the template) because the editor's
 * style bar needs the default opacity to show "7%" for an untouched watermark.
 */
export const WATERMARK_DEFAULT_OPACITY = 0.07
/** A picture needs more presence than a giant letter to read as a watermark at all. */
export const WATERMARK_IMAGE_DEFAULT_OPACITY = 0.14
/** An image watermark's width on the page, in px (the user can resize it from there). */
export const WATERMARK_IMAGE_WIDTH = 460

const MAX_FONT_SIZE = 560
const MIN_FONT_SIZE = 40
/** The width the text may fill (a little under the 794px page) and a typical bold capital's width in ems. */
const MAX_TEXT_WIDTH = 640
const CHAR_WIDTH_EM = 0.7

/** The watermark when the user hasn't typed one: the business name's first letter, as this design always showed. */
export function defaultWatermarkText(businessName: string): string {
  return (businessName.trim().charAt(0) || 'I').toUpperCase()
}

/**
 * A font size that keeps `text` inside the page: one letter fills it (560px),
 * and longer text shrinks to fit, so typing "PAID" or "CONFIDENTIAL" doesn't
 * run off both edges. The user can still scale it from the style bar.
 */
export function watermarkFontSize(text: string): number {
  const length = Math.max(1, [...text].length)
  return Math.round(Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, MAX_TEXT_WIDTH / (CHAR_WIDTH_EM * length))))
}
