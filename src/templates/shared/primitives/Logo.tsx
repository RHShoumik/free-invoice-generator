import { useRef, useState } from 'react'
import { useCanvasEdit } from '../CanvasEditContext'
import { logoObjectFit, logoObjectPosition } from '../../../lib/logoFit'
import { logoRadius } from '../../../lib/logoShape'
import { useMovableSection, useSectionStyle } from '../SectionOffsetsContext'
import type { LogoFit, LogoPosition, LogoShape } from '../../../types/invoice'
import { resizeImageFile } from '../../../lib/image'

interface LogoProps {
  logoDataUrl: string | null
  businessName: string
  size?: number
  radius?: number
  /** Overrides the design's own corner radius. Passed by Freeform Canvas, whose style lives on the element; elsewhere it comes from `sectionStyles`. */
  shape?: LogoShape
  /** How the image fills its box, and which part of it stays in view. Same sourcing as `shape`: props on Freeform Canvas, `sectionStyles` elsewhere. */
  fit?: LogoFit
  imagePosition?: LogoPosition
  accentColor?: string
}

/**
 * Renders the uploaded logo, or a soft initial-letter placeholder when none
 * is set yet. When `useCanvasEdit()` is active (the live editor, never a
 * design-picker thumbnail — see `CanvasEditContext.ts`), a click *selects* it
 * (the style bar then offers upload/replace, remove, shape and size) and a
 * double-click opens the file picker as a shortcut. A small "✕" overlay
 * (shown whenever a logo is set) removes it — `data-export-hide`d so this
 * editor-only chrome never bakes into a downloaded PNG/PDF.
 */
export function Logo({ logoDataUrl, businessName, size = 64, radius: designRadius = 8, shape, fit, imagePosition, accentColor = '#2563eb' }: LogoProps) {
  const edit = useCanvasEdit()
  const movable = useMovableSection('logo')
  const sectionStyle = useSectionStyle('logo') // called unconditionally (rules of hooks), then the props win
  const radius = logoRadius(shape ?? sectionStyle?.shape, size, designRadius)
  const objectPosition = imagePosition ?? sectionStyle?.imagePosition
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file || !edit) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }
    setError(null)
    try {
      const dataUrl = await resizeImageFile(file)
      edit.setLogo(dataUrl)
    } catch {
      setError('Could not process that image.')
    }
  }

  const mark = logoDataUrl ? (
    <img
      src={logoDataUrl}
      alt={`${businessName || 'Business'} logo`}
      style={{
        width: size,
        height: size,
        objectFit: logoObjectFit(fit ?? sectionStyle?.fit),
        // Left unset (not "center") until chosen, so an untouched logo renders exactly as it always has.
        ...(objectPosition ? { objectPosition: logoObjectPosition(objectPosition) } : {}),
        borderRadius: radius,
      }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `${accentColor}1a`,
        color: accentColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.42,
        fontWeight: 700,
      }}
    >
      {businessName.trim().charAt(0).toUpperCase() || '?'}
    </div>
  )

  if (!edit) return mark

  return (
    <div style={{ position: 'relative', width: size, display: 'inline-block', ...movable.style }} {...movable.attrs}>
      <div onDoubleClick={() => inputRef.current?.click()} title="Double-click to replace" style={{ cursor: 'grab' }}>
        {mark}
      </div>
      {logoDataUrl && (
        <button
          type="button"
          data-export-hide="true"
          onClick={(e) => {
            e.stopPropagation()
            edit.setLogo(null)
          }}
          aria-label="Remove logo"
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 16,
            height: 16,
            borderRadius: 999,
            border: 'none',
            background: '#475569',
            color: '#fff',
            fontSize: 10,
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      )}
      {error && (
        <p data-export-hide="true" style={{ marginTop: 4, fontSize: 10, color: '#ef4444', whiteSpace: 'nowrap' }}>
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        data-export-hide="true"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
