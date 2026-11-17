import { Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DockButton } from './DockButton'
import { SectionToggle } from '@/components/ui/SectionToggle'
import { useInvoiceStore } from '../../../store/invoiceStore'

/**
 * Qty/Rate column visibility + custom-column add/remove. Column *labels* and
 * line-item add/remove/edit all moved onto the canvas (the table itself,
 * via the now edit-aware `LineItemsTable`) — this popover only keeps the
 * settings that don't have a natural on-canvas home.
 */
export function ColumnsPopover() {
  const columns = useInvoiceStore((s) => s.invoice.lineItemColumns)
  const customColumns = useInvoiceStore((s) => s.invoice.customColumns)
  const setColumnVisible = useInvoiceStore((s) => s.setColumnVisible)
  const addCustomColumn = useInvoiceStore((s) => s.addCustomColumn)
  const removeCustomColumn = useInvoiceStore((s) => s.removeCustomColumn)
  const setCustomColumnLabel = useInvoiceStore((s) => s.setCustomColumnLabel)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <DockButton icon={Columns3} label="Columns" />
      </PopoverTrigger>
      <PopoverContent side="top" align="center" sideOffset={14} className="w-72 rounded-2xl p-4 shadow-xl">
        <h3 className="text-sm font-bold text-foreground">Table columns</h3>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-600">Qty column</span>
          <SectionToggle
            checked={columns.quantity.visible}
            onChange={(visible) => setColumnVisible('quantity', visible)}
            label="Show"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-600">Rate column</span>
          <SectionToggle
            checked={columns.rate.visible}
            onChange={(visible) => setColumnVisible('rate', visible)}
            label="Show"
          />
        </div>

        {customColumns.length > 0 && (
          <div className="space-y-2 border-t border-slate-200 pt-3">
            {customColumns.map((col) => (
              <div key={col.id} className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="Column name"
                  value={col.label}
                  onChange={(e) => setCustomColumnLabel(col.id, e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeCustomColumn(col.id)}
                  aria-label="Remove column"
                  className="px-2"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button type="button" variant="outline" className="w-full" onClick={addCustomColumn}>
          + Add column
        </Button>
      </PopoverContent>
    </Popover>
  )
}
