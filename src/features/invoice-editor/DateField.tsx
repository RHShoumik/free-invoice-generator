import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDate } from '../../lib/date'
import { DatePickerCard } from '../../templates/shared/primitives/DatePickerCard'

interface DateFieldProps {
  /** What the field is called, e.g. "Issue date" — also its accessible name. */
  label: string
  /** ISO `YYYY-MM-DD`, as stored on the invoice. */
  value: string
  /** CSS color the chosen day is filled with (the invoice's accent), as on the page. */
  accent?: string
  onPick: (iso: string) => void
}

/**
 * A date as it appears in a form: the formatted date in a box that looks like
 * the other inputs, opening the same calendar (`DatePickerCard`) the dates on
 * the invoice open — instead of the browser's own date box, whose look and
 * behavior differ from browser to browser. The calendar is portaled out of the
 * left drawer and opens beside it, over the page.
 */
export function DateField({ label, value, accent, onPick }: DateFieldProps) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label}, ${formatDate(value)}`}
          aria-haspopup="dialog"
          className="flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm outline-none transition-colors hover:bg-black/[0.03] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:border-ring"
        >
          <span>{formatDate(value)}</span>
          <CalendarDays className="size-4 shrink-0 text-slate-400" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={14}
        collisionPadding={12}
        className="w-auto border-0 bg-transparent p-0 shadow-none ring-0"
        // Start on the chosen day (the card's one tab stop) so the arrow keys work at once, not on "Previous month".
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          const content = e.currentTarget as HTMLElement | null
          content?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
        }}
      >
        <DatePickerCard
          value={value}
          accent={accent}
          onPick={(iso) => {
            onPick(iso)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
