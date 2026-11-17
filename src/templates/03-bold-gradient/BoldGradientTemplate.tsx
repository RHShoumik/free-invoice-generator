import { shade } from '../../lib/color'
import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

export function BoldGradientTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor
  const dark = shade(accent, -0.35)

  return (
    <InvoicePage font={invoice.theme.font}>
      <div
        className="flex items-center justify-between px-14 py-12"
        style={{ background: `linear-gradient(135deg, ${accent}, ${dark})` }}
      >
        <div className="flex items-center gap-4">
          {invoice.sections.logo && (
            <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor="#ffffff" />
          )}
          <Movable id="brand">
            <p className="text-lg font-semibold text-white">{invoice.from.name || 'Your Business'}</p>
            <p className="text-sm text-white/80">{invoice.from.email}</p>
          </Movable>
        </div>
        <Movable id="title" className="text-right">
          <p className="text-3xl font-bold uppercase tracking-wide text-white"><Label id="title">Invoice</Label></p>
          <p className="mt-1 text-sm text-white/80"><FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText></p>
        </Movable>
      </div>

      <div style={paddingStyle(invoice.theme.padding)}>
        <Movable id="meta" className="flex gap-10 text-sm text-slate-500">
          <span>
            <Label id="issueDate">Issued</Label> <span className="font-medium text-slate-800"><EditableDate value={invoice.issueDate} field="issueDate" /></span>
          </span>
          <span>
            <Label id="dueDate">Due</Label> <span className="font-medium text-slate-800"><EditableDate value={invoice.dueDate} field="dueDate" /></span>
          </span>
        </Movable>

        <div className="mt-8 grid grid-cols-2 gap-8">
          {invoice.sections.from && (
            <PartyBlock
              label="From"
              party={invoice.from}
              which="from"
              labelClassName="text-xs font-semibold uppercase tracking-wider"
              nameClassName="mt-1 font-semibold text-slate-900"
              lineClassName="text-sm text-slate-500"
            />
          )}
          {invoice.sections.to && (
            <PartyBlock
              label="Bill To"
              party={invoice.to}
              which="to"
              labelClassName="text-xs font-semibold uppercase tracking-wider"
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
            className="overflow-hidden rounded-lg"
            headStyle={{ background: withOpacity(accent) }}
            headCellClassName="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-700"
            rowClassName="border-b border-slate-100"
            cellClassName="px-4 py-3 text-sm text-slate-700"
          />
        </div>

        <div className="ml-auto mt-6 w-72">
          <Totals
            invoice={invoice}
            rowClassName="flex justify-between py-1 text-sm text-slate-600"
            totalRowClassName="mt-2 flex justify-between rounded-lg px-4 py-3 text-base font-bold text-white"
            totalRowStyle={{ background: `linear-gradient(135deg, ${accent}, ${dark})` }}
          />
        </div>

        {hasFooterContent(invoice) && (
          <Movable id="footer" className="mt-14 space-y-3 border-t border-slate-200 pt-6 text-sm text-slate-500">
            {invoice.sections.paymentTerms && invoice.paymentTerms && (
              <p>
                <span className="font-semibold text-slate-700"><Label id="paymentTerms">Payment Terms</Label>: </span>
                <FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText>
              </p>
            )}
            {invoice.sections.bankDetails && invoice.bankDetails && (
              <p>
                <span className="font-semibold text-slate-700"><Label id="bankDetails">Bank Details</Label>: </span>
                <FieldText field="bankDetails">{invoice.bankDetails}</FieldText>
              </p>
            )}
            {invoice.sections.notes && invoice.notes && <p><FieldText field="notes">{invoice.notes}</FieldText></p>}
          </Movable>
        )}

        {invoice.sections.signature && (
          <Signature
            invoice={invoice}
            className="mt-14 grid grid-cols-2 gap-10"
            lineClassName="h-px w-full bg-slate-300"
            nameClassName="mt-3 text-sm font-semibold text-slate-900"
            labelClassName="text-xs text-slate-400"
            dateClassName="mt-2 text-xs text-slate-400"
          />
        )}
      </div>
    </InvoicePage>
  )
}

function withOpacity(hex: string): string {
  return `${hex}1f`
}
