import { cn } from '@/lib/utils'
import { AUTHOR } from '../lib/site'

interface CreditProps {
  className?: string
}

/**
 * "Developed by rhshoumik", linked to the developer's website. A plain link —
 * no `nofollow` — so it counts as a real link to that site. It sits outside
 * the invoice page, so it is never part of an exported invoice.
 */
export function Credit({ className }: CreditProps) {
  return (
    <p className={cn('text-xs text-slate-500', className)}>
      Developed by{' '}
      <a
        href={AUTHOR.url}
        target="_blank"
        rel="noopener"
        className="font-semibold text-ink underline decoration-black/20 underline-offset-2 outline-none transition-colors hover:decoration-ink focus-visible:ring-2 focus-visible:ring-ring"
      >
        {AUTHOR.name}
      </a>
    </p>
  )
}
