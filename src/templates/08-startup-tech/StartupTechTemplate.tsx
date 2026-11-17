import { withAlpha } from '../../lib/color'
import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

export function StartupTechTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor

  return (
    <InvoicePage font={invoice.theme.font}>
      <div style={paddingStyle(invoice.theme.padding)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {invoice.sections.logo && (
              <Logo
                logoDataUrl={invoice.logoDataUrl}
                businessName={invoice.from.name}
                accentColor={accent}
                radius={14}
              />
            )}
            <Movable id="brand">
              <p className="text-base font-bold text-slate-900">{invoice.from.name || 'Your Business'}</p>
              <p className="text-sm text-slate-400">{invoice.from.email}</p>
            </Movable>
          </div>
          <Movable id="title" className="text-right">
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs font-bold text-white"
              style={{ background: accent }}
            >
              <FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText>
            </span>
            <p className="mt-2 text-xs text-slate-400">
              <EditableDate value={invoice.issueDate} field="issueDate" /> — <EditableDate value={invoice.dueDate} field="dueDate" />
            </p>
          </Movable>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-5">
          {invoice.sections.from && (
            <Movable id="from" className="rounded-2xl border border-slate-100 p-5 shadow-sm">
              <PartyBlock
                label="From"
                party={invoice.from}
                which="from"
                labelClassName="text-[11px] font-bold uppercase tracking-wider text-slate-400"
                nameClassName="mt-1.5 font-semibold text-slate-900"
                lineClassName="text-sm text-slate-500"
              />
            </Movable>
          )}
          {invoice.sections.to && (
            <Movable id="to" className="rounded-2xl border border-slate-100 p-5 shadow-sm">
              <PartyBlock
                label="Bill To"
                party={invoice.to}
                which="to"
                labelClassName="text-[11px] font-bold uppercase tracking-wider text-slate-400"
                nameClassName="mt-1.5 font-semibold text-slate-900"
                lineClassName="text-sm text-slate-500"
              />
            </Movable>
          )}
        </div>

        <Movable id="items" className="mt-6 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
          <LineItemsTable
            items={invoice.items}
            currency={invoice.currency}
            columns={invoice.lineItemColumns}
            customColumns={invoice.customColumns}
            headClassName="bg-slate-50"
            headCellClassName="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400"
            rowClassName="border-t border-slate-100"
            cellClassName="px-5 py-3.5 text-sm text-slate-700"
          />
        </Movable>

        <Movable id="totals"
          className="ml-auto mt-6 w-72 rounded-2xl p-5 shadow-sm"
          style={{ background: withAlpha(accent, 0.08) }}
        >
          <Totals
            invoice={invoice}
            rowClassName="flex justify-between py-1 text-sm text-slate-500"
            totalRowClassName="mt-2 flex justify-between border-t border-slate-900/10 pt-2 text-lg font-bold"
            totalValueStyle={{ color: accent }}
          />
        </Movable>

        {hasFooterContent(invoice) && (
          <Movable id="footer" className="mt-8 space-y-2 rounded-2xl border border-slate-100 p-5 text-sm text-slate-500 shadow-sm">
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
            className="mt-6 grid grid-cols-2 gap-5 rounded-2xl border border-slate-100 p-5 shadow-sm"
            lineClassName="h-px w-full bg-slate-200"
            nameClassName="mt-3 text-sm font-semibold text-slate-900"
            labelClassName="text-xs text-slate-400"
            dateClassName="mt-2 text-xs text-slate-400"
          />
        )}
      </div>
    </InvoicePage>
  )
}
