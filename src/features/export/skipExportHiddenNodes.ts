/**
 * `html-to-image`'s `filter` option: excludes any node marked
 * `data-export-hide` from the rasterized output — e.g. the line-item drag
 * handle, which is a live-editor-only affordance that shouldn't appear
 * baked into a downloaded PNG/PDF.
 */
export function skipExportHiddenNodes(node: HTMLElement): boolean {
  return !(node.dataset && node.dataset.exportHide === 'true')
}
