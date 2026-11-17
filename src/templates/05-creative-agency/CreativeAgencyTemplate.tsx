import { shade } from '../../lib/color'
import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

export function CreativeAgencyTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor
  const dark = shade(accent, -0.3)

  return (
    <InvoicePage font={invoice.theme.font}>
      <div style={paddingStyle(invoice.theme.padding)}>
        <div className="flex items-start justify-between">
          {invoice.sections.logo && (
            <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor={accent} />
          )}
          <Movable id="meta" className="text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <p><FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText></p>
            <p className="mt-1">
              <EditableDate value={invoice.issueDate} field="issueDate" /> &rarr; <EditableDate value={invoice.dueDate} field="dueDate" />
            </p>
          </Movable>
        </div>

        <Movable id="title" as="p" className="mt-8 text-7xl font-black leading-none tracking-tighter text-slate-900"><Label id="title">Invoice</Label></Movable>
        <Movable id="brand" as="p" className="mt-3 text-xl font-semibold" style={{ color: accent }}>
          {invoice.from.name || 'Your Business'}
        </Movable>

        <div className="mt-14 grid grid-cols-12 gap-10">
          <div className="col-span-4 space-y-8">
            {invoice.sections.from && (
              <PartyBlock
                label="From"
                party={invoice.from}
                which="from"
                labelClassName="text-xs font-bold uppercase tracking-wider text-slate-400"
                nameClassName="mt-2 font-semibold text-slate-900"
                lineClassName="text-sm text-slate-500"
              />
            )}
            {invoice.sections.to && (
              <PartyBlock
                label="Bill To"
                party={invoice.to}
                which="to"
                labelClassName="text-xs font-bold uppercase tracking-wider text-slate-400"
                nameClassName="mt-2 font-semibold text-slate-900"
                lineClassName="text-sm text-slate-500"
              />
            )}
            {hasFooterContent(invoice) && (
              <Movable id="footer" className="space-y-3 text-xs text-slate-400">
                {invoice.sections.paymentTerms && invoice.paymentTerms && <p><FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText></p>}
                {invoice.sections.bankDetails && invoice.bankDetails && <p><FieldText field="bankDetails">{invoice.bankDetails}</FieldText></p>}
                {invoice.sections.notes && invoice.notes && <p><FieldText field="notes">{invoice.notes}</FieldText></p>}
              </Movable>
            )}
          </div>

          <div className="col-span-8">
            <LineItemsTable
              items={invoice.items}
              currency={invoice.currency}
              columns={invoice.lineItemColumns}
              customColumns={invoice.customColumns}
              headClassName="border-b-2 border-slate-900"
              headCellClassName="pb-2 text-xs font-bold uppercase tracking-wider text-slate-400"
              rowClassName="border-b border-slate-100"
              cellClassName="py-4 text-sm font-medium text-slate-700"
            />

            <Movable id="totals"
              className="mt-8 rounded-2xl p-6 text-white"
              style={{ background: `linear-gradient(135deg, ${accent}, ${dark})` }}
            >
              <Totals
                invoice={invoice}
                rowClassName="flex justify-between py-1 text-sm text-white/80"
                totalRowClassName="mt-3 flex items-end justify-between border-t border-white/30 pt-3"
                totalLabelClassName="text-sm font-medium text-white/80"
                totalValueClassName="text-3xl font-black tracking-tight"
              />
            </Movable>

            {invoice.sections.signature && (
              <Signature
                invoice={invoice}
                className="mt-10 grid grid-cols-2 gap-10"
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
