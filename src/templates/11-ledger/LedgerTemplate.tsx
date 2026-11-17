import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

/** Ruled "paper ledger" feel: horizontal rules throughout, ledger-green tint. */
export function LedgerTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor

  return (
    <InvoicePage font={invoice.theme.font} background="#f8faf6" color="#1c2b1e">
      <div style={paddingStyle(invoice.theme.padding)}>
        <div className="flex items-end justify-between border-b-4 pb-4" style={{ borderColor: accent }}>
          <div className="flex items-center gap-3">
            {invoice.sections.logo && (
              <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor={accent} radius={4} />
            )}
            <Movable id="brand">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: accent }}>
                Ledger
              </p>
              <p className="text-lg font-semibold">{invoice.from.name || 'Your Business'}</p>
            </Movable>
          </div>
          <Movable id="title" className="text-right text-sm">
            <p className="font-semibold"><Label id="invoiceNumber">No.</Label> <FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText></p>
            <p className="text-xs opacity-70">
              <EditableDate value={invoice.issueDate} field="issueDate" /> – <EditableDate value={invoice.dueDate} field="dueDate" />
            </p>
          </Movable>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-8 border-b border-dashed pb-6" style={{ borderColor: `${accent}55` }}>
          {invoice.sections.from && (
            <PartyBlock
              label="Account holder"
              party={invoice.from}
              which="from"
              labelClassName="text-[10px] font-semibold uppercase tracking-widest opacity-60"
              nameClassName="mt-1 font-semibold"
              lineClassName="text-sm opacity-80"
            />
          )}
          {invoice.sections.to && (
            <PartyBlock
              label="Billed party"
              party={invoice.to}
              which="to"
              labelClassName="text-[10px] font-semibold uppercase tracking-widest opacity-60"
              nameClassName="mt-1 font-semibold"
              lineClassName="text-sm opacity-80"
            />
          )}
        </div>

        <div className="mt-8">
          <LineItemsTable
            items={invoice.items}
            currency={invoice.currency}
            columns={invoice.lineItemColumns}
            customColumns={invoice.customColumns}
            headClassName="border-b-2"
            headStyle={{ borderColor: accent }}
            headCellClassName="py-2 text-[11px] font-semibold uppercase tracking-widest opacity-60"
            rowClassName="border-b border-dashed"
            cellClassName="py-3 text-sm"
          />
        </div>

        <Movable id="totals" className="ml-auto mt-6 w-72 border-t-4 pt-4" style={{ borderColor: accent }}>
          <Totals
            invoice={invoice}
            rowClassName="flex justify-between py-1 text-sm opacity-80"
            totalRowClassName="mt-2 flex justify-between border-t border-dashed pt-2 text-base font-bold"
            totalRowStyle={{ borderColor: `${accent}55` }}
            totalValueStyle={{ color: accent }}
          />
        </Movable>

        {hasFooterContent(invoice) && (
          <Movable id="footer" className="mt-12 space-y-2 border-t border-dashed pt-4 text-sm opacity-70" style={{ borderColor: `${accent}55` }}>
            {invoice.sections.paymentTerms && invoice.paymentTerms && <p><FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText></p>}
            {invoice.sections.bankDetails && invoice.bankDetails && <p><FieldText field="bankDetails">{invoice.bankDetails}</FieldText></p>}
            {invoice.sections.notes && invoice.notes && <p><FieldText field="notes">{invoice.notes}</FieldText></p>}
          </Movable>
        )}

        {invoice.sections.signature && (
          <Signature
            invoice={invoice}
            className="mt-12 grid grid-cols-2 gap-10"
            lineClassName="h-px w-full"
            lineStyle={{ background: accent }}
            nameClassName="mt-3 text-sm font-semibold"
            labelClassName="text-xs opacity-60"
            dateClassName="mt-2 text-xs opacity-60"
          />
        )}
      </div>
    </InvoicePage>
  )
}
