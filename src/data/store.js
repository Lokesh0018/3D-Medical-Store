/**
 * ⚠️ PLACEHOLDER BUSINESS DETAILS
 * Every value in this file is a stand-in. Replace the name, contact numbers,
 * address, hours, licence number, pharmacist, delivery terms and policies
 * with the store's real information before publishing. Components, SEO
 * metadata and structured data all read from here only.
 *
 * When the details are real, set `isPlaceholder: false` — that enables the
 * schema.org structured data (JSON-LD) so search engines can show the
 * pharmacy's hours, address and products.
 */
export const STORE = {
  isPlaceholder: true,

  name: 'CarePoint Pharmacy',
  shortName: 'CarePoint',
  tagline: 'Your neighbourhood pharmacy',
  siteUrl: 'https://www.example.com', // production origin, no trailing slash
  phoneDisplay: '+91 00000 00000',
  phoneHref: 'tel:+910000000000',
  phoneE164: '+910000000000',
  whatsappNumber: '910000000000',
  email: 'hello@example.com',
  address: ['Shop No. 00, Main Road', 'Your Area, Your City 000000'],
  addressParts: { street: 'Shop No. 00, Main Road', locality: 'Your City', region: 'Your State', postalCode: '000000', country: 'IN' },
  // Optional Google Maps "Embed a map" iframe src. Leave null to show only a directions link.
  mapEmbedUrl: null,
  timeZone: 'Asia/Kolkata',
  // days: 0 = Sunday … 6 = Saturday; 24-hour "HH:MM" times.
  hours: [
    { label: 'Monday – Saturday', days: [1, 2, 3, 4, 5, 6], open: '08:00', close: '22:00' },
    { label: 'Sunday', days: [0], open: '09:00', close: '14:00' },
  ],
  licence: 'Drug Licence No. XX-XXX-XXXXXX',
  pharmacist: { name: 'Pharmacist Name', qualification: 'B.Pharm · Registered Pharmacist' },
  payments: ['UPI', 'Debit & credit cards', 'Cash'],
  delivery: {
    radius: 'within 5 km of the store',
    note: 'Delivery area and charges are confirmed when you place your order.',
  },
  returnsPolicy:
    'Medicines can be exchanged only if the item delivered is damaged, expired or not what you ordered. Please check your order at delivery and tell us the same day.',
  // Real photos build the most trust. Put files in /public/images and set paths here.
  photos: {
    storefront: null, // e.g. { src: '/images/storefront.jpg', width: 1200, height: 800, alt: 'CarePoint Pharmacy storefront on Main Road' }
  },
  social: [
    { label: 'Instagram', href: '#' },
    { label: 'Facebook', href: '#' },
  ],
}

export function whatsappLink(message = '') {
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${STORE.whatsappNumber}${text}`
}

/** WhatsApp chat prefilled for sending a prescription photo. */
export function prescriptionLink() {
  return whatsappLink(`Hello ${STORE.name}, I'd like to order the medicines on my prescription. I'm attaching a photo of it here.`)
}

export function directionsLink() {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${STORE.name}, ${STORE.address.join(', ')}`)}`
}

/** "08:00" -> "8:00 AM" */
export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`
}

export const hoursText = (h) => `${formatTime(h.open)} – ${formatTime(h.close)}`

export const SERVICES = [
  {
    id: 'prescriptions',
    title: 'Prescription dispensing',
    body: 'Share your prescription in store or on WhatsApp. Our pharmacist checks it before your order is packed.',
    icon: 'rx',
  },
  {
    id: 'delivery',
    title: 'Home delivery',
    body: `Doorstep delivery ${STORE.delivery.radius}. ${STORE.delivery.note}`,
    icon: 'delivery',
  },
  {
    id: 'order-ahead',
    title: 'Order ahead, pick up',
    body: 'Send your list in advance and collect it from the counter without waiting.',
    icon: 'bag',
  },
  {
    id: 'advice',
    title: 'Pharmacist guidance',
    body: 'Ask about dosage timings, storage and how to take your medicines. For diagnosis, please consult your doctor.',
    icon: 'chat',
  },
]

export const TRUST_POINTS = [
  { id: 'licence', icon: 'shield', title: 'Licensed pharmacy', body: STORE.licence },
  { id: 'pharmacist', icon: 'rx', title: STORE.pharmacist.name, body: STORE.pharmacist.qualification },
  { id: 'genuine', icon: 'check', title: 'Genuine medicines', body: 'Sourced from authorised distributors' },
  { id: 'payments', icon: 'card', title: 'Easy payments', body: STORE.payments.join(' · ') },
]

/** Frequently asked questions (answers derive from the details above). */
export const FAQS = [
  {
    q: 'Do I need a prescription?',
    a: 'Prescription-only medicines (marked Rx) are dispensed only against a valid prescription from a registered medical practitioner. Send a clear photo on WhatsApp or show it at delivery or pickup. Everyday items like first-aid, personal care and devices need no prescription.',
  },
  {
    q: 'Do you deliver, and what does it cost?',
    a: `We deliver ${STORE.delivery.radius}. ${STORE.delivery.note}`,
  },
  {
    q: 'How do I place an order?',
    a: 'Add items to your cart and send the order on WhatsApp, call us, or send a photo of your prescription. We confirm availability and the final price before packing.',
  },
  {
    q: 'Which payment methods do you accept?',
    a: `${STORE.payments.join(', ')}.`,
  },
  {
    q: 'Can I return or exchange medicines?',
    a: STORE.returnsPolicy,
  },
  {
    q: 'When are you open?',
    a: STORE.hours.map((h) => `${h.label}: ${hoursText(h)}`).join('. ') + '.',
  },
]
