import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Starts each page at its top. The router keeps the scroll position when it
 * swaps pages, so a link in a footer would land you at the bottom of the next
 * one. It only acts when the *page* changes: not on the first load (the browser
 * restores your place after a refresh) and not for `#section` links.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const previous = useRef(pathname)
  useEffect(() => {
    if (previous.current === pathname) return
    previous.current = pathname
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
