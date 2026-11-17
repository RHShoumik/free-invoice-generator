import { useEffect, useState } from 'react'

/**
 * Which words are selected inside an added Text box, so the style toolbar can
 * format *just those* — and fall back to the whole box when none are.
 *
 * The toolbar lives outside the box, and some of its controls (the native
 * color picker) take focus, which clears the page's live selection. So the
 * last non-empty selection made inside a box is remembered here and restored
 * just before formatting is applied.
 */
interface Saved {
  id: string
  range: Range
}

let saved: Saved | null = null

const STYLE_TOOLBAR = '[data-style-toolbar]'

function editorOf(node: Node | null): HTMLElement | null {
  const el = node instanceof Element ? node : node?.parentElement
  return el?.closest<HTMLElement>('[data-rich-text]') ?? null
}

/** The selection to format for box `id`: the live one if it's inside that box, else the remembered one while the toolbar has focus. */
function selectedRange(id: string): Range | null {
  const sel = document.getSelection()
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    const range = sel.getRangeAt(0)
    if (editorOf(range.commonAncestorContainer)?.dataset.richText === id) return range
  }
  const toolbarHasFocus = !!document.activeElement?.closest(STYLE_TOOLBAR)
  if (toolbarHasFocus && saved?.id === id && saved.range.commonAncestorContainer.isConnected) return saved.range
  return null
}

/**
 * Applies `command` to the words selected in box `id`. Returns whether there
 * was a selection to apply it to — `false` means "nothing selected: do it to
 * the whole box instead", which is the caller's cue, not an error.
 *
 * Uses `document.execCommand` — deprecated on paper, but the only built-in
 * that formats a selection *and* works across every nesting/overlap case
 * (partly re-coloring an already-colored run, un-bolding one word of a bold
 * phrase); a hand-rolled range wrapper gets those wrong. `styleWithCSS` makes
 * it emit `<span style>` rather than `<font>`; either way the result is
 * rebuilt through `sanitizeRichHtml` on the way into the store.
 */
export function applyToSelectedWords(id: string, command: 'foreColor' | 'bold' | 'italic', value?: string): boolean {
  const range = selectedRange(id)
  const editor = range && editorOf(range.commonAncestorContainer)
  if (!range || !editor) return false

  editor.focus({ preventScroll: true })
  const sel = document.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
  document.execCommand('styleWithCSS', false, 'true')
  document.execCommand(command, false, value)
  return true
}

/** Which box has words selected in it (or null), kept current as the user selects — for the toolbar's "selected text" label. */
export function useRichSelectionTracking(): string | null {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    function handleSelectionChange() {
      const sel = document.getSelection()
      const editor = sel?.rangeCount ? editorOf(sel.anchorNode) : null
      if (editor && sel && !sel.isCollapsed) {
        saved = { id: editor.dataset.richText ?? '', range: sel.getRangeAt(0).cloneRange() }
      } else if (editor) {
        saved = null // a caret in a box, no words selected
      }
      setSelectedId(saved?.id ?? null)
    }
    // Pressing anywhere that isn't the toolbar or a box abandons the remembered selection, so a
    // stale one can't be recolored later by a toolbar click that comes with no selection.
    function handlePointerDown(e: PointerEvent) {
      const target = e.target instanceof Element ? e.target : null
      if (target?.closest(STYLE_TOOLBAR) || editorOf(target)) return
      saved = null
      setSelectedId(null)
    }
    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('pointerdown', handlePointerDown, true)
      saved = null
    }
  }, [])

  return selectedId
}
