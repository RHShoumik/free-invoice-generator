import { ImagePlus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { LOGO_POSITIONS, logoObjectFit, logoObjectPosition } from '../../lib/logoFit'
import { logoRadius } from '../../lib/logoShape'
import type { FreeformElementStyle, LogoFit } from '../../types/invoice'
import { LogoShapeGroup } from './LogoControls'
import { useLogoUpload } from './useLogoUpload'

/** The part of an element's style the drawer edits: how the logo image looks in its box. */
export type LogoLook = Pick<FreeformElementStyle, 'shape' | 'fit' | 'imagePosition'>

interface BusinessDrawerProps {
  name: string
  email: string
  /** The uploaded logo (a data URL), or null for the letter tile. */
  logo: string | null
  logoStyle: LogoLook
  onNameChange: (name: string) => void
  onEmailChange: (email: string) => void
  onLogoChange: (dataUrl: string | null) => void
  onLogoStyleChange: (patch: LogoLook) => void
  onClose: () => void
}

const FITS: { fit: LogoFit; label: string; hint: string }[] = [
  { fit: 'fill', label: 'Fill', hint: 'Covers the whole box; anything past the edge is cropped.' },
  { fit: 'fit', label: 'Fit', hint: 'Shows the whole image, with empty space if it is not square.' },
  { fit: 'stretch', label: 'Stretch', hint: 'Squashes the image to the box, whatever its proportions.' },
]

const PREVIEW_SIZE = 96

/**
 * What clicking the business name opens, floating over the workspace's left
 * edge: the name and email printed beside the logo, and the logo itself —
 * replace or remove it, choose how it fills its square (Fill / Fit /
 * Stretch), which part of it stays in view (a 3×3 grid), and its shape.
 * The preview uses the same helpers as the `Logo` on the page, so what you
 * see here is what prints. Presentational: `EditorLayout` decides where each
 * edit is stored (the store's `from` party, `sectionStyles.logo`, or the
 * Freeform logo element).
 */
export function BusinessDrawer({
  name,
  email,
  logo,
  logoStyle,
  onNameChange,
  onEmailChange,
  onLogoChange,
  onLogoStyleChange,
  onClose,
}: BusinessDrawerProps) {
  const upload = useLogoUpload(onLogoChange)
  const fit = logoStyle.fit ?? 'fit'
  const position = logoStyle.imagePosition ?? 'center'
  // Position only matters when part of the image is cropped or the image is smaller than its box.
  const positionable = fit !== 'stretch'

  return (
    <aside className="flex max-h-full min-h-0 w-72 flex-col rounded-2xl bg-white shadow-[0_8px_32px_rgb(21_23_26/0.14)] ring-1 ring-black/5">
      <div className="flex items-start justify-between px-5 pb-1 pt-5">
        <div>
          <h2 className="text-base font-bold tracking-tight text-ink">Business</h2>
          <p className="mt-0.5 text-xs text-slate-500">Name, email and logo</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close business panel"
          className="-mr-1.5 -mt-1 flex size-8 items-center justify-center rounded-full text-slate-400 outline-none transition-colors hover:bg-black/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto px-5 pb-5 pt-3">
        <Field label="Business name">
          <Input aria-label="Business name" value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Your Business" />
        </Field>
        <Field label="Email">
          <Input aria-label="Email" type="email" value={email} onChange={(e) => onEmailChange(e.target.value)} placeholder="you@example.com" />
        </Field>

        <div className="border-t border-black/5 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Logo</span>
            {logo && (
              <div className="flex items-center gap-0.5">
                <Button type="button" variant="ghost" size="icon-sm" onClick={upload.pick} aria-label="Replace logo" title="Replace logo">
                  <ImagePlus />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => onLogoChange(null)} aria-label="Remove logo" title="Remove logo">
                  <Trash2 />
                </Button>
              </div>
            )}
          </div>

          {logo ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <span
                  className="flex shrink-0 items-center justify-center rounded-xl bg-paper p-2 ring-1 ring-black/5"
                  style={{ width: PREVIEW_SIZE + 16, height: PREVIEW_SIZE + 16 }}
                >
                  <img
                    src={logo}
                    alt="Logo preview"
                    style={{
                      width: PREVIEW_SIZE,
                      height: PREVIEW_SIZE,
                      objectFit: logoObjectFit(logoStyle.fit),
                      objectPosition: logoObjectPosition(logoStyle.imagePosition),
                      borderRadius: logoRadius(logoStyle.shape, PREVIEW_SIZE, 8),
                      background: '#fff',
                    }}
                  />
                </span>

                <div role="group" aria-label="Logo position" className="grid grid-cols-3 gap-1">
                  {LOGO_POSITIONS.map((p) => (
                    <button
                      key={p.position}
                      type="button"
                      disabled={!positionable}
                      aria-label={p.label}
                      aria-pressed={position === p.position}
                      title={positionable ? p.label : 'Position has no effect while stretched'}
                      onClick={() => onLogoStyleChange({ imagePosition: p.position })}
                      className={cn(
                        'flex size-8 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-35',
                        position === p.position && positionable ? 'bg-ink' : 'bg-paper hover:bg-black/10',
                      )}
                    >
                      <span className={cn('size-1.5 rounded-full', position === p.position && positionable ? 'bg-white' : 'bg-slate-400')} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Fit</span>
                <div role="group" aria-label="Logo fit" className="grid grid-cols-3 gap-1 rounded-xl bg-paper p-1">
                  {FITS.map((f) => (
                    <button
                      key={f.fit}
                      type="button"
                      aria-label={f.label}
                      aria-pressed={fit === f.fit}
                      onClick={() => onLogoStyleChange({ fit: f.fit })}
                      className={cn(
                        'rounded-lg px-2 py-1.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                        fit === f.fit ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink',
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{FITS.find((f) => f.fit === fit)?.hint}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Shape</span>
                <LogoShapeGroup shape={logoStyle.shape} onShapeChange={(shape) => onLogoStyleChange({ shape })} />
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" className="w-full rounded-xl" onClick={upload.pick}>
              <ImagePlus /> Upload logo
            </Button>
          )}

          {upload.error && (
            <p role="alert" className="mt-2 text-xs font-medium text-red-600">
              {upload.error}
            </p>
          )}
          {upload.fileInput}
        </div>
      </div>
    </aside>
  )
}
