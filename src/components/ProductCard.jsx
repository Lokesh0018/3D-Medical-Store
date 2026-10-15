import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { categoryName, requestLink } from '../data/products.js'
import { PriceTag, ProductArt } from './ProductBits.jsx'
import Icon from './Icon.jsx'
import './ProductCard.css'

export default function ProductCard({ product, onQuickView }) {
  const { lines, add, setQty } = useCart()
  const [addedAnimation, setAddedAnimation] = useState(false)

  // Check if item is already in cart to display inline quantity stepper
  const currentLine = lines.find((l) => l.product.id === product.id)
  const currentQty = currentLine ? currentLine.qty : 0

  useEffect(() => {
    if (!addedAnimation) return
    const id = setTimeout(() => setAddedAnimation(false), 1200)
    return () => clearTimeout(id)
  }, [addedAnimation])

  const handleAdd = () => {
    add(product.id)
    setAddedAnimation(true)
  }

  const handleQtyChange = (delta) => {
    const next = currentQty + delta
    setQty(product.id, next)
    if (delta > 0) setAddedAnimation(true)
  }

  return (
    <article className={`product-card${addedAnimation ? ' product-card--bump' : ''}`}>
      <div className="product-card__media-wrap">
        <button
          type="button"
          className="product-card__art-link"
          onClick={() => onQuickView?.(product)}
          aria-label={`View details for ${product.name}`}
        >
          <ProductArt product={product} />
          {/* Subtle pedestal stage reflection glow */}
          <span className="product-card__pedestal" aria-hidden="true" />
        </button>

        {onQuickView && (
          <button
            type="button"
            className="product-card__quick-btn"
            onClick={() => onQuickView(product)}
            aria-label={`Quick view details for ${product.name}`}
          >
            <Icon name="search" size={14} /> Quick View
          </button>
        )}
      </div>

      <div className="product-card__body">
        <div className="product-card__meta">
          <span className="product-card__cat">{categoryName(product.category)}</span>
          {product.substitute && (
            <span className="product-card__sub-hint" title={`Alternative: ${product.substitute}`}>
              Generic available
            </span>
          )}
        </div>

        <h3 className="product-card__name">
          <button
            type="button"
            className="product-card__name-btn"
            onClick={() => onQuickView?.(product)}
          >
            {product.name}
          </button>
        </h3>

        <p className="product-card__pack">{product.pack}</p>

        {product.composition && (
          <p className="product-card__salt" title={product.composition}>
            <Icon name="pill" size={12} /> {product.composition}
          </p>
        )}

        {/* High contrast Rx vs OTC pill tags & Stock Status */}
        <div className="product-card__badges">
          {product.rx ? (
            <span className="badge badge--rx-clinical" title="Valid Doctor Prescription Required">
              <Icon name="rx" size={13} strokeWidth={2.2} /> Rx Required
            </span>
          ) : (
            <span className="badge badge--otc" title="Over The Counter Medicine">
              OTC Medicine
            </span>
          )}

          {product.coldChain && (
            <span className="badge badge--cold-chain" title="Temperature-Controlled Cold-Chain Stored (2°C - 8°C)">
              <Icon name="snowflake" size={13} strokeWidth={2} /> Cold-Chain (2°C - 8°C)
            </span>
          )}

          <span className={`badge ${product.inStock ? 'badge--in-stock' : 'badge--out'}`}>
            <span className="stock-dot" aria-hidden="true" />
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        <div className="product-card__foot">
          <PriceTag product={product} />

          {product.inStock ? (
            currentQty > 0 ? (
              /* Direct Interactive Stepper once added */
              <div className="product-card__stepper" role="group" aria-label={`Quantity of ${product.name}`}>
                <button
                  type="button"
                  onClick={() => handleQtyChange(-1)}
                  className="product-card__step-btn"
                  aria-label={`Decrease ${product.name} quantity`}
                >
                  <Icon name="minus" size={14} />
                </button>
                <span className="product-card__step-val" aria-live="polite">
                  {currentQty}
                </span>
                <button
                  type="button"
                  onClick={() => handleQtyChange(1)}
                  className="product-card__step-btn"
                  aria-label={`Increase ${product.name} quantity`}
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn--primary btn--sm product-card__add-btn"
                onClick={handleAdd}
                aria-label={`Add ${product.name} to cart`}
              >
                <Icon name="plus" size={15} /> Add
              </button>
            )
          ) : (
            <a
              className="btn btn--outline btn--sm"
              href={requestLink(product)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Request ${product.name} on WhatsApp`}
            >
              Request item
            </a>
          )}
        </div>

        <span className="sr-only" role="status">
          {addedAnimation ? `${product.name} updated in cart: quantity ${currentQty}` : ''}
        </span>
      </div>
    </article>
  )
}
