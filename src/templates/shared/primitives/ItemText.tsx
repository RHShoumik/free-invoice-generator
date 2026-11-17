import { useLayoutEffect, useRef, useState } from 'react'
import type { ClipboardEvent, KeyboardEvent, MouseEvent } from 'react'
import { useCanvasEdit } from '../CanvasEditContext'
import { itemKey, itemTitle } from '../ItemTarget'
import type { TextTarget } from '../ItemTarget'
import { useLabels } from '../LabelsContext'

interface ItemTextProps {
  target: TextTarget
  children: string
  /** Keep a click target where the text is empty. */
  empty?: boolean
}

/** Where a click landed, as a caret in `el` — so editing starts with the cursor in the letter that was clicked. */
function caretAt(el: HTMLElement, x: number, y: number): Range | null {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
  }
  let range = doc.caretRangeFromPoint?.(x, y) ?? null
  if (!range) {
    const position = doc.caretPositionFromPoint?.(x, y)
    if (position) {
      range = document.createRange()
      range.setStart(position.offsetNode, position.offset)
      range.collapse(true)
    }
  }
  return range && el.contains(range.startContainer) ? range : null
}

/**
 * A piece of text on the invoice, edited where it is. In the live editor it is
 * an inline `<span>` that inherits the surrounding font, size, color and case,
 * so a layout keeps its look: at rest it is invisible, and on hover it gets a
 * faint tint of the text's own color (readable on dark designs too). A click
 * turns that very same span into a text box — same place, same size, no jump —
 * with the cursor where you clicked; typing writes straight to the invoice (one
 * undo step per run of typing), Enter or clicking away finishes, Escape puts
 * the text back as it was. Everywhere else — a design-picker thumbnail, anything
 * with no `editText` in its `CanvasEditContext` — it is just its text, with no
 * wrapper at all.
 *
 * Same trade-offs as `EditableDate`, deliberately: at rest a `<span
 * role="button">` and not a `<button>`, because `useSectionDrag` leaves presses
 * on a `<button>` alone but starts a drag from anything else, so this text can
 * still be grabbed to move its section — and a press that doesn't move is the
 * click that starts editing (a drag swallows its trailing click). While editing
 * it is marked `data-no-section-drag`, so a press inside selects text instead
 * of dragging. The tint and the editing ring are `[data-item]` styles that
 * `index.css` switches off while an export is captured.
 *
 * Like `InlineText` it is uncontrolled while you type: React must not rewrite
 * the text on every keystroke or the caret jumps to the start, so the box keeps
 * the text it had when editing began, and the DOM is only rewritten when the
 * value changes from somewhere else (undo). One line: Enter finishes, and
 * paste is plain text on one line.
 */
export function ItemText({ target, children, empty }: ItemTextProps) {
  const editText = useCanvasEdit()?.editText
  const labels = useLabels()
  const ref = useRef<HTMLSpanElement>(null)
  /** The text as it was when editing began, or null while at rest. */
  const [frozen, setFrozen] = useState<string | null>(null)
  const editing = frozen !== null
  /** What Escape goes back to: the text, and for a label whether the user had their own wording at all. */
  const start = useRef<{ text: string; override: string | undefined }>({ text: '', override: undefined })
  /** Where the click that began editing landed (null when it began from the keyboard). */
  const clickPoint = useRef<{ x: number; y: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!editing || !el) return
    el.focus()
    const selection = window.getSelection()
    if (!selection) return
    // From a click: the cursor where it landed (the end, if that can't be told). From the keyboard: everything
    // selected, ready to be replaced.
    const point = clickPoint.current
    let range = point ? caretAt(el, point.x, point.y) : null
    if (!range) {
      range = document.createRange()
      range.selectNodeContents(el)
      if (point) range.collapse(false)
    }
    selection.removeAllRanges()
    selection.addRange(range)
  }, [editing])

  // The box shows something other than the value: it changed from somewhere else (undo, redo), or editing just
  // ended on a value that is the one it began with (Escape) — React saw the same text all along, so it left
  // whatever was typed in the DOM. Typing never gets here with a difference (what was typed is exactly what was
  // written), so the caret is left alone.
  useLayoutEffect(() => {
    const el = ref.current
    if (el && el.textContent !== children) el.textContent = children
  }, [children, editing])

  if (!editText) return <>{children}</>

  function begin(event?: MouseEvent) {
    clickPoint.current = event ? { x: event.clientX, y: event.clientY } : null
    start.current = { text: children, override: target.kind === 'label' ? labels?.[target.key] : undefined }
    setFrozen(children)
  }

  function handleInput() {
    const el = ref.current
    if (!el) return
    const text = el.textContent ?? ''
    // A browser may leave a stray <br> in a box that was just emptied, which would stop it collapsing to its minimum width.
    if (!text && el.innerHTML) el.innerHTML = ''
    if (text !== children) editText?.(target, text)
  }

  function handleEditingKeyDown(e: KeyboardEvent<HTMLSpanElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      // A label goes back to "no wording of my own" when it never had one; everything else to the text it had.
      editText?.(target, target.kind === 'label' ? start.current.override : start.current.text)
      e.currentTarget.blur()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLSpanElement>) {
    e.preventDefault()
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain').replace(/\s*\n\s*/g, ' '))
  }

  function handleRestKeyDown(e: KeyboardEvent<HTMLSpanElement>) {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    begin()
  }

  const title = itemTitle(target)
  const common = {
    ref,
    'data-item': itemKey(target),
    'data-export-hide': empty ? 'true' : undefined,
    style: empty ? ({ display: 'inline-block', minWidth: '1.5ch' } as const) : undefined,
  }

  if (editing) {
    return (
      <span
        {...common}
        role="textbox"
        aria-label={title}
        contentEditable
        suppressContentEditableWarning
        data-no-section-drag="true"
        onInput={handleInput}
        onKeyDown={handleEditingKeyDown}
        onPaste={handlePaste}
        onBlur={() => setFrozen(null)}
        className="-mx-0.5 cursor-text rounded-sm bg-current/10 px-0.5 outline-none ring-2 ring-current/40"
      >
        {/* Frozen on purpose: the same string every render, so React never touches the text while it is typed in. */}
        {frozen}
      </span>
    )
  }

  return (
    <span
      {...common}
      role="button"
      tabIndex={0}
      aria-label={empty ? `Edit ${title.toLowerCase()}` : undefined}
      onClick={begin}
      onKeyDown={handleRestKeyDown}
      className="-mx-0.5 cursor-text rounded-sm px-0.5 outline-none transition-colors hover:bg-current/10 focus-visible:bg-current/10 focus-visible:ring-2 focus-visible:ring-current/40"
    >
      {children}
    </span>
  )
}

/** A value with no editor of its own on the page — the invoice number, the notes / payment terms / bank details text. */
export function FieldText({
  field,
  children,
}: {
  field: 'invoiceNumber' | 'notes' | 'paymentTerms' | 'bankDetails'
  children: string
}) {
  return (
    <ItemText target={{ kind: 'field', field }} empty={children === ''}>
      {children}
    </ItemText>
  )
}

/** One line of the business / client that a layout prints in its own markup (a colored strip), not through `PartyBlock`. */
export function PartyLine({
  which,
  field,
  children,
}: {
  which: 'from' | 'to'
  field: 'name' | 'address' | 'email' | 'phone' | 'taxId'
  children: string
}) {
  return (
    <ItemText target={{ kind: 'party', which, field }} empty={children === ''}>
      {children}
    </ItemText>
  )
}
