import { isFreeformFreeKind } from '../../types/invoice'
import type { Drawing, FreeformElementStyle, FreeformLayout, SectionStyles } from '../../types/invoice'
import { WATERMARK_DEFAULT_OPACITY, WATERMARK_IMAGE_DEFAULT_OPACITY } from '../../templates/14-watermark/watermark'
import { SECTION_LABELS } from './useSectionDrag'

/** What the style bar is editing, and which controls make sense for it. */
export interface StyleSelection {
  id: string
  label: string
  style: FreeformElementStyle
  /**
   * `font`: a real font size in px (free text/table, which have no styling of their own).
   * `scale`: a size multiplier — for everything else, which is hand-styled line by line.
   * `none`: no size control (a divider has no text).
   */
  sizing: 'font' | 'scale' | 'none'
  defaultFontSize: number
  color: boolean
  /** Bold / italic. */
  textStyle: boolean
  /** An added Text box: color/bold/italic can apply to just the selected words (see `richSelection.ts`). */
  richText: boolean
  /** The invoice's logo: the style bar offers upload/replace/remove and a shape picker for it. */
  logo: boolean
  /** A drawn shape: the style bar offers line thickness (and fill, for a rectangle/ellipse) for it. Null for everything else. */
  drawing: Drawing | null
  /** Show an opacity control — only the Watermark design's watermark, which is meant to be faint. */
  opacity: boolean
  /** What the opacity control reads before the user has changed it. */
  defaultOpacity: number
  /** Where the override is stored: on a canvas element, or in `invoice.sectionStyles`. */
  target: 'element' | 'section'
}

const FREE_LABELS: Record<string, string> = { text: 'Text', table: 'Table', divider: 'Divider', drawing: 'Drawing' }

interface ResolveInput {
  selectedId: string | null
  /** The active design's layout — the watermark only exists on the Watermark design, so a leftover selection of it means nothing elsewhere. */
  layoutId: string
  /** The watermark is an image, so it can be resized and faded but has no text to recolor or embolden. */
  watermarkIsImage?: boolean
  isFreeform: boolean
  freeformLayout: FreeformLayout
  sectionStyles: SectionStyles
}

/**
 * Turns "this id is selected" into what the style bar should show. Anything
 * on the page can be restyled, so the answer is a selection for: an added
 * Text/Table/Divider/Drawing, any block on Freeform Canvas, and any section or
 * design block on the 20 fixed layouts. Only an added Image has nothing to
 * style (no text), and an empty selection has nothing at all.
 *
 * On a fixed layout `freeformLayout` still holds bound entries with ids like
 * `to`/`items` (they only matter on Freeform Canvas), so an id there means a
 * *section*, unless it belongs to an added free element.
 */
export function resolveStyleSelection({ selectedId, layoutId, watermarkIsImage, isFreeform, freeformLayout, sectionStyles }: ResolveInput): StyleSelection | null {
  if (!selectedId) return null
  if (selectedId === 'watermark' && layoutId !== 'watermark') return null

  const element = freeformLayout.find((el) => el.id === selectedId)
  if (element && (isFreeform || isFreeformFreeKind(element.kind))) {
    const label = FREE_LABELS[element.kind] ?? SECTION_LABELS[element.kind] ?? element.kind
    const base = { id: element.id, label, style: element.style ?? {}, target: 'element' as const, richText: false, logo: false, drawing: null, opacity: false, defaultOpacity: 1 }
    switch (element.kind) {
      case 'image':
        return null
      case 'text':
        return { ...base, sizing: 'font', defaultFontSize: 14, color: true, textStyle: true, richText: true }
      case 'table':
        return { ...base, sizing: 'font', defaultFontSize: 13, color: true, textStyle: true }
      case 'divider':
        return { ...base, sizing: 'none', defaultFontSize: 14, color: true, textStyle: false }
      case 'drawing':
        return { ...base, sizing: 'none', defaultFontSize: 14, color: true, textStyle: false, drawing: element.drawing, opacity: true }
      case 'logo':
        return { ...base, sizing: 'scale', defaultFontSize: 14, color: false, textStyle: false, logo: true }
      default:
        return { ...base, sizing: 'scale', defaultFontSize: 14, color: true, textStyle: true }
    }
  }

  if (!isFreeform && SECTION_LABELS[selectedId]) {
    const isLogo = selectedId === 'logo'
    const isWatermark = selectedId === 'watermark'
    const isImageWatermark = isWatermark && !!watermarkIsImage
    return {
      id: selectedId,
      label: SECTION_LABELS[selectedId],
      style: sectionStyles[selectedId] ?? {},
      sizing: 'scale',
      defaultFontSize: 14,
      color: !isLogo && !isImageWatermark,
      textStyle: !isLogo && !isImageWatermark,
      richText: false,
      logo: isLogo,
      drawing: null,
      opacity: isWatermark,
      defaultOpacity: isImageWatermark ? WATERMARK_IMAGE_DEFAULT_OPACITY : isWatermark ? WATERMARK_DEFAULT_OPACITY : 1,
      target: 'section',
    }
  }

  return null
}
