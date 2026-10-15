import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ParticleSection from '../particles/ParticleSection.jsx'
import ProductCard from '../components/ProductCard.jsx'
import PrescriptionModal from '../components/PrescriptionModal.jsx'
import StructuredData from '../components/StructuredData.jsx'
import Icon from '../components/Icon.jsx'
import { PriceTag, ProductArt } from '../components/ProductBits.jsx'
import { useCart } from '../context/CartContext.jsx'
import { PRODUCTS, categoryName, requestLink } from '../data/products.js'
import { STORE, prescriptionLink, whatsappLink } from '../data/store.js'
import { productSchema } from '../seo/structuredData.js'
import NotFound from './NotFound.jsx'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const product = PRODUCTS.find((p) => p.id === id)
  if (!product) return <NotFound />
  // Keyed so quantity/feedback state resets when moving between products.
  return <ProductView key={product.id} product={product} />
}

function ProductView({ product }) {
  const { setQty, lines, setOpen } = useCart()
  const inCart = lines.find((l) => l.product.id === product.id)?.qty ?? 0
  const [qty, setLocalQty] = useState(1)
  const [status, setStatus] = useState('')
  const [rxModalOpen, setRxModalOpen] = useState(false)
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3)

  const addToCart = () => {
    setQty(product.id, inCart + qty)
    setStatus(`${qty} × ${product.name} added to cart`)
  }

  return (
    <>
      <ParticleSection preset="productDetail" className="page-hero page-hero--compact section--dark" aria-labelledby="product-title">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to={`/products?category=${product.category}`}>{categoryName(product.category)}</Link></li>
              <li aria-current="page">{product.name}</li>
            </ol>
          </nav>
          <h1 id="product-title" className="page-hero__title page-hero__title--product">{product.name}</h1>
          <p className="page-hero__lead">{product.pack}</p>
        </div>
      </ParticleSection>

      <section className="section--light product-detail" aria-label="Product details">
        <div className="container product-detail__grid">
          <ProductArt product={product} className="product-detail__art" eager />

          <div className="product-detail__buy">
            <p className="product-card__cat">{categoryName(product.category)}</p>
            <PriceTag product={product} size="lg" />
            <p className="product-detail__tax">Inclusive of all taxes. Final price is confirmed with your order.</p>

            <div className="product-card__badges">
              {product.rx && <span className="badge badge--rx">Rx · Prescription required</span>}
              <span className={`badge ${product.inStock ? 'badge--ok' : 'badge--out'}`}>
                {product.inStock ? 'In stock' : 'Out of stock'}
              </span>
            </div>

            {product.substitute && (
              <div className="product-detail__substitute">
                <Icon name="sparkles" size={16} />
                <span><strong>Affordable Alternative:</strong> {product.substitute}</span>
              </div>
            )}

            {product.description && <p className="product-detail__desc">{product.description}</p>}

            <dl className="product-detail__facts">
              <div><dt>Pack size</dt><dd>{product.pack}</dd></div>
              <div><dt>Category</dt><dd>{categoryName(product.category)}</dd></div>
              <div><dt>Prescription</dt><dd>{product.rx ? 'Required' : 'Not required'}</dd></div>
              {product.composition && <div><dt>Active Composition</dt><dd>{product.composition}</dd></div>}
              {product.dosage && <div><dt>Dosage &amp; Use</dt><dd>{product.dosage}</dd></div>}
            </dl>

            {product.rx && (
              <div className="product-detail__rx" role="note">
                <Icon name="rx" size={20} />
                <div>
                  <p>This medicine is dispensed only against a valid prescription.</p>
                  <button
                    type="button"
                    className="link-button link-button--ink"
                    style={{ textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}
                    onClick={() => setRxModalOpen(true)}
                  >
                    Upload Prescription Online
                  </button>
                </div>
              </div>
            )}

            {product.inStock ? (
              <div className="product-detail__actions">
                <div className="qty qty--light" role="group" aria-label="Quantity">
                  <button type="button" onClick={() => setLocalQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                    <Icon name="minus" size={16} />
                  </button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => setLocalQty((q) => Math.min(20, q + 1))} aria-label="Increase quantity">
                    <Icon name="plus" size={16} />
                  </button>
                </div>
                <button type="button" className="btn btn--primary btn--lg" onClick={addToCart}>
                  <Icon name="cart" size={18} /> Add to cart
                </button>
              </div>
            ) : (
              <a className="btn btn--primary btn--lg" href={requestLink(product)} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" size={18} /> Request this item
              </a>
            )}

            <p className="product-detail__status" role="status">
              {status && (
                <>
                  {status}.{' '}
                  <button type="button" className="link-button link-button--ink" onClick={() => setOpen(true)}>View cart</button>
                </>
              )}
            </p>

            <p className="product-detail__ask">
              <Icon name="chat" size={18} />
              Questions about this product?{' '}
              <a href={whatsappLink(`Hello, I have a question about ${product.name} (${product.pack}).`)} target="_blank" rel="noopener noreferrer">
                Ask our pharmacist
              </a>{' '}
              or call <a href={STORE.phoneHref}>{STORE.phoneDisplay}</a>.
            </p>
          </div>
        </div>

        {related.length > 0 && (
          <div className="container product-detail__related">
            <h2 className="section-title section-title--ink">More in {categoryName(product.category)}</h2>
            <div className="product-grid">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </section>
      <StructuredData data={productSchema(product)} />
      <PrescriptionModal isOpen={rxModalOpen} onClose={() => setRxModalOpen(false)} />
    </>
  )
}
