import { useLayoutEffect, useMemo, useRef } from 'react'
import type { ClipboardEvent, CSSProperties, KeyboardEvent } from 'react'
import { htmlToPlainText, sanitizeRichHtml } from '../../../lib/richText'

interface RichTextFieldProps {
  /** The stored rich HTML (see `lib/richText.ts`). */
  html: string
  onChange: (html: string, text: string) => void
  /** The owning canvas element's id — the style toolbar uses it to find the words selected in *this* box. */
  elementId: string
  placeholder?: string
  className?: string
  style?: CSSProperties
  readOnly?: boolean
  ariaLabel?: string
}

/**
 * The editing surface for an added Text box: a `contenteditable` that holds
 * runs of text with their own color/bold/italic, so the style toolbar can
 * change just the words you've selected.
 *
 * It is deliberately *uncontrolled* while you type. React never owns the
 * contents (no children, no `dangerouslySetInnerHTML`) — it can't rewrite the
 * DOM on every keystroke without throwing the caret to the start. Instead:
 *  - on input, the DOM is read back through `sanitizeRichHtml` and reported up;
 *  - when the stored HTML changes from *outside* (undo, redo), the DOM is
 *    rewritten — detected by comparing the sanitized DOM with the stored
 *    value, so the echo of the user's own typing is a no-op and the caret stays.
 *
 * Enter inserts a `<br>` rather than letting the browser start a new `<div>`
 * (so lines stay `<br>`-separated and the stored form stays simple), and paste
 * is always plain text. An empty box is `data-export-hide`n so its
 * placeholder never lands in an export.
 */
export function RichTextField({ html, onChange, elementId, placeholder, className, style, readOnly, ariaLabel }: RichTextFieldProps) {
  const ref = useRef<HTMLDivElement>(null)
  const clean = useMemo(() => sanitizeRichHtml(html), [html])

  useLayoutEffect(() => {
    const el = ref.current
    if (el && sanitizeRichHtml(el.innerHTML) !== clean) el.innerHTML = clean
  }, [clean])

  function handleInput() {
    const el = ref.current
    if (!el) return
    const next = sanitizeRichHtml(el.innerHTML)
    // Chrome leaves a stray <br> in a box that was just emptied, which would hide the placeholder.
    if (!next && el.innerHTML) el.innerHTML = ''
    if (next !== clean) onChange(next, htmlToPlainText(next))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      document.execCommand('insertLineBreak')
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    text.split(/\r?\n/).forEach((line, i) => {
      if (i > 0) document.execCommand('insertLineBreak')
      if (line) document.execCommand('insertText', false, line)
    })
  }

  return (
    <div
      ref={ref}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={ariaLabel}
      data-rich-text={elementId}
      data-placeholder={placeholder}
      data-export-hide={clean ? undefined : 'true'}
      className={`${className ?? ''} empty:before:pointer-events-none empty:before:text-slate-300 empty:before:content-[attr(data-placeholder)]`}
      style={{ minHeight: '1.4em', outline: 'none', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', ...style }}
      onInput={handleInput}
      onKeyDown={readOnly ? undefined : handleKeyDown}
      onPaste={readOnly ? undefined : handlePaste}
    />
  )
}
