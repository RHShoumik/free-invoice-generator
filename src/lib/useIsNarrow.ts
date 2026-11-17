import { useEffect, useState } from 'react'

/** Below this width (px) the screen is a phone's, and a floating panel has no room beside the page. */
export const NARROW_BELOW = 768

/** Whether the window is phone-sized — and it follows the window as it is resized or turned. */
export function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < NARROW_BELOW)
  useEffect(() => {
    const update = () => setNarrow(window.innerWidth < NARROW_BELOW)
    window.addEventListener('resize', update)
    update()
    return () => window.removeEventListener('resize', update)
  }, [])
  return narrow
}
