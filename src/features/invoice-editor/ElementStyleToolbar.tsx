import { Bold, Italic, Minus, Plus, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MAX_SCALE, MIN_SCALE } from '../../templates/shared/elementStyle'
import { useFreeformBlock } from '../../templates/shared/FreeformBlockContext'
import { ColorSwatches } from './ColorSwatches'
import { canFill } from './drawSettings'
import { FillControl, StrokeWidthControl } from './DrawingControls'
import { applyToSelectedWords, useRichSelectionTracking } from './richSelection'
import type { Drawing } from '../../types/invoice'
import type { StyleSelection } from './styleSelection'
import { LogoSource } from './LogoControls'
import type { LogoControl } from './LogoControls'
import { WatermarkSource } from './WatermarkControls'
import type { WatermarkControl } from './WatermarkControls'

const MIN_FONT_SIZE = 8
const MAX_FONT_SIZE = 96
const FONT_SIZE_STEP = 2
const SCALE_STEP = 0.1
const OPACITY_STEP = 0.05
const MIN_OPACITY = 0.02

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

interface ElementStyleToolbarProps {
  selection: StyleSelection | null
  watermark?: WatermarkControl
  logo?: LogoControl
  /** Edits the selected drawing's own settings (thickness, fill) — its color goes through the usual style update. */
  onDrawingChange?: (patch: Partial<Drawing>) => void
}

/**
 * The style pill. Click anything on the page — a section of the design, a
 * block on Freeform Canvas, or an element you added — and this floats in over
 * the canvas to restyle just that: size, bold, italic, color. It overlays the
 * workspace rather than sitting in the layout, so it can appear and vanish
 * without shifting the page. What each control does for a given selection is
 * decided in
 * `resolveStyleSelection`; the size control is a px font size for added text
 * and a percentage for everything else (see `FreeformElementStyle`).
 *
 * Lives in `EditorLayout`, outside the exportable preview node, so it needs
 * no `data-export-hide` of its own.
 */
export function ElementStyleToolbar({ selection, watermark, logo, onDrawingChange }: ElementStyleToolbarProps) {
  const block = useFreeformBlock()
  const boxWithSelectedWords = useRichSelectionTracking()

  // Nothing selected, nothing to show: it floats over the canvas, so it can come and go
  // without moving anything on the page.
  if (!selection || !block) return null

  return (
    <div
      data-style-toolbar
      className="pointer-events-auto flex h-12 max-w-full items-center gap-2.5 overflow-x-auto rounded-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-white px-4 shadow-[0_6px_28px_rgb(21_23_26/0.16)] ring-1 ring-black/5 animate-in fade-in-0 slide-in-from-top-2 duration-150"
      // Pressing a button here must not move focus out of a text box: that would drop the words you
      // selected before the color is applied. (The native color input is the exception — it has to
      // take focus to open its picker; `richSelection` remembers the selection across that.)
      onMouseDown={(e) => {
        if (!(e.target instanceof HTMLInputElement)) e.preventDefault()
      }}
    >
      <SelectionControls
        selection={selection}
        wordsSelected={selection.richText && boxWithSelectedWords === selection.id}
        watermark={selection.id === 'watermark' ? watermark : undefined}
        logo={selection.logo ? logo : undefined}
        onDrawingChange={onDrawingChange}
        onChange={(patch) => block.onUpdateStyle(selection.id, patch)}
        onClose={() => block.onSelect(null)}
      />
    </div>
  )
}

interface ControlsProps {
  selection: StyleSelection
  /** Words are selected inside this text box, so color/bold/italic will apply to just those. */
  wordsSelected: boolean
  watermark?: WatermarkControl
  logo?: LogoControl
  onDrawingChange?: (patch: Partial<Drawing>) => void
  onChange: (patch: Partial<StyleSelection['style']>) => void
  onClose: () => void
}

