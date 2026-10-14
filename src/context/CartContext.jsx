import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from 'react'
import { PRODUCTS } from '../data/products.js'
import { cartStore } from './cartStore.js'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const items = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot)
  const [open, setOpen] = useState(false)

  const add = useCallback((id) => cartStore.update((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 })), [])
  const setQty = useCallback((id, qty) => cartStore.update((s) => {
    const next = { ...s }
    if (qty <= 0) delete next[id]
    else next[id] = Math.min(qty, 20)
    return next
  }), [])
  const clear = useCallback(() => cartStore.update(() => ({})), [])

  const value = useMemo(() => {
    const lines = Object.entries(items)
      .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === id), qty }))
      .filter((l) => l.product)
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total: lines.reduce((n, l) => n + l.qty * l.product.price, 0),
      hasRx: lines.some((l) => l.product.rx),
      add,
      setQty,
      clear,
      open,
      setOpen,
    }
  }, [items, add, setQty, clear, open])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
