import { useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { STORE, whatsappLink } from '../data/store.js'
import Icon from './Icon.jsx'
import PrescriptionModal from './PrescriptionModal.jsx'
import './MobileActionBar.css'

/**
 * Thumb-reachable ordering shortcuts on small screens: call, WhatsApp,
 * prescription upload and cart. Hidden on larger viewports via CSS.
 */
export default function MobileActionBar() {
  const { count, setOpen } = useCart()
  const [rxOpen, setRxOpen] = useState(false)

  return (
    <>
      <nav className="mobile-actions" aria-label="Quick actions">
        <a href={STORE.phoneHref}>
          <Icon name="phone" size={20} />
          <span>Call</span>
        </a>
        <a href={whatsappLink('Hello, I would like to order medicines.')} target="_blank" rel="noopener noreferrer">
          <Icon name="whatsapp" size={20} />
          <span>WhatsApp</span>
        </a>
        <button type="button" onClick={() => setRxOpen(true)} aria-label="Upload prescription">
          <Icon name="rx" size={20} />
          <span>Prescription</span>
        </button>
        <button type="button" onClick={() => setOpen(true)} aria-label={`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
          <span className="mobile-actions__cart">
            <Icon name="cart" size={20} />
            {count > 0 && <span className="mobile-actions__badge" aria-hidden="true">{count}</span>}
          </span>
          <span aria-hidden="true">Cart</span>
        </button>
      </nav>

      <PrescriptionModal isOpen={rxOpen} onClose={() => setRxOpen(false)} />
    </>
  )
}
