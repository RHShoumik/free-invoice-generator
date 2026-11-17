import { useLayoutEffect, useRef } from 'react'
import type { CSSProperties } from 'react'

interface InlineFieldProps {
  value: string
  onChange: (value: string) => void
  as?: 'input' | 'textarea'
  type?: string
  placeholder?: string
  className?: string
  style?: CSSProperties
  ariaLabel?: string
  readOnly?: boolean
  /**
   * For an optional field that's shown so it stays clickable while editing
   * (e.g. a Party's address/email/phone) but shouldn't leave a gray
   * placeholder baked into a downloaded PNG/PDF when the user never filled
   * it in. Sets `data-export-hide="true"` — the same flag the line-item and
   * Freeform drag handles already use — only while `value` is empty, so
   * `skipExportHiddenNodes` (see exportToImage.ts/exportToPdf.ts) strips
   * just this one field from the rasterized output, not the whole row.
   */
  hideWhenEmptyOnExport?: boolean
}

const BASE_STYLE: CSSProperties = {
  display: 'block',
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  padding: 0,
  margin: 0,
  font: 'inherit',
  color: 'inherit',
  lineHeight: 'inherit',
}

/**
 * A borderless, blends-into-the-design text field used for click-to-edit
 * across every layout — click it, type, done. Always rendered as a real
 * `<input>`/`<textarea>` (never toggled between a `<p>` and a control on
 * click, which would need extra "am I editing this one" state and cause a
 * layout jump). Verified empirically that `html-to-image` (the Image/PDF
 * export library) correctly rasterizes typed input/textarea values, so this
 * carries no export-fidelity risk despite being a live form control.
 *
 * Deliberately plain HTML, not a shadcn component — this renders *inside*
 * the exported invoice page, same reasoning as `Logo`/`PartyBlock`/etc.
 * (see "Why shadcn is a separate concern" in docs/ARCHITECTURE.md).
 *
 * Has no knowledge of `CanvasEditContext`/`FreeformBlockContext` — callers
 * read the context once and pass plain `value`/`onChange`/`readOnly` down,
 * keeping this reusable.
 */
export function InlineField({
  value,
  onChange,
  as = 'input',
  type = 'text',
  placeholder,
  className,
  style,
  ariaLabel,
  readOnly,
  hideWhenEmptyOnExport,
}: InlineFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const mergedStyle = { ...BASE_STYLE, ...style }
  const exportHide = hideWhenEmptyOnExport && !value ? 'true' : undefined

  if (as === 'textarea') {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        style={{ ...mergedStyle, resize: 'none', overflow: 'hidden' }}
        aria-label={ariaLabel}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : undefined}
        data-export-hide={exportHide}
        rows={1}
      />
    )
  }

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      style={mergedStyle}
      aria-label={ariaLabel}
      readOnly={readOnly}
      tabIndex={readOnly ? -1 : undefined}
      data-export-hide={exportHide}
    />
  )
}
