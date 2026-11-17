import { ChevronDown, Download, FileImage, FileText } from 'lucide-react'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export type ExportFormat = 'image' | 'pdf'

const FORMATS: { format: ExportFormat; label: string; hint: string; Icon: LucideIcon }[] = [
  { format: 'image', label: 'PNG image', hint: 'A crisp picture, great for sharing', Icon: FileImage },
  { format: 'pdf', label: 'PDF', hint: 'One page, ready to send', Icon: FileText },
]

interface DownloadMenuProps {
  exporting: ExportFormat | null
  onExport: (format: ExportFormat) => void
}

/** One "Download" button on the top bar that opens the formats, instead of buttons side by side. */
export function DownloadMenu({ exporting, onExport }: DownloadMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          disabled={exporting !== null}
          className="h-10 gap-2 rounded-full px-5 text-sm font-semibold"
        >
          <Download className="size-4" />
          {exporting ? 'Exporting…' : 'Download'}
          <ChevronDown className="size-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-72 gap-0.5 rounded-2xl p-2 shadow-xl">
        {FORMATS.map(({ format, label, hint, Icon }) => (
          <button
            key={format}
            type="button"
            onClick={() => {
              setOpen(false)
              onExport(format)
            }}
            className="flex items-center gap-3 rounded-xl p-2.5 text-left outline-none transition-colors hover:bg-accent focus-visible:bg-accent"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-paper text-ink">
              <Icon className="size-[18px]" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">{label}</span>
              <span className="block text-xs text-muted-foreground">{hint}</span>
            </span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
