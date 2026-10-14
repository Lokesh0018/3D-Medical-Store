import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { categoryName, productPath, requestLink } from '../data/products.js'
import { PriceTag, ProductArt } from './ProductBits.jsx'
import Icon from './Icon.jsx'
import './ProductCard.css'

export default function ProductCard({ product, onQuickView }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)
  const href = productPath(product)

  useEffect(() => {
    if (!added) return
    const id = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(id)
  }, [added])

  return (
    <article className="product-card">
      {/* Duplicate link for pointer users; hidden from keyboard/AT (name link is canonical). */}
      <div className="product-card__media-wrap">
        <Link to={href} className="product-card__art-link" tabIndex={-1} aria-hidden="true">
          <ProductArt product={product} />
        </Link>
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
          {product.substitute && <span className="product-card__sub-hint" title={`Alternative: ${product.substitute}`}>Generic available</span>}
        </div>
        <h3 className="product-card__name"><Link to={href}>{product.name}</Link></h3>
        <p className="product-card__pack">{product.pack}</p>
        {product.composition && (
          <p className="product-card__salt" title={product.composition}>
            <Icon name="pill" size={12} /> {product.composition}
          </p>
        )}
        <div className="product-card__badges">
          {product.rx && <span className="badge badge--rx" title="Prescription required">Rx · Prescription</span>}
          <span className={`badge ${product.inStock ? 'badge--ok' : 'badge--out'}`}>
            {product.inStock ? 'In stock' : 'Out of stock'}
          </span>
        </div>
        <div className="product-card__foot">
          <PriceTag product={product} />
          {product.inStock ? (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                add(product.id)
                setAdded(true)
              }}
              aria-label={`Add ${product.name} to cart`}
            >
              {added ? <><Icon name="check" size={16} /> Added</> : 'Add to cart'}
            </button>
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
        <span className="sr-only" role="status">{added ? `${product.name} added to cart` : ''}</span>
      </div>
    </article>
  )
}
