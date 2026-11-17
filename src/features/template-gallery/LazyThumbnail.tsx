import { useEffect, useRef, useState } from 'react'
import type { TemplateDefinition } from '../../templates/registry'
import { TemplateThumbnail } from './TemplateThumbnail'

interface LazyThumbnailProps {
  definition: TemplateDefinition
}

/**
 * Defers mounting the real (live-rendered) TemplateThumbnail until it's
 * about to scroll into view. At 100 cards, rendering every template
 * component simultaneously is visibly janky — this keeps the picker smooth
 * regardless of catalog size.
 */
export function LazyThumbnail({ definition }: LazyThumbnailProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible])

  return (
    <div ref={ref}>
      {visible ? (
        <TemplateThumbnail definition={definition} />
      ) : (
        <div
          className="animate-pulse rounded-xl border border-slate-200 bg-slate-100"
          style={{ aspectRatio: '794 / 1123' }}
        />
      )}
    </div>
  )
}
