import { toBlob } from 'html-to-image'
import { skipExportHiddenNodes } from './skipExportHiddenNodes'
import { whileExporting } from './whileExporting'
import { downloadBlob, safeFilename } from './downloadFile'

/**
 * Rasterizes the live preview node (the exact thing on screen) to a PNG and
 * downloads it directly. pixelRatio 3 keeps text crisp even though the page
 * is laid out at CSS pixel size (~794px wide).
 */
export async function exportToImage(node: HTMLElement, invoiceNumber: string): Promise<void> {
  const blob = await whileExporting(node, () =>
    toBlob(node, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: '#ffffff',
      filter: skipExportHiddenNodes,
    }),
  )
  if (!blob) {
    throw new Error('Could not generate an image from the invoice preview.')
  }
  downloadBlob(blob, `${safeFilename(invoiceNumber)}.png`)
}
