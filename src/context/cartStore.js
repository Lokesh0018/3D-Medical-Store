import { PRODUCTS } from '../data/products.js'

/**
 * In-memory store for cart quantities ({ [productId]: qty }).
 * When the page is refreshed, the cart items are reset to empty.
 * Also cleans up any existing persistent cart key from previous sessions.
 */
const STORAGE_KEY = 'carepoint-cart'
const EMPTY = Object.freeze({})
const listeners = new Set()
let items = {}

// Clear any leftover localStorage cart from previous sessions
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* private mode / quota */
  }
}

const emit = () => listeners.forEach((fn) => fn())

export const cartStore = {
  getSnapshot() {
    return items
  },
  getServerSnapshot() {
    return EMPTY
  },
  subscribe(fn) {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
  update(fn) {
    items = fn(cartStore.getSnapshot())
    emit()
  },
}
