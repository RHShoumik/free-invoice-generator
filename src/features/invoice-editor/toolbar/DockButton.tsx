import type { LucideIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface DockButtonProps extends ComponentProps<'button'> {
  icon: LucideIcon
  label: string
  /** Shown as the current tool (e.g. the open Elements panel). Popover triggers get this from Radix's `data-state="open"` instead. */
  active?: boolean
}

/**
 * One tool on the floating dock: an icon over a small label. Doubles as a
 * Radix `PopoverTrigger` (`asChild`), hence spreading every prop through and
 * taking the "open" look from `data-state="open"`.
 */
export function DockButton({ icon: Icon, label, active, className, ...props }: DockButtonProps) {
  return (
    <button
      type="button"
      data-active={active ? 'true' : undefined}
      className={cn(
        'flex w-16 flex-col items-center gap-1 rounded-xl px-1 pb-1.5 pt-2 text-[11px] font-semibold text-slate-500 outline-none transition-all',
        'hover:bg-black/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring',
        'data-[active=true]:bg-ink data-[active=true]:text-white data-[state=open]:bg-ink data-[state=open]:text-white',
        className,
      )}
      {...props}
    >
      <Icon className="size-5" strokeWidth={1.75} />
      {label}
    </button>
  )
}
