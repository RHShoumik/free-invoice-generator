import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { getLayoutGroups } from '../../templates/registry'
import { LazyThumbnail } from './LazyThumbnail'

interface TemplatePickerGridProps {
  onSelect: (templateId: string) => void
  /**
   * `page` (default) is the full-page Gallery: up to five narrow columns and a search box that
   * scrolls with the page. `modal` is the editor's Designs dialog: fewer, larger cards so each
   * preview is readable, and a search box that stays put while the cards scroll under it.
   */
  layout?: 'page' | 'modal'
  /** The design the invoice is on now, marked "Current". Only the editor knows it. */
  currentId?: string
}

/**
 * Search box + a grid of all templates, grouped by layout (each layout's
 * style presets sit under one heading) so "100 cards" reads as "20 designs,
 * 5 moods each" rather than an undifferentiated wall. Shared by the
 * full-page Template Gallery and the in-editor Designs dialog so both stay
 * visually consistent and neither duplicates this logic.
 */
export function TemplatePickerGrid({ onSelect, layout = 'page', currentId }: TemplatePickerGridProps) {
  const modal = layout === 'modal'
  const [query, setQuery] = useState('')
  const groups = useMemo(() => getLayoutGroups(), [])

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups
      .map((group) => ({
        ...group,
        presets: group.presets.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            group.layoutName.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.presets.length > 0)
  }, [groups, query])

  return (
    <div>
      <div className={modal ? 'sticky top-0 z-10 -mx-1 bg-popover px-1 pb-4 pt-1' : undefined}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search designs…"
            className="h-12 rounded-full border-transparent bg-white pl-12 text-base shadow-sm ring-1 ring-black/10"
          />
        </div>
      </div>

      {filteredGroups.length === 0 && <p className="mt-8 text-center text-sm text-slate-400">No designs match "{query}".</p>}

      <div className={modal ? 'mt-3 space-y-12' : 'mt-8 space-y-10'}>
        {filteredGroups.map((group) => (
          <section key={group.layoutId}>
            <div className="mb-4 flex items-baseline gap-2.5">
              <h3 className="text-lg font-bold tracking-tight text-ink">{group.layoutName}</h3>
              <span className="text-xs text-slate-400">{group.presets.length} styles</span>
            </div>
            <div className={modal ? 'grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4' : 'grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5'}>
              {group.presets.map((definition) => {
                const current = definition.id === currentId
                return (
                  <button
                    key={definition.id}
                    type="button"
                    data-design-id={definition.id}
                    aria-current={current ? 'true' : undefined}
                    onClick={() => onSelect(definition.id)}
                    className="group relative rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
                  >
                    <LazyThumbnail definition={definition} />
                    {current && (
                      <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
                        Current
                      </span>
                    )}
                    <p className="mt-2.5 truncate text-xs font-semibold text-slate-600 transition-colors group-hover:text-ink">
                      {definition.name}
                    </p>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
