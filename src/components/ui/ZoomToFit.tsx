import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface ZoomToFitProps {
  /** Natural (unscaled) width of the content, in px. */
  contentWidth: number
  children: ReactNode
}

/**
 * Scales its fixed-width children down to fit the available container width
 * (never up past 1x), while reserving exactly the right amount of vertical
 * space. Used to show the 794px-wide invoice preview at a readable size on
 * narrower windows without affecting the actual DOM node the exporters
 * capture (that node is rendered at its real, unscaled size — only the
 * paint layer is scaled here).
 */
export function ZoomToFit({ contentWidth, children }: ZoomToFitProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    const inner = innerRef.current
    if (!container || !inner) return

    const containerObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width
      setScale(Math.min(1, width / contentWidth))
    })
    const innerObserver = new ResizeObserver((entries) => {
      setContentHeight(entries[0].contentRect.height)
    })
    containerObserver.observe(container)
    innerObserver.observe(inner)
    return () => {
      containerObserver.disconnect()
      innerObserver.disconnect()
    }
  }, [contentWidth])

  return (
    <div ref={containerRef} className="w-full">
      <div style={{ height: contentHeight * scale }}>
        <div ref={innerRef} style={{ width: contentWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
