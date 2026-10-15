import { useEffect, useRef, useState } from 'react'
import { PriceTag, ProductArt } from './ProductBits.jsx'
import Icon from './Icon.jsx'
import { useCart } from '../context/CartContext.jsx'
import { categoryName, requestLink } from '../data/products.js'
import { STORE, prescriptionLink } from '../data/store.js'
import './QuickViewModal.css'

export default function QuickViewModal({ product, onClose }) {
  const dialogRef = useRef(null)
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()

    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!product) return null

  const handleAdd = () => {
    add(product.id)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <dialog
      ref={dialogRef}
      className="quick-view-dialog"
      aria-labelledby="quick-title"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="quick-view-panel">
        <button
          type="button"
          className="quick-view-close"
          onClick={onClose}
          aria-label="Close details"
        >
          <Icon name="close" size={20} />
        </button>

        <div className="quick-view-grid">
          <div className="quick-view-art-wrap">
            <ProductArt product={product} className="quick-view-art" />
            {product.substitute && (
              <div className="quick-view-sub-alert">
                <Icon name="sparkles" size={16} />
                <span>
                  <strong>Generic Substitute:</strong> {product.substitute}
                </span>
              </div>
            )}
          </div>

          <div className="quick-view-info">
            <p className="quick-view-cat">{categoryName(product.category)}</p>
            <h2 id="quick-title" className="quick-view-title">{product.name}</h2>
            <p className="quick-view-pack">{product.pack}</p>

            <div className="quick-view-price-row">
              <PriceTag product={product} size="lg" />
              <div className="quick-view-badges">
                {product.rx && (
                  <span className="badge badge--rx">
                    <Icon name="rx" size={14} /> Prescription Required
                  </span>
                )}
                {product.coldChain && (
                  <span className="badge badge--cold-chain">
                    <Icon name="snowflake" size={14} /> Cold-Chain Stored (2°C - 8°C)
                  </span>
                )}
                <span className={`badge ${product.inStock ? 'badge--ok' : 'badge--out'}`}>
                  {product.inStock ? 'In stock' : 'Out of stock'}
                </span>
              </div>
            </div>

            {product.composition && (
              <div className="quick-view-section">
                <h4 className="quick-view-label">
                  <Icon name="pill" size={16} /> Salt / Active Composition
                </h4>
                <p className="quick-view-value">{product.composition}</p>
              </div>
            )}

            {product.dosage && (
              <div className="quick-view-section">
                <h4 className="quick-view-label">
                  <Icon name="clock" size={16} /> Dosage &amp; Direction
                </h4>
                <p className="quick-view-value">{product.dosage}</p>
              </div>
            )}

            {product.description && (
              <p className="quick-view-desc">{product.description}</p>
            )}

            {product.rx && (
              <div className="quick-view-rx-alert">
                <Icon name="shield" size={18} />
                <p>
                  Requires valid prescription from a registered medical practitioner.{' '}
                  <a href={prescriptionLink()} target="_blank" rel="noopener noreferrer">
                    Send on WhatsApp
                  </a>.
                </p>
              </div>
            )}

            <div className="quick-view-actions">
              {product.inStock ? (
                <button
                  type="button"
                  className="btn btn--primary btn--lg"
                  onClick={handleAdd}
                >
                  {added ? <><Icon name="check" size={18} /> Added to Cart</> : <><Icon name="cart" size={18} /> Add to Cart</>}
                </button>
              ) : (
                <a
                  className="btn btn--outline btn--lg"
                  href={requestLink(product)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="whatsapp" size={18} /> Request Item
                </a>
              )}
            </div>

            <div className="quick-view-footer-note">
              <span><Icon name="shield" size={14} /> 100% Genuine Pharmacy Supply</span>
              <span><Icon name="delivery" size={14} /> {STORE.delivery.radius}</span>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
