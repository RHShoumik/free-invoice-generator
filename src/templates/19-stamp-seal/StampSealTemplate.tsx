import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

/** Formal/legal parchment feel with a circular seal badge near the total. */
export function StampSealTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor

  return (
    <InvoicePage font={invoice.theme.font} background="#faf6ec" color="#2b2620">
      <div style={paddingStyle(invoice.theme.padding)}>
        <div className="text-center">
          {invoice.sections.logo && (
            <div className="mb-3 flex justify-center">
              <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor={accent} />
            </div>
          )}
          <Movable id="brand" as="p" className="text-2xl">{invoice.from.name || 'Your Business'}</Movable>
          <Movable id="title" as="p" className="mt-1 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: accent }}>
            <Label id="title">Statement of Invoice</Label>
          </Movable>
        </div>

        <div className="mx-auto mt-6 h-px w-24" style={{ background: accent }} />

        <Movable id="meta" className="mt-8 flex justify-center gap-10 text-sm">
          <span><Label id="invoiceNumber">No.</Label> <FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText></span>
          <span><Label id="issueDate">Issued</Label> <EditableDate value={invoice.issueDate} field="issueDate" /></span>
          <span><Label id="dueDate">Due</Label> <EditableDate value={invoice.dueDate} field="dueDate" /></span>
        </Movable>

        <div className="mt-10 grid grid-cols-2 gap-12">
          {invoice.sections.from && (
            <PartyBlock
              label="Party of the first part"
              party={invoice.from}
              which="from"
              labelClassName="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-60"
              nameClassName="mt-2 text-lg"
              lineClassName="text-sm opacity-70"
            />
          )}
          {invoice.sections.to && (
            <PartyBlock
              label="Party of the second part"
              party={invoice.to}
              which="to"
              labelClassName="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-60"
              nameClassName="mt-2 text-lg"
              lineClassName="text-sm opacity-70"
            />
          )}
        </div>

        <div className="mt-10">
          <LineItemsTable
            items={invoice.items}
            currency={invoice.currency}
            columns={invoice.lineItemColumns}
            customColumns={invoice.customColumns}
            headStyle={{ borderBottom: `1px solid ${accent}` }}
            headCellClassName="pb-2 text-xs font-semibold uppercase tracking-[0.15em] opacity-60"
            rowClassName="border-b border-black/10"
            cellClassName="py-3 text-sm"
          />
        </div>

        <div style={{ position: 'relative' }} className="mt-8">
          <Movable id="stamp"
            className="absolute left-0 top-0 flex h-24 w-24 flex-col items-center justify-center rounded-full text-center"
            style={{ border: `2px solid ${accent}`, color: accent, transform: 'rotate(-8deg)' }}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest">Approved</p>
            <p className="text-[9px] font-bold uppercase tracking-widest">& Sealed</p>
          </Movable>
          <div className="ml-auto w-72">
            <Totals
              invoice={invoice}
              rowClassName="flex justify-between py-1 text-sm opacity-70"
              totalRowClassName="mt-2 flex justify-between pt-2 text-xl"
              totalRowStyle={{ borderTop: `2px solid ${accent}` }}
              totalValueStyle={{ color: accent }}
            />
          </div>
        </div>

        {hasFooterContent(invoice) && (
          <Movable id="footer" className="mt-14 space-y-2 border-t pt-6 text-center text-sm opacity-70" style={{ borderColor: `${accent}40` }}>
            {invoice.sections.paymentTerms && invoice.paymentTerms && <p><FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText></p>}
            {invoice.sections.bankDetails && invoice.bankDetails && <p><FieldText field="bankDetails">{invoice.bankDetails}</FieldText></p>}
            {invoice.sections.notes && invoice.notes && <p className="italic"><FieldText field="notes">{invoice.notes}</FieldText></p>}
          </Movable>
        )}

        {invoice.sections.signature && (
          <Signature
            invoice={invoice}
            className="mt-14 grid grid-cols-2 gap-16 text-center"
            columnClassName="flex flex-col items-center"
            lineClassName="h-px w-40"
            lineStyle={{ background: accent }}
            nameClassName="mt-3 text-base"
            labelClassName="text-xs uppercase tracking-[0.2em] opacity-60"
            dateClassName="mt-2 text-xs opacity-60"
          />
        )}
      </div>
    </InvoicePage>
  )
}
