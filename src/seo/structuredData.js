import { STORE } from '../data/store.js'
import { categoryName, productPath } from '../data/products.js'

const DAY_URIS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  .map((d) => `https://schema.org/${d}`)

export function pharmacySchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Pharmacy',
    name: STORE.name,
    url: STORE.siteUrl,
    telephone: STORE.phoneE164,
    email: STORE.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: STORE.addressParts.street,
      addressLocality: STORE.addressParts.locality,
      addressRegion: STORE.addressParts.region,
      postalCode: STORE.addressParts.postalCode,
      addressCountry: STORE.addressParts.country,
    },
    openingHoursSpecification: STORE.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days.map((d) => DAY_URIS[d]),
      opens: h.open,
      closes: h.close,
    })),
    paymentAccepted: STORE.payments.join(', '),
    currenciesAccepted: 'INR',
  }
}

export function productSchema(p) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description ?? `${p.name}, ${p.pack}`,
    category: categoryName(p.category),
    ...(p.image ? { image: `${STORE.siteUrl}${p.image.src}` } : {}),
    offers: {
      '@type': 'Offer',
      url: `${STORE.siteUrl}${productPath(p)}`,
      priceCurrency: 'INR',
      price: p.price,
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Pharmacy', name: STORE.name },
    },
  }
}

export function faqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}
