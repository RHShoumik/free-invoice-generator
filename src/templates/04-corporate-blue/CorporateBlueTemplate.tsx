import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

export function CorporateBlueTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor

  return (
    <InvoicePage font={invoice.theme.font}>
      <div style={{ height: 10, background: accent }} />
      <div style={paddingStyle(invoice.theme.padding)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {invoice.sections.logo && (
              <Logo
                logoDataUrl={invoice.logoDataUrl}
                businessName={invoice.from.name}
                accentColor={accent}
                radius={4}
              />
            )}
            <Movable id="brand">
              <p className="text-lg font-bold text-slate-900">{invoice.from.name || 'Your Business'}</p>
              <p className="text-sm text-slate-500">{invoice.from.email}</p>
              <p className="text-sm text-slate-500">{invoice.from.phone}</p>
            </Movable>
          </div>
          <Movable id="title" className="rounded border border-slate-200 px-5 py-3 text-right text-sm">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
              <Label id="title">Invoice</Label>
            </p>
            <p className="mt-1 text-slate-700"><FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText></p>
            <p className="mt-1 text-slate-500"><Label id="issueDate">Issued</Label> <EditableDate value={invoice.issueDate} field="issueDate" /></p>
            <p className="text-slate-500"><Label id="dueDate">Due</Label> <EditableDate value={invoice.dueDate} field="dueDate" /></p>
          </Movable>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">
          {invoice.sections.from && (
            <Movable id="from" className="rounded border border-slate-200 p-4">
              <PartyBlock
                label="From"
                party={invoice.from}
                which="from"
                labelClassName="text-xs font-bold uppercase tracking-wider text-slate-400"
                nameClassName="mt-1 font-semibold text-slate-900"
                lineClassName="text-sm text-slate-500"
              />
            </Movable>
          )}
          {invoice.sections.to && (
            <Movable id="to" className="rounded border border-slate-200 p-4">
              <PartyBlock
                label="Bill To"
                party={invoice.to}
                which="to"
                labelClassName="text-xs font-bold uppercase tracking-wider text-slate-400"
                nameClassName="mt-1 font-semibold text-slate-900"
                lineClassName="text-sm text-slate-500"
              />
            </Movable>
          )}
        </div>

        <Movable id="items" className="mt-8 overflow-hidden rounded border border-slate-200">
          <LineItemsTable
            items={invoice.items}
            currency={invoice.currency}
            columns={invoice.lineItemColumns}
            customColumns={invoice.customColumns}
            headStyle={{ background: accent }}
            headCellClassName="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white"
            rowClassName="border-b border-slate-100"
            cellClassName="px-4 py-3 text-sm text-slate-700"
          />
        </Movable>

        <Movable id="totals" className="ml-auto mt-6 w-72 rounded border border-slate-200 p-4">
          <Totals
            invoice={invoice}
            rowClassName="flex justify-between py-1 text-sm text-slate-600"
            totalRowClassName="mt-2 flex justify-between border-t-2 pt-2 text-base font-bold text-slate-900"
            totalRowStyle={{ borderColor: accent }}
          />
        </Movable>

        {hasFooterContent(invoice) && (
          <Movable id="footer" className="mt-12 space-y-3 rounded border border-slate-200 p-4 text-sm text-slate-500">
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
            className="mt-10 grid grid-cols-2 gap-6 rounded border border-slate-200 p-4"
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
