import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { CATEGORIES, categoryName, formatPrice } from '../data/products.js'
import Icon from './Icon.jsx'
import './ProductCard.css'

export default function ProductCard({ product }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)
  const icon = CATEGORIES.find((c) => c.id === product.category)?.icon ?? 'pill'

  useEffect(() => {
    if (!added) return
    const id = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(id)
  }, [added])

  return (
    <article className="product-card">
      {/* Fixed aspect-ratio art block: no image download, no layout shift. */}
      <div className={`product-card__art product-card__art--${product.category}`} aria-hidden="true">
        <Icon name={icon} size={44} strokeWidth={1.5} />
      </div>
      <div className="product-card__body">
        <p className="product-card__cat">{categoryName(product.category)}</p>
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__pack">{product.pack}</p>
        <div className="product-card__badges">
          {product.rx && <span className="badge badge--rx" title="Prescription required">Rx · Prescription required</span>}
          <span className={`badge ${product.inStock ? 'badge--ok' : 'badge--out'}`}>
            {product.inStock ? 'In stock' : 'Out of stock'}
          </span>
        </div>
        <div className="product-card__foot">
          <p className="product-card__price">{formatPrice(product.price)}</p>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            disabled={!product.inStock}
            onClick={() => {
              add(product.id)
              setAdded(true)
            }}
            aria-label={product.inStock ? `Add ${product.name} to cart` : `${product.name} is out of stock`}
          >
            {added ? <><Icon name="check" size={16} /> Added</> : product.inStock ? 'Add to cart' : 'Unavailable'}
          </button>
        </div>
        <span className="sr-only" role="status">{added ? `${product.name} added to cart` : ''}</span>
      </div>
    </article>
  )
}
