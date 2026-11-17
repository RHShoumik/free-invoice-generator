import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  className?: string
  /** Optional control shown at the right of the label row, e.g. a visibility toggle. */
  action?: ReactNode
  children: ReactNode
}

/**
 * Plain <div> wrapper, deliberately not a <label> — nesting an interactive
 * action (e.g. SectionToggle's own <label>-wrapped checkbox) inside a <label>
 * makes clicking the label text ambiguously activate whichever control the
 * browser picks first, instead of focusing this field's actual input.
 */
export function Field({ label, className, action, children }: FieldProps) {
  return (
    <div className={className}>
      <span className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {action}
      </span>
      {children}
    </div>
  )
}
