/**
 * ⚠️ PLACEHOLDER BUSINESS DETAILS
 * Every value in this file is a stand-in. Replace the name, contact numbers,
 * address, hours, licence number and delivery terms with the store's real
 * information before publishing. Components read from here only, so this is
 * the single place to update.
 */
export const STORE = {
  name: 'CarePoint Pharmacy',
  shortName: 'CarePoint',
  tagline: 'Your neighbourhood pharmacy',
  phoneDisplay: '+91 00000 00000',
  phoneHref: 'tel:+910000000000',
  whatsappNumber: '910000000000',
  email: 'hello@example.com',
  address: ['Shop No. 00, Main Road', 'Your Area, Your City 000000'],
  hours: [
    { days: 'Monday – Saturday', time: '8:00 AM – 10:00 PM' },
    { days: 'Sunday', time: '9:00 AM – 2:00 PM' },
  ],
  licence: 'Drug Licence No. XX-XXX-XXXXXX',
  delivery: {
    radius: 'within 5 km of the store',
    note: 'Delivery area and charges are confirmed when you place your order.',
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
