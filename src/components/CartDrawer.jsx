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
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [step, setStep] = useState('items') // 'items' | 'checkout'

  const changeQty = (product, qty) => {
    setQty(product.id, qty)
    setStatus(qty > 0 ? `${product.name}: quantity ${qty}` : `${product.name} removed from cart`)
  }

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      setStep('items')
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  const deliveryThreshold = 500
  const isFreeDelivery = total >= deliveryThreshold
  const deliveryCharge = isFreeDelivery || total === 0 ? 0 : 40
  const finalTotal = total + deliveryCharge

  const handleWhatsAppOrder = () => {
    const orderText = [
      `Hello ${STORE.name}, I would like to place an order:`,
      `Customer Name: ${customerName.trim() || 'Valued Customer'}`,
      `Delivery Address: ${customerAddress.trim() || 'Home Delivery'}`,
      '--------------------------------',
      ...lines.map((l) => `• ${l.product.name} (${l.product.pack}) × ${l.qty} — ${formatPrice(l.qty * l.product.price)}`),
      '--------------------------------',
      `Subtotal: ${formatPrice(total)}`,
      `Delivery Fee: ${deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}`,
      `Total Payable: ${formatPrice(finalTotal)}`,
      hasRx ? '⚠️ Prescription attached / sharing shortly on WhatsApp.' : '',
    ].filter(Boolean).join('\n')

    window.open(whatsappLink(orderText), '_blank', 'noopener,noreferrer')
  }

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
          <div className="cart-drawer__head-title">
            <h2 id="cart-title">
              {step === 'items' ? 'Your Cart' : 'Delivery Details'}
            </h2>
            {lines.length > 0 && (
              <span className="cart-drawer__step-indicator">
                {step === 'items' ? 'Step 1 of 2' : 'Step 2 of 2'}
              </span>
            )}
          </div>
          <p className="sr-only" role="status">{status}</p>
          <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close cart">
            <Icon name="close" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="cart-drawer__empty">
            <Icon name="cart" size={48} className="cart-drawer__empty-icon" />
            <p>Your shopping cart is empty.</p>
            <Link to="/products" className="btn btn--primary" onClick={() => setOpen(false)}>
              Browse catalogue
            </Link>
          </div>
        ) : step === 'items' ? (
          <>
            <div className="cart-drawer__delivery-perk">
              {isFreeDelivery ? (
                <span><Icon name="check" size={16} /> <strong>Free Delivery unlocked!</strong> (Order above ₹500)</span>
              ) : (
                <span><Icon name="delivery" size={16} /> Add ₹{deliveryThreshold - total} more for <strong>FREE Delivery</strong></span>
              )}
            </div>

            <ul className="cart-drawer__lines">
              {lines.map(({ product, qty }) => (
                <li key={product.id} className="cart-line">
                  <div className="cart-line__details">
                    <p className="cart-line__name">
                      {product.name}
                      {product.rx && <span className="badge badge--rx">Rx</span>}
                    </p>
                    <p className="cart-line__pack">{product.pack} · {formatPrice(product.price)}</p>
                    {product.composition && (
                      <p className="cart-line__salt"><Icon name="pill" size={11} /> {product.composition}</p>
                    )}
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
                  <Icon name="rx" size={16} /> Order includes Rx medicines. Prescription will be verified prior to dispatch.
                </p>
              )}
              <div className="cart-drawer__summary-rows">
                <div className="cart-drawer__row">
                  <span>Items Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="cart-drawer__row">
                  <span>Estimated Delivery</span>
                  <span className={isFreeDelivery ? 'text-free' : ''}>
                    {isFreeDelivery ? 'FREE' : formatPrice(deliveryCharge)}
                  </span>
                </div>
                <div className="cart-drawer__total">
                  <span>Estimated Total</span>
                  <strong>{formatPrice(finalTotal)}</strong>
                </div>
              </div>

              <button
                type="button"
                className="btn btn--primary btn--block btn--lg"
                onClick={() => setStep('checkout')}
              >
                Proceed to Checkout <Icon name="arrow" size={16} />
              </button>
              <button type="button" className="link-button" onClick={clear}>Clear cart</button>
            </div>
          </>
        ) : (
          <div className="cart-drawer__checkout-step">
            <button
              type="button"
              className="cart-drawer__back-btn"
              onClick={() => setStep('items')}
            >
              <Icon name="arrow" size={16} style={{ transform: 'rotate(180deg)' }} /> Back to cart items
            </button>

            <div className="cart-drawer__address-form">
              <h3 className="cart-drawer__step-heading">Delivery Address</h3>
              <div>
                <label htmlFor="checkout-name" className="rx-field-label">Recipient Name</label>
                <input
                  id="checkout-name"
                  type="text"
                  className="rx-input"
                  placeholder="e.g. Vikram Verma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="checkout-addr" className="rx-field-label">Delivery Address / Apartment</label>
                <textarea
                  id="checkout-addr"
                  rows={3}
                  className="rx-textarea"
                  placeholder="Flat/House No., Street, Landmark, Pincode"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </div>

              <div className="cart-drawer__checkout-summary">
                <div className="cart-drawer__row">
                  <span>Order Total ({lines.reduce((n, l) => n + l.qty, 0)} items):</span>
                  <strong>{formatPrice(finalTotal)}</strong>
                </div>
              </div>
            </div>

            <div className="cart-drawer__foot cart-drawer__foot--checkout">
              <button
                type="button"
                className="btn btn--primary btn--block btn--lg"
                onClick={handleWhatsAppOrder}
              >
                <Icon name="whatsapp" size={18} /> Confirm Order via WhatsApp
              </button>
              <a className="btn btn--ghost btn--block" href={STORE.phoneHref}>
                <Icon name="phone" size={18} /> Call Pharmacist Directly
              </a>
            </div>
          </div>
        )}
      </div>
    </dialog>
  )
}
