import { PRODUCTS } from '../data/products.js'

/**
 * Tiny localStorage-backed store for cart quantities ({ [productId]: qty }).
 * Used through useSyncExternalStore, whose server snapshot (empty cart) lets
 * pre-rendered HTML hydrate cleanly before the saved cart appears. Also
 * stays in sync across browser tabs via the `storage` event.
 */
const STORAGE_KEY = 'carepoint-cart'
const EMPTY = Object.freeze({})
const listeners = new Set()
let items = null // lazily read on first client access

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    // Drop ids that are no longer in the catalogue.
    return Object.fromEntries(
      Object.entries(raw).filter(([id, qty]) => PRODUCTS.some((p) => p.id === id) && qty > 0),
    )
  } catch {
    return {}
  }
}

const emit = () => listeners.forEach((fn) => fn())

export const cartStore = {
  getSnapshot() {
    if (items === null) items = read()
    return items
  },
  getServerSnapshot() {
    return EMPTY
  },
  subscribe(fn) {
    listeners.add(fn)
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return
      items = read()
      emit()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(fn)
      window.removeEventListener('storage', onStorage)
    }
  },
  update(fn) {
    items = fn(cartStore.getSnapshot())
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage unavailable (private mode) — cart still works for the session */
    }
    emit()
  },
}
