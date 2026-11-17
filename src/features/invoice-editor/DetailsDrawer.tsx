import { X } from 'lucide-react'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CURRENCY_OPTIONS } from '../../lib/currency'
import { useInvoiceStore } from '../../store/invoiceStore'
import { DateField } from './DateField'

interface DetailsDrawerProps {
  onClose: () => void
}

/**
 * The Details card: the invoice's own settings — number, dates, currency, tax
 * and discount — in the left spot Elements, Uploads and the Business drawer
 * share (`EditorLayout` shows one of them). These are the fields that have no
 * single home on the page: the number and dates are printed in different
 * places (and in different words) by every design, and currency, tax and
 * discount only show up in the totals. The dates open the same calendar as the
 * dates on the invoice (`DateField`). Reads and writes the store itself.
 */
export function DetailsDrawer({ onClose }: DetailsDrawerProps) {
  const invoice = useInvoiceStore((s) => s.invoice)
  const updateField = useInvoiceStore((s) => s.updateField)

  return (
    <aside
      aria-label="Details"
      className="flex max-h-full min-h-0 w-72 flex-col rounded-2xl bg-white shadow-[0_8px_32px_rgb(21_23_26/0.14)] ring-1 ring-black/5"
    >
      <div className="flex items-start justify-between px-5 pb-1 pt-5">
        <div>
          <h2 className="text-base font-bold tracking-tight text-ink">Invoice details</h2>
          <p className="mt-0.5 text-xs text-slate-500">Number, dates, currency, tax and discount</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details panel"
          className="-mr-1.5 -mt-1 flex size-8 items-center justify-center rounded-full text-slate-400 outline-none transition-colors hover:bg-black/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto px-5 pb-5 pt-3">
        <Field label="Invoice number">
          <Input aria-label="Invoice number" value={invoice.invoiceNumber} onChange={(e) => updateField('invoiceNumber', e.target.value)} />
        </Field>
        <Field label="Issue date">
          <DateField label="Issue date" value={invoice.issueDate} accent={invoice.theme.accentColor} onPick={(iso) => updateField('issueDate', iso)} />
        </Field>
        <Field label="Due date">
          <DateField label="Due date" value={invoice.dueDate} accent={invoice.theme.accentColor} onPick={(iso) => updateField('dueDate', iso)} />
        </Field>
        <Field label="Currency">
          <Select value={invoice.currency} onValueChange={(value) => updateField('currency', value)}>
            <SelectTrigger aria-label="Currency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tax %">
            <Input
              aria-label="Tax %"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={invoice.taxRatePct}
              onChange={(e) => updateField('taxRatePct', Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Discount %">
            <Input
              aria-label="Discount %"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={invoice.discountPct}
              onChange={(e) => updateField('discountPct', Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </div>
    </aside>
  )
}
