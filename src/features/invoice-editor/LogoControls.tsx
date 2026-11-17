import { ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LogoShape } from '../../types/invoice'
import { useLogoUpload } from './useLogoUpload'

/** The invoice's logo, edited from the style bar when it's selected on the page. */
export interface LogoControl {
  /** The uploaded logo (a data URL), or null for the letter tile. */
  image: string | null
  onImageChange: (dataUrl: string | null) => void
}

const SHAPES: { shape: LogoShape; label: string; corner: string }[] = [
  { shape: 'square', label: 'Square', corner: 'rounded-none' },
  { shape: 'rounded', label: 'Rounded', corner: 'rounded-[5px]' },
  { shape: 'circle', label: 'Circle', corner: 'rounded-full' },
]

interface LogoShapeGroupProps {
  shape: LogoShape | undefined
  onShapeChange: (shape: LogoShape) => void
}

/** Square / rounded / circle, as a small icon group. */
export function LogoShapeGroup({ shape, onShapeChange }: LogoShapeGroupProps) {
  return (
    <div role="group" aria-label="Logo shape" className="flex shrink-0 items-center rounded-lg border border-slate-200 p-0.5">
      {SHAPES.map((s) => (
        <button
          key={s.shape}
          type="button"
          onClick={() => onShapeChange(s.shape)}
          aria-label={s.label}
          aria-pressed={shape === s.shape}
          title={s.label}
          className={cn(
            'flex size-7 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
            shape === s.shape ? 'bg-ink text-white' : 'text-slate-500 hover:bg-black/5 hover:text-ink',
          )}
        >
          <span className={cn('size-3.5 border-2 border-current', s.corner)} />
        </button>
      ))}
    </div>
  )
}

interface LogoSourceProps {
  logo: LogoControl
  shape: LogoShape | undefined
  onShapeChange: (shape: LogoShape) => void
}

/**
 * What a click on the logo opens: replace or remove the image, and pick its
 * shape. A plain click used to jump straight to the file picker, which made
 * the logo impossible to select (to resize or move) without being asked to
 * upload something; the picker is now one explicit button here, with
 * double-clicking the logo as a shortcut.
 */
export function LogoSource({ logo, shape, onShapeChange }: LogoSourceProps) {
  const upload = useLogoUpload(logo.onImageChange)

  return (
    <>
      {logo.image ? (
        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 p-0.5 pr-1">
          <span className="flex size-8 items-center justify-center overflow-hidden rounded-md bg-paper">
            <img src={logo.image} alt="" className="size-full object-contain" />
          </span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={upload.pick} aria-label="Replace logo" title="Replace logo">
            <ImagePlus />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => logo.onImageChange(null)} aria-label="Remove logo" title="Remove logo">
            <Trash2 />
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-lg" onClick={upload.pick}>
          <ImagePlus /> Upload logo
        </Button>
      )}

      <LogoShapeGroup shape={shape} onShapeChange={onShapeChange} />

      {upload.error && (
        <span role="alert" className="shrink-0 text-xs font-medium text-red-600">
          {upload.error}
        </span>
      )}
      {upload.fileInput}
    </>
  )
}
