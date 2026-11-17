import { COLOR_SWATCHES } from './swatches'

interface ColorSwatchesProps {
  /** The current color, which gets the ring; undefined when it's the default. */
  value: string | undefined
  onPick: (color: string) => void
}

/** The quick color swatches plus a native picker for any other color. */
export function ColorSwatches({ value, onPick }: ColorSwatchesProps) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 border-l border-slate-200 pl-3">
      {COLOR_SWATCHES.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onPick(color)}
          aria-label={`Use ${color}`}
          className="size-6 rounded-full border border-black/10 transition-transform hover:scale-110"
          style={{ background: color, outline: value === color ? '2px solid var(--ink)' : undefined, outlineOffset: 2 }}
        />
      ))}
      <input
        type="color"
        value={value ?? '#334155'}
        onChange={(e) => onPick(e.target.value)}
        aria-label="Custom color"
        className="size-6 cursor-pointer rounded-full border border-slate-200 bg-white p-0.5"
      />
    </div>
  )
}
