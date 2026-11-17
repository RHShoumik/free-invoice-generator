/**
 * `dataTransfer` type the drawer's cards set when dragged, and the page
 * (`InvoicePreview`) checks for on drop. A custom type — rather than
 * `text/plain` — so dragging selected text or a file over the page can't be
 * mistaken for "add an element".
 */
export const ELEMENT_DRAG_TYPE = 'application/x-invoice-element'

/** The same idea for a card from the Uploads drawer; carries the upload's id (the image itself is looked up on drop, not smuggled through the drag). */
export const UPLOAD_DRAG_TYPE = 'application/x-invoice-upload'
