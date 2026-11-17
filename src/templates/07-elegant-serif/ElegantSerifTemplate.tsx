import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

export function ElegantSerifTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor

  return (
    <InvoicePage font={invoice.theme.font} background="#fbf7ef" color="#2a2a28">
      <div style={paddingStyle(invoice.theme.padding)}>
        <div className="flex flex-col items-center text-center">
          {invoice.sections.logo && invoice.logoDataUrl && (
            <div className="mb-4">
              <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor={accent} />
            </div>
          )}
          <Movable id="title" as="p" className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: accent }}>
            <Label id="title">Invoice</Label>
          </Movable>
          <Movable id="brand" as="p" className="mt-3 text-4xl">{invoice.from.name || 'Your Business'}</Movable>
          <div className="mt-4 h-px w-16" style={{ background: accent }} />
          <Movable id="meta" className="mt-6 flex justify-center gap-8 text-sm text-neutral-500">
            <span><Label id="invoiceNumber">No.</Label> <FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText></span>
            <span><Label id="issueDate">Issued</Label> <EditableDate value={invoice.issueDate} field="issueDate" /></span>
            <span><Label id="dueDate">Due</Label> <EditableDate value={invoice.dueDate} field="dueDate" /></span>
          </Movable>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-12">
          {invoice.sections.from && (
            <PartyBlock
              label="From"
              party={invoice.from}
              which="from"
              labelClassName="text-xs font-semibold uppercase tracking-[0.25em]"
              nameClassName="mt-2 text-lg"
              lineClassName="text-sm text-neutral-500"
            />
          )}
          {invoice.sections.to && (
            <PartyBlock
              label="Billed to"
              party={invoice.to}
              which="to"
              labelClassName="text-xs font-semibold uppercase tracking-[0.25em]"
              nameClassName="mt-2 text-lg"
              lineClassName="text-sm text-neutral-500"
            />
          )}
        </div>

        <div className="mt-12">
          <LineItemsTable
            items={invoice.items}
            currency={invoice.currency}
            columns={invoice.lineItemColumns}
            customColumns={invoice.customColumns}
            headStyle={{ borderBottom: `1px solid ${accent}` }}
            headCellClassName="pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500"
            rowClassName="border-b border-neutral-200"
            cellClassName="py-4 text-sm text-neutral-700"
          />
        </div>

        <div className="ml-auto mt-8 w-72">
          <Totals
            invoice={invoice}
            rowClassName="flex justify-between py-1.5 text-sm text-neutral-500"
            totalRowClassName="mt-3 flex justify-between pt-3 text-xl"
            totalRowStyle={{ borderTop: `1px solid ${accent}` }}
            totalValueStyle={{ color: accent }}
          />
        </div>

        {hasFooterContent(invoice) && (
          <Movable id="footer" className="mt-16 space-y-2 border-t border-neutral-200 pt-6 text-center text-sm italic text-neutral-500">
            {invoice.sections.paymentTerms && invoice.paymentTerms && <p><FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText></p>}
            {invoice.sections.bankDetails && invoice.bankDetails && <p><FieldText field="bankDetails">{invoice.bankDetails}</FieldText></p>}
            {invoice.sections.notes && invoice.notes && <p><FieldText field="notes">{invoice.notes}</FieldText></p>}
          </Movable>
        )}

        {invoice.sections.signature && (
          <Signature
            invoice={invoice}
            className="mt-16 grid grid-cols-2 gap-16 text-center"
            columnClassName="flex flex-col items-center"
            lineClassName="h-px w-40"
            lineStyle={{ background: accent }}
            nameClassName="mt-3 text-base"
            labelClassName="text-xs uppercase tracking-[0.2em] text-neutral-500"
            dateClassName="mt-2 text-xs text-neutral-500"
          />
        )}
      </div>
    </InvoicePage>
  )
}
