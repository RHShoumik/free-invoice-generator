import { ImageUp, LayoutTemplate, Pencil, Shapes, SlidersHorizontal, Stamp } from 'lucide-react'
import { useFreeformBlock } from '../../../templates/shared/FreeformBlockContext'
import { ColumnsPopover } from './ColumnsPopover'
import { DockButton } from './DockButton'
import { SectionsPopover } from './SectionsPopover'
import { StylePopover } from './StylePopover'

/**
 * Which card is floating over the workspace's left edge (they share the one spot, so it's one or neither).
 * `elements`, `uploads` and `details` are dock buttons. `business` and `item` have none: they open when you click
 * the business name or logo, or a picture (an added Image, the watermark), on the page. Text is edited in place
 * and opens nothing.
 */
export type LeftPanel = 'elements' | 'uploads' | 'details' | 'business' | 'item'

interface DockProps {
  leftPanel: LeftPanel | null
  onToggleLeftPanel: (panel: LeftPanel) => void
  onOpenDesigns: () => void
  /** Draw mode is on: the page takes drags as drawing. */
  drawing: boolean
  onToggleDraw: () => void
  /** On the Watermark design only: a tool that selects the watermark (which sits behind the content and is hard to click). */
  showWatermark?: boolean
}

/**
 * The editor's tools, on a floating dock at the bottom of the workspace — one
 * place for everything that isn't on the page itself. *Designs* opens the
 * design browser, *Elements*, *Uploads* and *Details* toggle the floating
 * panel on the left, *Draw* switches the page into draw mode; the other three
 * (table columns, section visibility, style) are settings with no home on the
 * invoice, each a popover that opens upward from the dock.
 */
export function Dock({ leftPanel, onToggleLeftPanel, onOpenDesigns, drawing, onToggleDraw, showWatermark }: DockProps) {
  const block = useFreeformBlock()
  return (
    <nav
      aria-label="Tools"
      className="absolute bottom-5 left-1/2 z-30 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-2xl bg-white p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shadow-[0_6px_28px_rgb(21_23_26/0.16)] ring-1 ring-black/5"
    >
      <DockButton icon={LayoutTemplate} label="Designs" onClick={onOpenDesigns} />
      <DockButton icon={Shapes} label="Elements" active={leftPanel === 'elements'} aria-pressed={leftPanel === 'elements'} onClick={() => onToggleLeftPanel('elements')} />
      <DockButton icon={ImageUp} label="Uploads" active={leftPanel === 'uploads'} aria-pressed={leftPanel === 'uploads'} onClick={() => onToggleLeftPanel('uploads')} />
      <DockButton icon={Pencil} label="Draw" active={drawing} aria-pressed={drawing} onClick={onToggleDraw} />
      {showWatermark && block && (
        <DockButton
          icon={Stamp}
          label="Watermark"
          active={block.selectedId === 'watermark'}
          aria-pressed={block.selectedId === 'watermark'}
          onClick={() => block.onSelect('watermark')}
        />
      )}
      <div className="mx-1 h-8 w-px bg-black/10" />
      <DockButton
        icon={SlidersHorizontal}
        label="Details"
        active={leftPanel === 'details'}
        aria-pressed={leftPanel === 'details'}
        onClick={() => onToggleLeftPanel('details')}
      />
      <ColumnsPopover />
      <SectionsPopover />
      <StylePopover />
    </nav>
  )
}
