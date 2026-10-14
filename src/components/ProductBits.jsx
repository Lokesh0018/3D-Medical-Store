import { CATEGORIES, discountPercent, formatPrice } from '../data/products.js'
import Icon from './Icon.jsx'

/**
 * Product visual: a real photo when `product.image` is set, otherwise the
 * category illustration. Both keep a fixed aspect ratio (no layout shift).
 */
export function ProductArt({ product, className = '', eager = false }) {
  const icon = CATEGORIES.find((c) => c.id === product.category)?.icon ?? 'pill'
  if (product.image) {
    return (
      <div className={`product-art product-art--photo ${className}`}>
        <img
          src={product.image.src}
          width={product.image.width}
          height={product.image.height}
          alt={product.image.alt ?? product.name}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
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
