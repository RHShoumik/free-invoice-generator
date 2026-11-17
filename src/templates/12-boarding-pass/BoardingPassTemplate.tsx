import type { ReactNode } from 'react'
import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

function Field({ label, value, accent }: { label: ReactNode; value: ReactNode; accent: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  )
}

/** Ticket-stub layout with a perforated divider between the "pass" and the stub. */
export function BoardingPassTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor

  return (
    <InvoicePage font={invoice.theme.font}>
      <div style={paddingStyle(invoice.theme.padding)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {invoice.sections.logo && (
              <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor={accent} radius={4} />
            )}
            <Movable id="brand" as="p" className="text-lg font-bold text-slate-900">{invoice.from.name || 'Your Business'}</Movable>
          </div>
          <Movable id="title" as="p" className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: accent }}>
            <Label id="title">Invoice Pass</Label>
          </Movable>
        </div>

        <Movable id="meta" className="mt-6 grid grid-cols-4 gap-4 rounded-t-xl p-5" style={{ background: `${accent}12` }}>
          <Field label={<Label id="invoiceNumber">Invoice No</Label>} value={<FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText>} accent={accent} />
          <Field label={<Label id="issueDate">Issued</Label>} value={<EditableDate value={invoice.issueDate} field="issueDate" />} accent={accent} />
          <Field label={<Label id="dueDate">Due</Label>} value={<EditableDate value={invoice.dueDate} field="dueDate" />} accent={accent} />
          <Field label="Currency" value={invoice.currency} accent={accent} />
        </Movable>

        <div className="grid grid-cols-2 gap-4 border-x px-5 py-5" style={{ borderColor: `${accent}30` }}>
          {invoice.sections.from && (
            <PartyBlock
              label="From"
              party={invoice.from}
              which="from"
              labelClassName="text-[10px] font-bold uppercase tracking-widest text-slate-400"
              nameClassName="mt-1 font-semibold text-slate-900"
              lineClassName="text-sm text-slate-500"
            />
          )}
          {invoice.sections.to && (
            <PartyBlock
              label="Passenger / Bill To"
              party={invoice.to}
              which="to"
              labelClassName="text-[10px] font-bold uppercase tracking-widest text-slate-400"
              nameClassName="mt-1 font-semibold text-slate-900"
              lineClassName="text-sm text-slate-500"
            />
          )}
        </div>

        <div className="border-x px-5 pb-5" style={{ borderColor: `${accent}30` }}>
          <LineItemsTable
            items={invoice.items}
            currency={invoice.currency}
            columns={invoice.lineItemColumns}
            customColumns={invoice.customColumns}
            headClassName="border-b-2 border-slate-800"
            headCellClassName="py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500"
            rowClassName="border-b border-slate-100"
            cellClassName="py-3 text-sm text-slate-700"
          />
        </div>

        {/* Perforated divider */}
        <div className="relative border-x" style={{ borderColor: `${accent}30` }}>
          <div className="border-t-2 border-dashed" style={{ borderColor: accent }} />
          <div
            className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-white"
            style={{ border: `2px solid ${accent}30` }}
          />
          <div
            className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-white"
            style={{ border: `2px solid ${accent}30` }}
          />
        </div>

        <div
          className="flex items-center justify-between rounded-b-xl border-x border-b p-5"
          style={{ borderColor: `${accent}30`, background: `${accent}12` }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>
              Stub · <FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText>
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">{invoice.to.name || 'Client'}</p>
          </div>
          <div className="w-56">
            <Totals
              invoice={invoice}
              rowClassName="flex justify-between py-0.5 text-xs text-slate-500"
              totalRowClassName="mt-1 flex justify-between pt-1 text-lg font-bold text-slate-900"
              totalValueStyle={{ color: accent }}
            />
          </div>
        </div>

        {hasFooterContent(invoice) && (
          <Movable id="footer" className="mt-8 space-y-2 text-sm text-slate-500">
            {invoice.sections.paymentTerms && invoice.paymentTerms && <p><FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText></p>}
            {invoice.sections.bankDetails && invoice.bankDetails && <p><FieldText field="bankDetails">{invoice.bankDetails}</FieldText></p>}
            {invoice.sections.notes && invoice.notes && <p><FieldText field="notes">{invoice.notes}</FieldText></p>}
          </Movable>
        )}

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
    </InvoicePage>
  )
}
