import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { PRODUCTS } from '../data/products.js'

const CartContext = createContext(null)
const STORAGE_KEY = 'carepoint-cart'

function loadCart() {
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

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage unavailable (private mode) — cart still works for the session */
    }
  }, [items])

  const add = useCallback((id) => setItems((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 })), [])
  const setQty = useCallback((id, qty) => setItems((s) => {
    const next = { ...s }
    if (qty <= 0) delete next[id]
    else next[id] = Math.min(qty, 20)
    return next
  }), [])
  const clear = useCallback(() => setItems({}), [])

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
