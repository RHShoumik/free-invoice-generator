import { shade } from '../../lib/color'
import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, PartyLine, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

/** Page split into two vertical halves with different background colors. */
export function TwoToneSplitTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor
  const dark = shade(accent, -0.55)

  return (
    <InvoicePage font={invoice.theme.font}>
      <div style={{ display: 'flex', minHeight: 1123 }}>
        <div style={{ width: '38%', background: dark, flexShrink: 0 }} className="flex flex-col justify-between p-8 text-white">
          <div>
            {invoice.sections.logo && (
              <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor="#ffffff" />
            )}
            <Movable id="brand" as="p" className="mt-6 text-3xl font-bold leading-tight">{invoice.from.name || 'Your Business'}</Movable>
            {invoice.sections.from && (
              <Movable id="from" className="mt-4 space-y-1 text-sm text-white/70">
                {invoice.from.address && <p><PartyLine which="from" field="address">{invoice.from.address}</PartyLine></p>}
                {invoice.from.email && <p><PartyLine which="from" field="email">{invoice.from.email}</PartyLine></p>}
                {invoice.from.phone && <p><PartyLine which="from" field="phone">{invoice.from.phone}</PartyLine></p>}
                {invoice.from.taxId && <p>Tax ID: <PartyLine which="from" field="taxId">{invoice.from.taxId}</PartyLine></p>}
              </Movable>
            )}
          </div>

          <Movable id="title">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              <Label id="title">Invoice</Label>
            </p>
            <p className="mt-1 text-lg font-semibold"><FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText></p>
            <p className="mt-3 text-xs text-white/60"><Label id="issueDate">Issued</Label> <EditableDate value={invoice.issueDate} field="issueDate" /></p>
            <p className="text-xs text-white/60"><Label id="dueDate">Due</Label> <EditableDate value={invoice.dueDate} field="dueDate" /></p>
          </Movable>
        </div>

        <div className="flex-1 bg-white" style={paddingStyle(invoice.theme.padding)}>
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

          <div className="mt-8">
            <LineItemsTable
              items={invoice.items}
              currency={invoice.currency}
              columns={invoice.lineItemColumns}
              customColumns={invoice.customColumns}
              headClassName="border-b-2 border-slate-800"
              headCellClassName="py-2 pl-2 text-xs font-semibold uppercase tracking-wider text-slate-500 first:pl-0"
              rowClassName="border-b border-slate-100"
              cellClassName="py-3 pl-2 text-sm text-slate-700 first:pl-0"
            />
          </div>

          <Movable id="totals"
            className="ml-auto mt-6 w-64 rounded-lg p-4 text-white"
            style={{ background: `linear-gradient(135deg, ${accent}, ${dark})` }}
          >
            <Totals
              invoice={invoice}
              rowClassName="flex justify-between py-1 text-sm text-white/80"
              totalRowClassName="mt-2 flex justify-between border-t border-white/30 pt-2 text-base font-bold"
              totalLabelClassName=""
              totalValueClassName="text-xl"
            />
          </Movable>

          {hasFooterContent(invoice) && (
            <Movable id="footer" className="mt-10 space-y-3 border-t border-slate-200 pt-6 text-sm text-slate-500">
              {invoice.sections.paymentTerms && invoice.paymentTerms && <p><FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText></p>}
              {invoice.sections.bankDetails && invoice.bankDetails && <p><FieldText field="bankDetails">{invoice.bankDetails}</FieldText></p>}
              {invoice.sections.notes && invoice.notes && <p><FieldText field="notes">{invoice.notes}</FieldText></p>}
            </Movable>
          )}

          {invoice.sections.signature && (
            <Signature
              invoice={invoice}
              className="mt-10 grid grid-cols-2 gap-6"
              lineClassName="h-px w-full bg-slate-300"
              nameClassName="mt-3 text-sm font-semibold text-slate-900"
              labelClassName="text-xs text-slate-400"
              dateClassName="mt-2 text-xs text-slate-400"
            />
          )}
        </div>
      </div>
    </InvoicePage>
  )
}
