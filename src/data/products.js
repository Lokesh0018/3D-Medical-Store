/**
 * ⚠️ SAMPLE CATALOGUE
 * Product names, pack sizes, prices and stock are placeholders to
 * demonstrate the storefront. Replace with the store's real inventory.
 * `rx: true` marks items that are dispensed only against a valid prescription.
 */
export const CATEGORIES = [
  { id: 'medicines', name: 'Medicines', blurb: 'Everyday OTC and prescription medicines', icon: 'pill' },
  { id: 'wellness', name: 'Wellness & Vitamins', blurb: 'Supplements and daily nutrition', icon: 'leaf' },
  { id: 'devices', name: 'Health Devices', blurb: 'Monitors and home testing', icon: 'device' },
  { id: 'personal-care', name: 'Personal Care', blurb: 'Hygiene and skin care', icon: 'drop' },
  { id: 'baby-care', name: 'Baby Care', blurb: 'Gentle essentials for little ones', icon: 'baby' },
  { id: 'first-aid', name: 'First Aid', blurb: 'Bandages, antiseptics and kits', icon: 'aid' },
]

export const PRODUCTS = [
  { id: 'p-paracetamol-500', name: 'Paracetamol 500 mg Tablets', pack: 'Strip of 15 tablets', category: 'medicines', price: 30, inStock: true, rx: false, featured: true },
  { id: 'p-ors', name: 'Oral Rehydration Salts', pack: '5 sachets × 21 g', category: 'medicines', price: 110, inStock: true, rx: false },
  { id: 'p-amoxicillin-500', name: 'Amoxicillin 500 mg Capsules', pack: 'Strip of 10 capsules', category: 'medicines', price: 95, inStock: true, rx: true },
  { id: 'p-vitc-500', name: 'Vitamin C 500 mg Chewable', pack: 'Bottle of 60 tablets', category: 'wellness', price: 180, inStock: true, rx: false, featured: true },
  { id: 'p-multivit', name: 'Daily Multivitamin Tablets', pack: 'Bottle of 60 tablets', category: 'wellness', price: 420, inStock: false, rx: false },
  { id: 'p-thermometer', name: 'Digital Thermometer', pack: '1 unit', category: 'devices', price: 249, inStock: true, rx: false, featured: true },
  { id: 'p-bp-monitor', name: 'Automatic BP Monitor', pack: '1 unit with cuff', category: 'devices', price: 1899, inStock: true, rx: false, featured: true },
  { id: 'p-oximeter', name: 'Fingertip Pulse Oximeter', pack: '1 unit', category: 'devices', price: 999, inStock: true, rx: false },
  { id: 'p-sanitiser', name: 'Hand Sanitiser', pack: '500 ml pump bottle', category: 'personal-care', price: 199, inStock: true, rx: false, featured: true },
  { id: 'p-lotion', name: 'Moisturising Body Lotion', pack: '400 ml bottle', category: 'personal-care', price: 349, inStock: true, rx: false },
  { id: 'p-diapers', name: 'Baby Diaper Pants (M)', pack: 'Pack of 42', category: 'baby-care', price: 749, inStock: true, rx: false },
  { id: 'p-baby-wipes', name: 'Baby Wipes', pack: 'Pack of 72', category: 'baby-care', price: 159, inStock: true, rx: false },
  { id: 'p-first-aid-kit', name: 'Home First-Aid Kit', pack: '1 kit', category: 'first-aid', price: 599, inStock: true, rx: false, featured: true },
  { id: 'p-crepe-bandage', name: 'Crepe Bandage 10 cm', pack: '1 roll', category: 'first-aid', price: 120, inStock: true, rx: false },
]

export const formatPrice = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export const categoryName = (id) => CATEGORIES.find((c) => c.id === id)?.name ?? id
