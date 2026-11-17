import { Check, Circle, MoveUpRight, Pencil, Slash, Square } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DrawingTool } from '../../types/invoice'
import { ColorSwatches } from './ColorSwatches'
import { canFill } from './drawSettings'
import type { DrawSettings } from './drawSettings'
import { FillControl, StrokeWidthControl } from './DrawingControls'

const TOOLS: { tool: DrawingTool; label: string; Icon: LucideIcon }[] = [
  { tool: 'pencil', label: 'Pencil', Icon: Pencil },
  { tool: 'line', label: 'Line', Icon: Slash },
  { tool: 'arrow', label: 'Arrow', Icon: MoveUpRight },
  { tool: 'rectangle', label: 'Rectangle', Icon: Square },
  { tool: 'ellipse', label: 'Ellipse', Icon: Circle },
]

interface DrawBarProps {
  settings: DrawSettings
  onChange: (patch: Partial<DrawSettings>) => void
  onDone: () => void
}

/**
 * The pill that replaces the style pill while drawing: pick a tool, a line
 * thickness, a fill (rectangles and ellipses) and a color, then drag on the
 * page (`DrawLayer`). Everything chosen here applies to the *next* thing
 * drawn; a drawing already on the page is restyled from the style pill when
 * selected. Done (or Esc) goes back to editing.
 */
export function DrawBar({ settings, onChange, onDone }: DrawBarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Draw"
      className="pointer-events-auto flex h-12 max-w-full items-center gap-2.5 overflow-x-auto rounded-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-white px-4 shadow-[0_6px_28px_rgb(21_23_26/0.16)] ring-1 ring-black/5 animate-in fade-in-0 slide-in-from-top-2 duration-150"
    >
      <span className="shrink-0 text-sm font-bold tracking-tight text-ink">Draw</span>

      <div role="group" aria-label="Tool" className="flex shrink-0 items-center rounded-lg border border-slate-200 p-0.5">
        {TOOLS.map(({ tool, label, Icon }) => (
          <button
            key={tool}
            type="button"
            onClick={() => onChange({ tool })}
            aria-label={label}
            aria-pressed={settings.tool === tool}
            title={label}
            className={cn(
              'flex size-7 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              settings.tool === tool ? 'bg-ink text-white' : 'text-slate-500 hover:bg-black/5 hover:text-ink',
            )}
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>

      <StrokeWidthControl value={settings.strokeWidth} onChange={(strokeWidth) => onChange({ strokeWidth })} />
      {canFill(settings.tool) && <FillControl value={settings.fill} onChange={(fill) => onChange({ fill })} />}
      <ColorSwatches value={settings.color} onPick={(color) => onChange({ color })} />

      <Button type="button" size="sm" onClick={onDone} className="ml-auto shrink-0 rounded-full" title="Stop drawing (Esc)">
        <Check /> Done
      </Button>
    </div>
  )
}
