import { useState } from 'react'
import { CATEGORIES, discountPercent, formatPrice } from '../data/products.js'
import Icon from './Icon.jsx'

/**
 * Product visual: a real photo when `product.image` is set and valid, otherwise the
 * category illustration. Both keep a fixed aspect ratio (no layout shift).
 */
export function ProductArt({ product, className = '', eager = false }) {
  const [imgError, setImgError] = useState(false)
  const icon = CATEGORIES.find((c) => c.id === product.category)?.icon ?? 'pill'

  if (product.image && !imgError) {
    return (
      <div className={`product-art product-art--photo ${className}`}>
        <img
          src={product.image.src}
          width={product.image.width || 600}
          height={product.image.height || 375}
          alt={product.image.alt ?? product.name}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }
  return (
    <div className={`product-art product-art--${product.category} ${className}`} aria-hidden="true">
      <Icon name={icon} size={44} strokeWidth={1.5} />
    </div>
  )
}

/** Selling price with MRP and saving (MRP is shown struck through). */
export function PriceTag({ product, size = 'md' }) {
  const off = discountPercent(product)
  return (
    <p className={`price-tag price-tag--${size}`}>
      <span className="price-tag__price">{formatPrice(product.price)}</span>
      {off > 0 && (
        <>
          <span className="price-tag__mrp"><span className="sr-only">MRP </span><s>{formatPrice(product.mrp)}</s></span>
          <span className="price-tag__off">{off}% off</span>
        </>
      )}
    </p>
  )
}
