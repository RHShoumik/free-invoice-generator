import { useLayoutEffect, useRef } from 'react'
import type { ClipboardEvent, CSSProperties, KeyboardEvent } from 'react'

interface InlineTextProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  style?: CSSProperties
  readOnly?: boolean
  ariaLabel?: string
  /** Hide from the PNG/PDF while empty, so the placeholder that keeps it clickable in the editor never exports. */
  hideWhenEmptyOnExport?: boolean
}

/**
 * Single-line editable text that sizes to its content — unlike `InlineField`,
 * which is an `<input>` and therefore as wide as its container. Needed where
 * the text *is* the layout (the Watermark design's giant watermark), where an
 * input would be a full-width box around a few letters.
 *
 * Uncontrolled while you type, for the same reason `RichTextField` is: React
 * must not rewrite the contents on every keystroke or the caret jumps to the
 * start. The DOM is only rewritten when `value` changes from outside (undo).
 * (Read-only, there's no caret to protect, so it renders its text normally.)
 * No Enter, and paste is plain text on one line.
 */
export function InlineText({ value, onChange, placeholder, className, style, readOnly, ariaLabel, hideWhenEmptyOnExport }: InlineTextProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!readOnly && el && el.textContent !== value) el.textContent = value
  }, [value, readOnly])

  function handleInput() {
    const el = ref.current
    if (!el) return
    const text = (el.textContent ?? '').replace(/\n/g, '')
    // A browser may leave a stray <br> in a span that was just emptied, which would hide the placeholder.
    if (!text && el.innerHTML) el.innerHTML = ''
    if (text !== value) onChange(text)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLSpanElement>) {
    if (e.key === 'Enter') e.preventDefault()
  }

  function handlePaste(e: ClipboardEvent<HTMLSpanElement>) {
    e.preventDefault()
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain').replace(/\s*\n\s*/g, ' '))
  }

  return (
    <span
      ref={ref}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      role="textbox"
      aria-label={ariaLabel}
      data-placeholder={placeholder}
      data-export-hide={hideWhenEmptyOnExport && !value ? 'true' : undefined}
      className={`${className ?? ''} empty:before:content-[attr(data-placeholder)]`}
      style={{ display: 'inline-block', minWidth: '1ch', outline: 'none', whiteSpace: 'pre', ...style }}
      onInput={handleInput}
      onKeyDown={readOnly ? undefined : handleKeyDown}
      onPaste={readOnly ? undefined : handlePaste}
    >
      {/* Read-only (a design-picker thumbnail) has nothing to protect from React, so it just renders its text. */}
      {readOnly ? value : null}
    </span>
  )
}