function SelectionControls({ selection, wordsSelected, watermark, logo, onDrawingChange, onChange, onClose }: ControlsProps) {
  const { style, sizing } = selection
  const fontSize = style.fontSize ?? selection.defaultFontSize
  const scale = style.scale ?? 1
  const opacity = style.opacity ?? selection.defaultOpacity
  const hasOverrides = Object.values(style).some((v) => v !== undefined) || !!watermark?.overridden

  const setFontSize = (next: number) => onChange({ fontSize: clamp(next, MIN_FONT_SIZE, MAX_FONT_SIZE) })
  // Rounded to avoid 1.2000000000000002 drifting in after a few steps; back at 1 means "the design's own size".
  const setScale = (next: number) => {
    const rounded = Math.round(clamp(next, MIN_SCALE, MAX_SCALE) * 100) / 100
    onChange({ scale: rounded === 1 ? undefined : rounded })
  }

  const setOpacity = (next: number) => onChange({ opacity: Math.round(clamp(next, MIN_OPACITY, 1) * 100) / 100 })

  // In an added Text box, color/bold/italic go to the selected words when there are any, and to the
  // whole box when there aren't. `applyToSelectedWords` returns false for "nothing selected".
  const pickColor = (color: string) => {
    if (!(selection.richText && applyToSelectedWords(selection.id, 'foreColor', color))) onChange({ color })
  }
  const toggleBold = () => {
    if (!(selection.richText && applyToSelectedWords(selection.id, 'bold'))) onChange({ bold: style.bold ? undefined : true })
  }
  const toggleItalic = () => {
    if (!(selection.richText && applyToSelectedWords(selection.id, 'italic'))) onChange({ italic: style.italic ? undefined : true })
  }

  return (
    <>
      <span className="shrink-0 text-sm font-bold tracking-tight text-ink">{selection.label}</span>
      {selection.richText && (
        <span
          // Fixed width: the two labels differ in length, and the controls after it would otherwise
          // shift sideways every time words are selected or deselected.
          className={`inline-block w-[5.75rem] shrink-0 rounded-full py-1 text-center text-[11px] font-semibold ${wordsSelected ? 'bg-brand/15 text-brand' : 'bg-paper text-slate-500'}`}
        >
          {wordsSelected ? 'Selected text' : 'Whole box'}
        </span>
      )}

      {watermark && <WatermarkSource watermark={watermark} />}

      {logo && <LogoSource logo={logo} shape={style.shape} onShapeChange={(shape) => onChange({ shape })} />}

      {selection.drawing && onDrawingChange && (
        <>
          <StrokeWidthControl value={selection.drawing.strokeWidth} onChange={(strokeWidth) => onDrawingChange({ strokeWidth })} />
          {canFill(selection.drawing.tool) && <FillControl value={selection.drawing.fill} onChange={(fill) => onDrawingChange({ fill })} />}
        </>
      )}

      {sizing !== 'none' && (
        <div className="flex shrink-0 items-center rounded-lg border border-slate-200 p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => (sizing === 'font' ? setFontSize(fontSize - FONT_SIZE_STEP) : setScale(scale - SCALE_STEP))}
            aria-label="Decrease size"
          >
            <Minus />
          </Button>
          <span className="w-12 text-center text-sm font-medium tabular-nums text-slate-800" aria-label="Size">
            {sizing === 'font' ? fontSize : `${Math.round(scale * 100)}%`}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => (sizing === 'font' ? setFontSize(fontSize + FONT_SIZE_STEP) : setScale(scale + SCALE_STEP))}
            aria-label="Increase size"
          >
            <Plus />
          </Button>
        </div>
      )}

      {selection.textStyle && (
        <>
          <Button
            type="button"
            variant={style.bold ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={toggleBold}
            aria-label="Toggle bold"
            aria-pressed={!!style.bold}
          >
            <Bold />
          </Button>
          <Button
            type="button"
            variant={style.italic ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={toggleItalic}
            aria-label="Toggle italic"
            aria-pressed={!!style.italic}
          >
            <Italic />
          </Button>
        </>
      )}

      {selection.opacity && (
        <div className="flex shrink-0 items-center rounded-lg border border-slate-200 p-0.5" title="Opacity">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpacity(opacity - OPACITY_STEP)} aria-label="Less opaque">
            <Minus />
          </Button>
          <span className="w-16 text-center text-sm font-medium tabular-nums text-slate-800" aria-label="Opacity">
            {Math.round(opacity * 100)}%
          </span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpacity(opacity + OPACITY_STEP)} aria-label="More opaque">
            <Plus />
          </Button>
        </div>
      )}

      {selection.color && <ColorSwatches value={style.color} onPick={pickColor} />}

      {hasOverrides && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            // The watermark resets its text and look together, in one undo step (see `resetWatermark`).
            watermark
              ? watermark.onReset()
              : onChange({ fontSize: undefined, scale: undefined, color: undefined, bold: undefined, italic: undefined, opacity: undefined, shape: undefined })
          }
          title="Back to the design's own look"
          className="shrink-0"
        >
          <RotateCcw /> Reset
        </Button>
      )}

      <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Done editing" className="ml-auto">
        <X />
      </Button>
    </>
  )
}
