import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ROBOTS_NOINDEX, SEO_DESCRIPTION } from '../../lib/site'
import { usePageMeta } from '../../lib/usePageMeta'

/**
 * Any address the app doesn't know. It says `noindex` so a mistyped or old link
 * never becomes a search result (the server answers every address with the same
 * app, so the page itself has to say it is not a real one), and it points home.
 */
export function NotFound() {
  usePageMeta({ title: 'Page not found – Invoice Generator', description: SEO_DESCRIPTION, robots: ROBOTS_NOINDEX, canonicalPath: null })
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-paper px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">404</p>
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">Page not found</h1>
      <p className="max-w-md text-base leading-relaxed text-slate-600">There is nothing at this address. You can make an invoice from the home page.</p>
      <Button asChild className="h-11 rounded-full px-6 text-sm font-semibold">
        <Link to="/">Go to the free invoice generator</Link>
      </Button>
    </main>
  )
}
