import { STORE } from '../data/store.js'

/**
 * Single-page title/description. Shared by the runtime hook (usePageMeta) and
 * the build-time pre-renderer.
 */
export function metaFor(pathname) {
  return {
    title: `${STORE.name} — Genuine Medicines & Home Delivery`,
    fullTitle: true,
    description: `${STORE.name}: genuine medicines, wellness essentials and personal care with prescription dispensing and home delivery ${STORE.delivery.radius}.`,
  }
}

export const fullTitle = (m) => (m.fullTitle ? m.title : `${m.title} | ${STORE.name}`)

/** Only the home route for pre-rendering and the sitemap. */
export const STATIC_ROUTES = ['/']
