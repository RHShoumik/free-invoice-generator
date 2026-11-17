import { toJpeg } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { skipExportHiddenNodes } from './skipExportHiddenNodes'
import { whileExporting } from './whileExporting'
import { safeFilename } from './downloadFile'

const PX_TO_MM = 25.4 / 96

/**
 * One-click, rasterized PDF export (per product decision): captures the live
 * preview node at high resolution and embeds it as a single PDF page sized to
 * match the node's actual on-screen dimensions. Text isn't selectable, but
 * the PDF is pixel-identical to whichever of the 10 templates is on screen,
 * and — unlike the browser print dialog — downloads in one click.
 *
 * JPEG (not PNG) on purpose: jsPDF re-embeds PNG image data uncompressed,
 * which turned a single invoice page into a 20MB+ file. The page never needs
 * transparency, so a high-quality JPEG keeps output in the hundreds-of-KB
 * range without a visible quality loss.
 *
 * Known limitation: very long invoices (many line items) produce one tall
 * page rather than paginating across multiple A4 pages.
 */
export async function exportToPdf(node: HTMLElement, invoiceNumber: string): Promise<void> {
  const dataUrl = await whileExporting(node, () =>
    toJpeg(node, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: '#ffffff',
      quality: 0.92,
      filter: skipExportHiddenNodes,
    }),
  )

  const { width, height } = node.getBoundingClientRect()
  const widthMm = width * PX_TO_MM
  const heightMm = height * PX_TO_MM

  const pdf = new jsPDF({
    unit: 'mm',
    format: [widthMm, heightMm],
    orientation: widthMm > heightMm ? 'landscape' : 'portrait',
  })
  pdf.addImage(dataUrl, 'JPEG', 0, 0, widthMm, heightMm, undefined, 'MEDIUM')
  pdf.save(`${safeFilename(invoiceNumber)}.pdf`)
}
