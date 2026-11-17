import { formatCurrency } from '../../lib/currency'
import { computeTotals } from '../../lib/calculations'
import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

/** Dashed postcard border with a playful stamp-style total badge in the corner. */
export function PostcardTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor
  const totals = computeTotals(invoice)

  return (
    <InvoicePage font={invoice.theme.font}>
      <div style={{ minHeight: 1123, border: `3px dashed ${accent}`, margin: 16, boxSizing: 'border-box' }}>
        <div style={{ position: 'relative' }}>
          <Movable id="stamp"
            className="absolute right-8 top-8 flex flex-col items-center justify-center rounded-lg text-center"
            style={{ width: 110, height: 110, border: `2px dashed ${accent}`, color: accent, transform: 'rotate(6deg)' }}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest"><Label id="total">Total Due</Label></p>
            <p className="mt-1 text-lg font-black leading-none">{formatCurrency(totals.total, invoice.currency)}</p>
          </Movable>

          <div style={paddingStyle(invoice.theme.padding)} className="pr-40">
            <div className="flex items-center gap-3">
              {invoice.sections.logo && (
                <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor={accent} radius={999} />
              )}
              <Movable id="brand">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
                  Greetings from
                </p>
                <p className="text-2xl font-bold text-slate-900">{invoice.from.name || 'Your Business'}</p>
              </Movable>
            </div>

            <Movable id="meta" as="p" className="mt-6 text-sm text-slate-500">
              <Label id="title">Invoice</Label> <FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText> · <Label id="issueDate">Issued</Label> <EditableDate value={invoice.issueDate} field="issueDate" /> · <Label id="dueDate">Due</Label>{' '}
              <EditableDate value={invoice.dueDate} field="dueDate" />
            </Movable>

            <div className="mt-8 grid grid-cols-2 gap-8">
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
                  label="Dear"
                  party={invoice.to}
                  which="to"
                  labelClassName="text-xs font-semibold uppercase tracking-wider text-slate-400"
                  nameClassName="mt-1 font-semibold text-slate-900"
                  lineClassName="text-sm text-slate-500"
                />
              )}
            </div>

            <div className="mt-8">
              <LineItemsTable
                items={invoice.items}
                currency={invoice.currency}
                columns={invoice.lineItemColumns}
                customColumns={invoice.customColumns}
                className="overflow-hidden rounded-lg"
                headStyle={{ background: `${accent}15` }}
                headCellClassName="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600"
                rowClassName="border-b border-slate-100"
                cellClassName="px-3 py-3 text-sm text-slate-700"
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
              <Movable id="footer" className="mt-10 space-y-3 border-t border-dashed pt-6 text-sm text-slate-500" style={{ borderColor: `${accent}55` }}>
                {invoice.sections.paymentTerms && invoice.paymentTerms && <p><FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText></p>}
                {invoice.sections.bankDetails && invoice.bankDetails && <p><FieldText field="bankDetails">{invoice.bankDetails}</FieldText></p>}
                {invoice.sections.notes && invoice.notes && <p><FieldText field="notes">{invoice.notes}</FieldText></p>}
              </Movable>
            )}

            {invoice.sections.signature && (
              <Signature
                invoice={invoice}
                className="mt-10 grid grid-cols-2 gap-8"
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
