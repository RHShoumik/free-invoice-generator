import { useEffect } from 'react'
import { useInvoiceStore } from '../../store/invoiceStore'

/**
 * Ctrl/⌘+Z to undo, Ctrl/⌘+Shift+Z or Ctrl+Y to redo — anywhere in the
 * editor, *including* while typing in a field. Every field on the invoice
 * writes straight into the store (so typing is already in the undo history),
 * which makes the browser's own per-input undo redundant and, worse,
 * unreliable on a controlled input; taking the shortcut over means ⌘Z always
 * undoes the document the same way the button does.
 */
export function useUndoRedoShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.isComposing || e.altKey || !(e.metaKey || e.ctrlKey)) return
      const key = e.key.toLowerCase()
      const { undo, redo } = useInvoiceStore.getState()
      if (key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (key === 'y' && e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
