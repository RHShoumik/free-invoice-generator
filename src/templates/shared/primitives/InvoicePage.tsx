import type { ReactNode } from 'react'
import { fontStack } from '../../../types/invoice'
import type { FontId } from '../../../types/invoice'

interface InvoicePageProps {
  font: FontId
  background?: string
  color?: string
  children: ReactNode
}

/**
 * Every template renders its content inside this. It fixes the page to an
 * A4-proportioned width (794px @ 96dpi) so all 10 designs export at a
 * consistent, predictable size — the export pipeline captures whatever
 * this renders to at full resolution, so preview === download.
 */
export function InvoicePage({ font, background = '#ffffff', color = '#0f172a', children }: InvoicePageProps) {
  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        background,
        color,
        fontFamily: fontStack(font),
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  )
}
