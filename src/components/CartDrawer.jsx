import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { formatPrice } from '../data/products.js'
import { STORE, whatsappLink } from '../data/store.js'
import Icon from './Icon.jsx'
import './CartDrawer.css'

function orderMessage(lines, total, hasRx) {
  const rows = lines.map((l) => `• ${l.product.name} (${l.product.pack}) × ${l.qty} — ${formatPrice(l.qty * l.product.price)}`)
  return [
    `Hello ${STORE.name}, I'd like to place an order:`,
    ...rows,
    `Estimated total: ${formatPrice(total)}`,
    hasRx ? 'My order includes prescription items — I will share the prescription.' : '',
    'Name:',
    'Delivery address / pickup:',
  ].filter(Boolean).join('\n')
}

/**
 * Cart drawer on the native <dialog> element: showModal() provides focus
 * containment, Escape to close and an inert background for free.
 */
export default function CartDrawer() {
  const { lines, total, hasRx, open, setOpen, setQty, clear } = useCart()
  const ref = useRef(null)
  const [status, setStatus] = useState('')
  const changeQty = (product, qty) => {
    setQty(product.id, qty)
    setStatus(qty > 0 ? `${product.name}: quantity ${qty}` : `${product.name} removed from cart`)
  }

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="cart-drawer"
      aria-labelledby="cart-title"
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="cart-drawer__panel">
        <div className="cart-drawer__head">
          <h2 id="cart-title">Your cart</h2>
          <p className="sr-only" role="status">{status}</p>
          <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close cart">
            <Icon name="close" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="cart-drawer__empty">
            <p>Your cart is empty.</p>
            <Link to="/products" className="btn btn--primary" onClick={() => setOpen(false)}>Browse products</Link>
          </div>
        ) : (
          <>
            <ul className="cart-drawer__lines">
              {lines.map(({ product, qty }) => (
                <li key={product.id} className="cart-line">
                  <div>
                    <p className="cart-line__name">
                      {product.name}
                      {product.rx && <span className="badge badge--rx">Rx</span>}
                    </p>
                    <p className="cart-line__pack">{product.pack} · {formatPrice(product.price)}</p>
                  </div>
                  <div className="qty" role="group" aria-label={`Quantity of ${product.name}`}>
                    <button type="button" onClick={() => changeQty(product, qty - 1)} aria-label={`Decrease quantity of ${product.name}`}>
                      <Icon name="minus" size={16} />
                    </button>
                    <span>{qty}</span>
                    <button type="button" onClick={() => changeQty(product, qty + 1)} aria-label={`Increase quantity of ${product.name}`}>
                      <Icon name="plus" size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-drawer__foot">
              {hasRx && (
                <p className="cart-drawer__note">
                  <Icon name="rx" size={16} /> Items marked Rx need a valid prescription. Please share it on WhatsApp or at delivery.
                </p>
              )}
              <p className="cart-drawer__total">
                <span>Estimated total</span>
                <strong>{formatPrice(total)}</strong>
              </p>
              <a
                className="btn btn--primary btn--block"
                href={whatsappLink(orderMessage(lines, total, hasRx))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="whatsapp" size={18} /> Send order on WhatsApp
              </a>
              <a className="btn btn--ghost btn--block" href={STORE.phoneHref}>
                <Icon name="phone" size={18} /> Call to order
              </a>
              <button type="button" className="link-button" onClick={clear}>Clear cart</button>
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}
