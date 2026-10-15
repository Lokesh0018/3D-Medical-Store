import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Route-level scroll handling: jump to the top (or to #hash) before paint so
 * the particle controller measures the new page from a stable position.
 */
export default function ScrollManager() {
  const { pathname, hash } = useLocation()

  useLayoutEffect(() => {
    // Disable browser's automatic scroll restoration on refresh so page starts at top
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const navEntries = window.performance?.getEntriesByType?.('navigation')
    const isReload = navEntries && navEntries[0]?.type === 'reload'

    if (isReload) {
      // If user refreshed the page, scroll cleanly to top hero section
      window.scrollTo(0, 0)
      if (window.location.hash) {
        try {
          window.history.replaceState(null, '', window.location.pathname)
        } catch {
          /* ignore */
        }
      }
      return
    }

    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }

    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
