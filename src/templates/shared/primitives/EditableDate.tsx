import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDate } from '../../../lib/date'
import { useCanvasEdit } from '../CanvasEditContext'
import { DatePickerCard } from './DatePickerCard'

interface EditableDateProps {
  /** ISO `YYYY-MM-DD`, as stored in `invoice.issueDate` / `invoice.dueDate`. */
  value: string
  field: 'issueDate' | 'dueDate'
}

const LABELS = { issueDate: 'Change issue date', dueDate: 'Change due date' } as const

/**
 * A date printed on the invoice. In the live editor, clicking it opens a
 * calendar to pick a new one; everywhere else (a design-picker thumbnail, or
 * anything with no `CanvasEditContext`) it is just the formatted text, with
 * no wrapper and no popover at all — so up to 105 thumbnails never carry one,
 * and clicking one can never edit the invoice being worked on.
 *
 * It replaces `{formatDate(invoice.issueDate)}` inside the layouts' own
 * markup, so it renders an inline `<span>` that inherits the surrounding font,
 * size, color and case: a layout keeps its look. At rest it is invisible; on
 * hover or focus it gets a faint tint of the text's own color (readable on
 * dark designs too). The tint is a hover/focus state, so it never reaches an
 * exported PNG/PDF, and the calendar is portaled outside the page node.
 *
 * Deliberately a `<span role="button">`, not a `<button>`: the section drag
 * (`useSectionDrag`) leaves presses on a `<button>` alone but starts a drag
 * from anything else, so a date inside a draggable section can still be
 * grabbed to move that section — and a click that doesn't move is the click
 * that opens the calendar (a drag swallows its trailing click).
 */
export function EditableDate({ value, field }: EditableDateProps) {
  const edit = useCanvasEdit()
  if (!edit) return <>{formatDate(value)}</>
  return <EditableDateButton value={value} field={field} accent={edit.accentColor} onPick={(iso) => edit.updateField(field, iso)} />
}

interface EditableDateButtonProps extends EditableDateProps {
  accent?: string
  onPick: (iso: string) => void
}

function EditableDateButton({ value, field, accent, onPick }: EditableDateButtonProps) {
  const [open, setOpen] = useState(false)

  function handleKeyDown(e: KeyboardEvent<HTMLSpanElement>) {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    setOpen(true)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          aria-label={LABELS[field]}
          aria-haspopup="dialog"
          data-editable-date={field}
          onKeyDown={handleKeyDown}
          className="-mx-0.5 cursor-pointer rounded-sm px-0.5 outline-none transition-colors hover:bg-current/10 focus-visible:bg-current/10 focus-visible:ring-2 focus-visible:ring-current/40 data-[state=open]:bg-current/10"
        >
          {formatDate(value)}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
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
