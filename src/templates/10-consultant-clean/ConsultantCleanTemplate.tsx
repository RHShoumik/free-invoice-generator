import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, PartyLine, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

const LETTERHEAD_FONT = "'DM Serif Display', Georgia, serif"

export function ConsultantCleanTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor

  return (
    <InvoicePage font={invoice.theme.font}>
      <div style={paddingStyle(invoice.theme.padding)}>
        <div className="flex items-center gap-4">
          {invoice.sections.logo && invoice.logoDataUrl && (
            <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor={accent} />
          )}
          <Movable id="brand">
            <p className="text-3xl" style={{ fontFamily: LETTERHEAD_FONT }}>
              {invoice.from.name || 'Your Business'}
            </p>
            {invoice.sections.from && (
              <p className="mt-1 text-sm text-slate-500">
                {(['address', 'email', 'phone'] as const)
                  .filter((field) => invoice.from[field])
                  .map((field, i) => (
                    <span key={field}>
                      {i > 0 && ' · '}
                      <PartyLine which="from" field={field}>{invoice.from[field]}</PartyLine>
                    </span>
                  ))}
              </p>
            )}
          </Movable>
        </div>

        <Movable id="title" className="mt-10 text-sm">
          <p className="font-semibold uppercase tracking-wider" style={{ color: accent }}>
            <Label id="title">Invoice</Label> <FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText>
          </p>
          <p className="mt-1 text-slate-500"><Label id="issueDate">Issued</Label> <EditableDate value={invoice.issueDate} field="issueDate" /></p>
          <p className="text-slate-500"><Label id="dueDate">Due</Label> <EditableDate value={invoice.dueDate} field="dueDate" /></p>
        </Movable>

        {invoice.sections.to && (
          <div className="mt-10">
            <PartyBlock
              label="To"
              party={invoice.to}
              which="to"
              labelClassName="text-xs font-semibold uppercase tracking-wider text-slate-400"
              nameClassName="mt-1 font-semibold text-slate-900"
              lineClassName="text-sm text-slate-500"
            />
          </div>
        )}

        <div className="mt-10">
          <LineItemsTable
            items={invoice.items}
            currency={invoice.currency}
            columns={invoice.lineItemColumns}
            customColumns={invoice.customColumns}
            headClassName="border-b border-slate-300"
            headCellClassName="pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
            rowClassName="border-b border-slate-100"
            cellClassName="py-3.5 text-sm text-slate-700"
          />
        </div>

        <div className="ml-auto mt-6 w-72">
          <Totals
            invoice={invoice}
            rowClassName="flex justify-between py-1 text-sm text-slate-500"
            totalRowClassName="mt-2 flex justify-between border-t pt-2 text-base font-semibold text-slate-900"
            totalRowStyle={{ borderColor: accent }}
          />
        </div>

        {hasFooterContent(invoice) && (
          <Movable id="footer" className="mt-16 space-y-3 border-t border-slate-200 pt-6 text-sm text-slate-500">
            {invoice.sections.paymentTerms && invoice.paymentTerms && <p><FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText></p>}
            {invoice.sections.bankDetails && invoice.bankDetails && <p><FieldText field="bankDetails">{invoice.bankDetails}</FieldText></p>}
            {invoice.sections.notes && invoice.notes && <p><FieldText field="notes">{invoice.notes}</FieldText></p>}
          </Movable>
        )}

        {invoice.sections.signature && (
          <Signature
            invoice={invoice}
            className="mt-16 grid grid-cols-2 gap-10"
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
