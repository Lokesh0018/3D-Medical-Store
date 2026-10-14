import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { STORE } from '../data/store.js'
import { fullTitle, metaFor } from '../seo/meta.js'

function upsert(selector, tag, attrs) {
  const el = document.head.querySelector(selector) ?? document.head.appendChild(document.createElement(tag))
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
}

/**
 * Keeps <title>, description, robots, canonical and Open Graph tags in sync on
 * client-side navigation. Pre-rendered pages already ship the same tags in
 * their HTML (see scripts/prerender.mjs); both read from seo/meta.js.
 */
export default function usePageMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const m = metaFor(pathname)
    const title = fullTitle(m)
    const url = `${STORE.siteUrl}${pathname}`
    document.title = title
    upsert('meta[name="description"]', 'meta', { name: 'description', content: m.description })
    upsert('meta[name="robots"]', 'meta', { name: 'robots', content: m.noindex ? 'noindex, follow' : 'index, follow' })
    upsert('meta[property="og:title"]', 'meta', { property: 'og:title', content: title })
    upsert('meta[property="og:description"]', 'meta', { property: 'og:description', content: m.description })
    upsert('meta[property="og:url"]', 'meta', { property: 'og:url', content: url })
    upsert('link[rel="canonical"]', 'link', { rel: 'canonical', href: url })
  }, [pathname])
}
