import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

export function ModernMinimalTemplate({ invoice }: InvoiceTemplateProps) {
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
                size={40}
                accentColor={accent}
              />
            )}
            <Movable id="brand" as="p" className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              {invoice.from.name || 'Your Business'}
            </Movable>
          </div>
          <Movable id="number" as="p" className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            <FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText>
          </Movable>
        </div>

        <Movable id="title" as="p" className="mt-10 text-5xl font-light tracking-tight text-slate-900">
          <Label id="title">Invoice</Label>
        </Movable>

        <Movable id="meta" className="mt-3 flex gap-10 text-xs text-slate-400">
          <span>
            <Label id="issueDate">Issued</Label> <span className="text-slate-600"><EditableDate value={invoice.issueDate} field="issueDate" /></span>
          </span>
          <span>
            <Label id="dueDate">Due</Label> <span className="text-slate-600"><EditableDate value={invoice.dueDate} field="dueDate" /></span>
          </span>
        </Movable>

        <div className="mt-12 grid grid-cols-2 gap-10 border-t border-slate-200 pt-8">
          {invoice.sections.from && (
            <PartyBlock
              label="From"
              party={invoice.from}
              which="from"
              labelClassName="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400"
              nameClassName="mt-2 text-sm font-medium text-slate-900"
              lineClassName="text-xs text-slate-500 mt-0.5"
            />
          )}
          {invoice.sections.to && (
            <PartyBlock
              label="Billed to"
              party={invoice.to}
              which="to"
              labelClassName="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400"
              nameClassName="mt-2 text-sm font-medium text-slate-900"
              lineClassName="text-xs text-slate-500 mt-0.5"
            />
          )}
        </div>

        <div className="mt-12">
          <LineItemsTable
            items={invoice.items}
            currency={invoice.currency}
            columns={invoice.lineItemColumns}
            customColumns={invoice.customColumns}
            headClassName="border-b border-slate-900"
            headCellClassName="pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400"
            rowClassName="border-b border-slate-100"
            cellClassName="py-4 text-sm text-slate-700"
          />
        </div>

        <div className="ml-auto mt-8 w-72">
          <Totals
            invoice={invoice}
            rowClassName="flex justify-between py-1.5 text-xs text-slate-400"
            totalRowClassName="mt-3 flex justify-between pt-3 text-lg font-medium"
            totalValueStyle={{ color: accent }}
          />
        </div>

        {hasFooterContent(invoice) && (
          <Movable id="footer" className="mt-20 space-y-2 text-xs text-slate-400">
            {invoice.sections.paymentTerms && invoice.paymentTerms && <p><FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText></p>}
            {invoice.sections.bankDetails && invoice.bankDetails && <p><FieldText field="bankDetails">{invoice.bankDetails}</FieldText></p>}
            {invoice.sections.notes && invoice.notes && <p><FieldText field="notes">{invoice.notes}</FieldText></p>}
          </Movable>
        )}

        {invoice.sections.signature && (
          <Signature
            invoice={invoice}
            className="mt-20 grid grid-cols-2 gap-10"
            lineClassName="h-px w-full bg-slate-200"
            nameClassName="mt-3 text-sm font-medium text-slate-900"
            labelClassName="text-[10px] uppercase tracking-[0.2em] text-slate-400"
            dateClassName="mt-2 text-xs text-slate-400"
          />
        )}
      </div>
    </InvoicePage>
  )
}
