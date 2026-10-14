import { STORE } from '../data/store.js'
import { PRODUCTS, categoryName, formatPrice, productPath } from '../data/products.js'

/**
 * Per-route title/description. Shared by the runtime hook (usePageMeta) and
 * the build-time pre-renderer, so crawlers and browsers see the same tags.
 */
export function metaFor(pathname) {
  if (pathname === '/') {
    return {
      title: `${STORE.name} — Genuine Medicines & Home Delivery`,
      fullTitle: true,
      description: `${STORE.name}: genuine medicines, wellness essentials and personal care with prescription dispensing and home delivery ${STORE.delivery.radius}.`,
    }
  }
  if (pathname === '/products') {
    return {
      title: 'Products',
      description: `Browse medicines, vitamins, health devices, baby care and first-aid at ${STORE.name}. Order on WhatsApp or by phone.`,
    }
  }
  if (pathname === '/contact') {
    return {
      title: 'Contact & ordering',
      description: `Call, WhatsApp or visit ${STORE.name}. Opening hours, address, delivery area and answers to common questions.`,
    }
  }
  const product = PRODUCTS.find((p) => productPath(p) === pathname)
  if (product) {
    return {
      title: product.name,
      description: `${product.name} (${product.pack}) — ${formatPrice(product.price)} at ${STORE.name}. ${product.rx ? 'Prescription required. ' : ''}${categoryName(product.category)}; order on WhatsApp or by phone.`,
    }
  }
  return { title: 'Page not found', description: 'The page you requested could not be found.', noindex: true }
}

export const fullTitle = (m) => (m.fullTitle ? m.title : `${m.title} | ${STORE.name}`)

/** Every indexable route, for pre-rendering and the sitemap. */
export const STATIC_ROUTES = ['/', '/products', '/contact', ...PRODUCTS.map(productPath)]
