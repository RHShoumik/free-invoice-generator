/**
 * Runs a PNG/PDF capture of `page` with the page marked `data-exporting`, which
 * `index.css` uses to switch off the editor's hover / focus tint on clickable
 * text (`[data-item]`). `html-to-image` copies each node's *computed* style, so
 * without this a label the cursor happens to rest on (the Download menu closes
 * right over the page) would be baked into the file with its tint.
 */
export async function whileExporting<T>(page: HTMLElement, capture: () => Promise<T>): Promise<T> {
  page.dataset.exporting = 'true'
  try {
    return await capture()
  } finally {
    delete page.dataset.exporting
  }
}
