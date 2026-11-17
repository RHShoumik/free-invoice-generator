import { Eye } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DockButton } from './DockButton'
import { SectionToggle } from '@/components/ui/SectionToggle'
import { useInvoiceStore } from '../../../store/invoiceStore'
import type { SectionVisibility } from '../../../types/invoice'

const ROWS: { key: keyof SectionVisibility; label: string }[] = [
  { key: 'logo', label: 'Logo' },
  { key: 'from', label: 'Your business (From)' },
  { key: 'to', label: "Client's details (Bill To)" },
  { key: 'paymentTerms', label: 'Payment terms' },
  { key: 'bankDetails', label: 'Bank / payment details' },
  { key: 'notes', label: 'Notes' },
  { key: 'signature', label: 'Signature block' },
]

/** All 7 optional-section show/hide toggles, consolidated into one place. */
export function SectionsPopover() {
  const sections = useInvoiceStore((s) => s.invoice.sections)
  const setSectionVisible = useInvoiceStore((s) => s.setSectionVisible)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <DockButton icon={Eye} label="Sections" />
      </PopoverTrigger>
      <PopoverContent side="top" align="center" sideOffset={14} className="w-64 rounded-2xl p-4 shadow-xl">
        <h3 className="text-sm font-bold text-foreground">Show on invoice</h3>
        <div className="space-y-2">
          {ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600">{row.label}</span>
              <SectionToggle
                checked={sections[row.key]}
                onChange={(checked) => setSectionVisible(row.key, checked)}
                label="Show"
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
