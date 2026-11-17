import { withAlpha } from '../../lib/color'
import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

/** Technical/engineering-drawing aesthetic — subtle grid background, monochrome accent. */
export function BlueprintTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor
  const gridLine = withAlpha(accent, 0.12)

  return (
    <InvoicePage font={invoice.theme.font}>
      <div
        style={{
          minHeight: 1123,
          backgroundImage: `linear-gradient(${gridLine} 1px, transparent 1px), linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      >
        <div style={paddingStyle(invoice.theme.padding)}>
          <div className="flex items-start justify-between border-b-2 pb-4" style={{ borderColor: accent }}>
            <div className="flex items-center gap-3">
              {invoice.sections.logo && (
                <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor={accent} radius={2} />
              )}
              <Movable id="brand">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: accent }}>
                  Spec Sheet
                </p>
                <p className="text-lg font-bold text-slate-900">{invoice.from.name || 'Your Business'}</p>
              </Movable>
            </div>
            <Movable id="title" className="text-right text-xs">
              <p className="font-bold uppercase tracking-widest" style={{ color: accent }}>
                <Label id="invoiceNumber">Doc</Label> <FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText>
              </p>
              <p className="mt-1 text-slate-500"><Label id="issueDate">Rev.</Label> <EditableDate value={invoice.issueDate} field="issueDate" /></p>
              <p className="text-slate-500"><Label id="dueDate">Due</Label> <EditableDate value={invoice.dueDate} field="dueDate" /></p>
            </Movable>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6">
            {invoice.sections.from && (
              <Movable id="from" className="border p-3" style={{ borderColor: gridLine }}>
                <PartyBlock
                  label="01 · From"
                  party={invoice.from}
                  which="from"
                  labelClassName="text-[10px] font-bold uppercase tracking-widest"
                  nameClassName="mt-1 font-semibold text-slate-900"
                  lineClassName="text-sm text-slate-500"
                />
              </Movable>
            )}
            {invoice.sections.to && (
              <Movable id="to" className="border p-3" style={{ borderColor: gridLine }}>
                <PartyBlock
                  label="02 · Bill To"
                  party={invoice.to}
                  which="to"
                  labelClassName="text-[10px] font-bold uppercase tracking-widest"
                  nameClassName="mt-1 font-semibold text-slate-900"
                  lineClassName="text-sm text-slate-500"
                />
              </Movable>
            )}
          </div>

          <Movable id="items" className="mt-6 border" style={{ borderColor: gridLine }}>
            <LineItemsTable
              items={invoice.items}
              currency={invoice.currency}
              columns={invoice.lineItemColumns}
              customColumns={invoice.customColumns}
              headClassName="border-b-2"
              headStyle={{ borderColor: accent }}
              headCellClassName="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600"
              rowClassName="border-b"
              cellClassName="px-3 py-2.5 text-sm text-slate-700"
            />
          </Movable>

          <Movable id="totals" className="ml-auto mt-6 w-72 border p-4" style={{ borderColor: gridLine }}>
            <Totals
              invoice={invoice}
              rowClassName="flex justify-between py-1 text-sm text-slate-600"
              totalRowClassName="mt-2 flex justify-between border-t-2 pt-2 text-base font-bold text-slate-900"
              totalRowStyle={{ borderColor: accent }}
            />
          </Movable>

          {hasFooterContent(invoice) && (
            <Movable id="footer" className="mt-10 space-y-2 border-t-2 pt-4 text-sm text-slate-500" style={{ borderColor: accent }}>
              {invoice.sections.paymentTerms && invoice.paymentTerms && <p><FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText></p>}
              {invoice.sections.bankDetails && invoice.bankDetails && <p><FieldText field="bankDetails">{invoice.bankDetails}</FieldText></p>}
              {invoice.sections.notes && invoice.notes && <p><FieldText field="notes">{invoice.notes}</FieldText></p>}
            </Movable>
          )}

          {invoice.sections.signature && (
            <Signature
              invoice={invoice}
              className="mt-10 grid grid-cols-2 gap-8"
              lineClassName="h-px w-full"
              lineStyle={{ background: accent }}
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
