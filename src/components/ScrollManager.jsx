import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Route-level scroll handling: jump to the top (or to #hash) before paint so
 * the particle controller measures the new page from a stable position.
 */
export default function ScrollManager() {
  const { pathname, hash } = useLocation()
  // Only reset scroll when the path actually changes, so a refresh keeps the
  // browser-restored position (and StrictMode re-runs are no-ops).
  const prevPath = useRef(pathname)

  useLayoutEffect(() => {
    const changed = prevPath.current !== pathname
    prevPath.current = pathname
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    if (changed) window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
