import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MAX_STROKE_WIDTH, MIN_STROKE_WIDTH } from '../../lib/drawing'
import type { DrawingFill } from '../../types/invoice'

/** Line thickness, px. Shared by the draw bar (for the next shape) and the style pill (for the selected one). */
export function StrokeWidthControl({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const set = (next: number) => onChange(Math.min(MAX_STROKE_WIDTH, Math.max(MIN_STROKE_WIDTH, next)))
  return (
    <div className="flex shrink-0 items-center rounded-lg border border-slate-200 p-0.5" title="Line thickness">
      <Button type="button" variant="ghost" size="icon-sm" onClick={() => set(value - 1)} disabled={value <= MIN_STROKE_WIDTH} aria-label="Thinner line">
        <Minus />
      </Button>
      <span className="w-12 text-center text-sm font-medium tabular-nums text-slate-800" aria-label="Line thickness">
        {value}px
      </span>
      <Button type="button" variant="ghost" size="icon-sm" onClick={() => set(value + 1)} disabled={value >= MAX_STROKE_WIDTH} aria-label="Thicker line">
        <Plus />
      </Button>
    </div>
  )
}

const FILLS: { fill: DrawingFill; label: string }[] = [
  { fill: 'none', label: 'No fill' },
  { fill: 'tint', label: 'Tint' },
  { fill: 'solid', label: 'Solid' },
]

/** How a rectangle or ellipse is filled. */
export function FillControl({ value, onChange }: { value: DrawingFill; onChange: (next: DrawingFill) => void }) {
  return (
    <div role="group" aria-label="Fill" className="flex shrink-0 items-center rounded-lg border border-slate-200 p-0.5">
      {FILLS.map(({ fill, label }) => (
        <button
          key={fill}
          type="button"
          onClick={() => onChange(fill)}
          aria-pressed={value === fill}
          className={cn(
            'h-7 rounded-md px-2 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
            value === fill ? 'bg-ink text-white' : 'text-slate-500 hover:bg-black/5 hover:text-ink',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
