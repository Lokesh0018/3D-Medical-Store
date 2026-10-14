import { STORE } from '../data/store.js'

/**
 * Emits schema.org JSON-LD. Suppressed while STORE.isPlaceholder is true so
 * placeholder addresses/phones are never published to search engines.
 */
export default function StructuredData({ data }) {
  if (STORE.isPlaceholder) return null
  // Escape "<" so the JSON can never close the script tag early.
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
