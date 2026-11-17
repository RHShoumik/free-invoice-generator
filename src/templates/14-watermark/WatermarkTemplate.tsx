import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { useCanvasEdit } from '../shared/CanvasEditContext'
import { EditableDate, FieldText, InlineText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'
import {
  WATERMARK_DEFAULT_OPACITY,
  WATERMARK_IMAGE_DEFAULT_OPACITY,
  WATERMARK_IMAGE_WIDTH,
  defaultWatermarkText,
  watermarkFontSize,
} from './watermark'

/**
 * A large faint background watermark behind a clean modern foreground. The
 * watermark is a real element, not decoration: give it your own text ("PAID",
 * "DRAFT", your name…) or an image (a logo, a stamp), then move, resize,
 * recolor (text) and fade it from the style bar like anything else. Left alone
 * it's the business name's first letter, as this design always showed; clear
 * the text to remove it. An image replaces the text while it's set.
 */
export function WatermarkTemplate({ invoice }: InvoiceTemplateProps) {
  const edit = useCanvasEdit()
  const accent = invoice.theme.accentColor
  const text = invoice.watermarkText ?? defaultWatermarkText(invoice.from.name)
  const image = invoice.watermarkImage

  return (
    <InvoicePage font={invoice.theme.font}>
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: 1123 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* Faintness is `opacity`, not a translucent color, so any color the user picks stays faint too.
              When emptied, it shrinks to a visible placeholder so it can still be clicked (that
              placeholder is export-hidden, so a removed watermark leaves nothing in the file). */}
          <Movable
            id="watermark"
            style={{
              color: accent,
              fontWeight: 800,
              lineHeight: 1,
              fontSize: text ? watermarkFontSize(text) : 56,
              opacity: image ? WATERMARK_IMAGE_DEFAULT_OPACITY : text ? WATERMARK_DEFAULT_OPACITY : 0.35,
              transformOrigin: 'center',
              pointerEvents: edit ? 'auto' : 'none',
            }}
          >
            {image ? (
              <img
                src={image}
                alt="Watermark"
                draggable={false}
                style={{ display: 'block', width: WATERMARK_IMAGE_WIDTH, maxHeight: 640, objectFit: 'contain' }}
              />
            ) : (
              <InlineText
                value={text}
                onChange={(v) => edit?.updateField('watermarkText', v)}
                placeholder="Type a watermark"
                readOnly={!edit}
                hideWhenEmptyOnExport
                ariaLabel="Watermark"
              />
            )}
          </Movable>
        </div>

        <div style={{ position: 'relative' }} className="p-0">
          <div style={paddingStyle(invoice.theme.padding)}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {invoice.sections.logo && (
                  <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor={accent} />
                )}
                <Movable id="brand">
                  <p className="text-lg font-semibold text-slate-900">{invoice.from.name || 'Your Business'}</p>
                  <p className="text-sm text-slate-500">{invoice.from.email}</p>
                </Movable>
              </div>
              <Movable id="title" className="text-right">
                <p className="text-3xl font-bold uppercase tracking-wide" style={{ color: accent }}>
                  <Label id="title">Invoice</Label>
                </p>
                <p className="mt-1 text-sm text-slate-500"><FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText></p>
                <p className="text-xs text-slate-400">
                  <EditableDate value={invoice.issueDate} field="issueDate" /> – <EditableDate value={invoice.dueDate} field="dueDate" />
                </p>
              </Movable>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-8">
              {invoice.sections.from && (
                <PartyBlock
                  label="From"
                  party={invoice.from}
                  which="from"
                  labelClassName="text-xs font-semibold uppercase tracking-wider text-slate-400"
                  nameClassName="mt-1 font-semibold text-slate-900"
                  lineClassName="text-sm text-slate-500"
                />
              )}
              {invoice.sections.to && (
                <PartyBlock
                  label="Bill To"
                  party={invoice.to}
                  which="to"
                  labelClassName="text-xs font-semibold uppercase tracking-wider text-slate-400"
                  nameClassName="mt-1 font-semibold text-slate-900"
                  lineClassName="text-sm text-slate-500"
                />
              )}
            </div>

            <div className="mt-10">
              <LineItemsTable
                items={invoice.items}
                currency={invoice.currency}
                columns={invoice.lineItemColumns}
                customColumns={invoice.customColumns}
                headClassName="border-b-2 border-slate-800"
                headCellClassName="py-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
                rowClassName="border-b border-slate-100"
                cellClassName="py-3 text-sm text-slate-700"
              />
            </div>

            <div className="ml-auto mt-6 w-72">
              <Totals
                invoice={invoice}
                rowClassName="flex justify-between py-1 text-sm text-slate-600"
                totalRowClassName="mt-2 flex justify-between border-t-2 pt-2 text-base font-bold text-slate-900"
                totalRowStyle={{ borderColor: accent }}
              />
            </div>

            {hasFooterContent(invoice) && (
              <Movable id="footer" className="mt-14 space-y-3 border-t border-slate-200 pt-6 text-sm text-slate-500">
                {invoice.sections.paymentTerms && invoice.paymentTerms && <p><FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText></p>}
                {invoice.sections.bankDetails && invoice.bankDetails && <p><FieldText field="bankDetails">{invoice.bankDetails}</FieldText></p>}
                {invoice.sections.notes && invoice.notes && <p><FieldText field="notes">{invoice.notes}</FieldText></p>}
              </Movable>
            )}

            {invoice.sections.signature && (
              <Signature
                invoice={invoice}
                className="mt-16 grid grid-cols-2 gap-10"
                lineClassName="h-px w-full bg-slate-300"
                nameClassName="mt-3 text-sm font-semibold text-slate-900"
                labelClassName="text-xs text-slate-400"
                dateClassName="mt-2 text-xs text-slate-400"
              />
            )}
          </div>
        </div>
      </div>
    </InvoicePage>
  )
}
