import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

export function MinimalMonoTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor

  return (
    <InvoicePage font={invoice.theme.font}>
      <div style={paddingStyle(invoice.theme.padding)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {invoice.sections.logo && (
              <Logo
                logoDataUrl={invoice.logoDataUrl}
                businessName={invoice.from.name}
                accentColor={accent}
                radius={4}
              />
            )}
            <Movable id="brand" as="p" className="text-sm font-semibold text-slate-900">{invoice.from.name || 'your-business'}</Movable>
          </div>
          <Movable id="number" as="p" className="text-sm" style={{ color: accent }}>
            <Label id="invoiceNumber">#</Label><FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText>
          </Movable>
        </div>

        <Movable id="title" as="p" className="mt-10 text-sm" style={{ color: accent }}>
          <Label id="title">// invoice</Label>
        </Movable>
        <Movable id="headline" as="p" className="mt-1 text-4xl font-bold tracking-tight text-slate-900">{`{ status: "due" }`}</Movable>

        <Movable id="meta" className="mt-8 rounded border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed">
          <p>
            <span style={{ color: accent }}><Label id="issueDate">issued</Label></span>: <EditableDate value={invoice.issueDate} field="issueDate" />
          </p>
          <p>
            <span style={{ color: accent }}><Label id="dueDate">due</Label></span>: <EditableDate value={invoice.dueDate} field="dueDate" />
          </p>
          <p>
            <span style={{ color: accent }}>currency</span>: {invoice.currency}
          </p>
        </Movable>

        <div className="mt-10 grid grid-cols-2 gap-8 text-sm">
          {invoice.sections.from && (
            <PartyBlock
              label="// from"
              party={invoice.from}
              which="from"
              labelClassName="font-semibold"
              nameClassName="mt-2 font-semibold text-slate-900"
              lineClassName="text-slate-500"
            />
          )}
          {invoice.sections.to && (
            <PartyBlock
              label="// bill_to"
              party={invoice.to}
              which="to"
              labelClassName="font-semibold"
              nameClassName="mt-2 font-semibold text-slate-900"
              lineClassName="text-slate-500"
            />
          )}
        </div>

        <div className="mt-10">
          <LineItemsTable
            items={invoice.items}
            currency={invoice.currency}
            columns={invoice.lineItemColumns}
            customColumns={invoice.customColumns}
            headClassName="border-b border-t border-slate-900"
            headCellClassName="py-2 text-xs uppercase text-slate-500"
            rowClassName="border-b border-dashed border-slate-200"
            cellClassName="py-3 text-sm text-slate-700"
          />
        </div>

        <div className="ml-auto mt-6 w-72 text-sm">
          <Totals
            invoice={invoice}
            rowClassName="flex justify-between py-1 text-slate-500"
            totalRowClassName="mt-2 flex justify-between border-t-2 border-slate-900 pt-2 text-base font-bold text-slate-900"
            totalLabelClassName=""
            totalValueStyle={{ color: accent }}
          />
        </div>

        {hasFooterContent(invoice) && (
          <Movable id="footer" className="mt-14 space-y-2 border-t border-dashed border-slate-300 pt-6 text-sm text-slate-500">
            <p style={{ color: accent }}>/* notes */</p>
            {invoice.sections.paymentTerms && invoice.paymentTerms && <p><FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText></p>}
            {invoice.sections.bankDetails && invoice.bankDetails && <p><FieldText field="bankDetails">{invoice.bankDetails}</FieldText></p>}
            {invoice.sections.notes && invoice.notes && <p><FieldText field="notes">{invoice.notes}</FieldText></p>}
          </Movable>
        )}

        {invoice.sections.signature && (
          <Movable id="signature" className="mt-14">
            <p style={{ color: accent }}>{'// signatures'}</p>
            <Signature
              invoice={invoice}
              className="mt-4 grid grid-cols-2 gap-8"
              lineClassName="w-full border-t border-dashed border-slate-400"
              nameClassName="mt-3 font-semibold text-slate-900"
              labelClassName="text-slate-500"
              dateClassName="mt-2 text-slate-500"
            />
          </Movable>
        )}
      </div>
    </InvoicePage>
  )
}
