import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import ParticleSection from '../particles/ParticleSection.jsx'
import ProductCard from '../components/ProductCard.jsx'
import Icon from '../components/Icon.jsx'
import { CATEGORIES, PRODUCTS, categoryName } from '../data/products.js'
import { prescriptionLink } from '../data/store.js'
import usePageTitle from '../hooks/usePageTitle.js'
import './Products.css'

export default function Products() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ?? 'all'
  // Local state keeps typing instant; the URL mirrors it for shareable links.
  const [query, setQuery] = useState(() => params.get('q') ?? '')
  usePageTitle(category === 'all' ? 'Products' : categoryName(category))
  const searchRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    if (location.state?.focusSearch) searchRef.current?.focus()
  }, [location.state, location.key])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PRODUCTS.filter((p) =>
      (category === 'all' || p.category === category) &&
      (!q || p.name.toLowerCase().includes(q) || p.pack.toLowerCase().includes(q)))
  }, [category, query])

  const update = (key, value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (!value || value === 'all') next.delete(key)
      else next.set(key, value)
      return next
    }, { replace: true, preventScrollReset: true })
  }

  return (
    <>
      <ParticleSection preset="productsHero" className="page-hero section--dark" aria-labelledby="products-title">
        <div className="container">
          <p className="eyebrow">Shop</p>
          <h1 id="products-title" className="page-hero__title">Medicines &amp; health essentials</h1>
          <p className="page-hero__lead">
            Search the catalogue, add items to your cart and send your order on WhatsApp or by phone.
            Have a prescription? <a href={prescriptionLink()} target="_blank" rel="noopener noreferrer">Send us a photo</a>.
          </p>

          <form className="catalog-search" role="search" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="product-search" className="sr-only">Search products</label>
            <Icon name="search" size={18} />
            <input
              ref={searchRef}
              id="product-search"
              type="search"
              placeholder="Search by product name…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                update('q', e.target.value)
              }}
              autoComplete="off"
            />
          </form>

          <div className="chips" role="group" aria-label="Filter by category">
            {[{ id: 'all', name: 'All' }, ...CATEGORIES].map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip${category === c.id ? ' is-active' : ''}`}
                aria-pressed={category === c.id}
                onClick={() => update('category', c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </ParticleSection>

      <section className="section--light catalog" aria-labelledby="results-title">
        <div className="container">
          <h2 id="results-title" className="catalog__count" aria-live="polite">
            {results.length} {results.length === 1 ? 'product' : 'products'}
            {category !== 'all' && <> in {categoryName(category)}</>}
          </h2>
          {results.length > 0 ? (
            <div className="product-grid">
              {results.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="catalog__empty">
              <p>No products match your search. Can't find something? Message us — we may be able to arrange it.</p>
              <button type="button" className="btn btn--outline" onClick={() => {
                setQuery('')
                setParams({}, { replace: true, preventScrollReset: true })
              }}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
