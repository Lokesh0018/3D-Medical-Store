import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import ParticleSection from '../particles/ParticleSection.jsx'
import ProductCard from '../components/ProductCard.jsx'
import QuickViewModal from '../components/QuickViewModal.jsx'
import Icon from '../components/Icon.jsx'
import { CATEGORIES, PRODUCTS, categoryName } from '../data/products.js'
import { prescriptionLink } from '../data/store.js'
import './Products.css'

export default function Products() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ?? 'all'
  // Local state keeps typing instant; the URL mirrors it for shareable links.
  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const [sortBy, setSortBy] = useState('featured')
  const [stockOnly, setStockOnly] = useState(false)
  const [rxFilter, setRxFilter] = useState('all') // 'all', 'otc', 'rx'
  const [quickProduct, setQuickProduct] = useState(null)
  const searchRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    if (location.state?.focusSearch) searchRef.current?.focus()
  }, [location.state, location.key])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = PRODUCTS.filter((p) => {
      const matchCat = category === 'all' || p.category === category
      const matchQuery = !q ||
        p.name.toLowerCase().includes(q) ||
        p.pack.toLowerCase().includes(q) ||
        (p.composition && p.composition.toLowerCase().includes(q)) ||
        (p.substitute && p.substitute.toLowerCase().includes(q))
      const matchStock = !stockOnly || p.inStock
      const matchRx = rxFilter === 'all' || (rxFilter === 'rx' ? p.rx : !p.rx)
      return matchCat && matchQuery && matchStock && matchRx
    })

    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name))
    } else {
      // featured default
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }

    return list
  }, [category, query, stockOnly, rxFilter, sortBy])

  const update = (key, value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (!value || value === 'all') next.delete(key)
      else next.set(key, value)
      return next
    }, { replace: true, preventScrollReset: true })
  }

  const resetAllFilters = () => {
    setQuery('')
    setStockOnly(false)
    setRxFilter('all')
    setSortBy('featured')
    setParams({}, { replace: true, preventScrollReset: true })
  }

  return (
    <>
      <ParticleSection preset="productsHero" className="page-hero section--dark" aria-labelledby="products-title">
        <div className="container">
          <p className="eyebrow">Shop</p>
          <h1 id="products-title" className="page-hero__title">Medicines &amp; health essentials</h1>
          <p className="page-hero__lead">
            Search genuine pharmaceuticals, healthcare devices and wellness essentials.
            Have a prescription? <a href={prescriptionLink()} target="_blank" rel="noopener noreferrer">Send us a photo</a>.
          </p>

          <form className="catalog-search" role="search" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="product-search" className="sr-only">Search products by name or salt</label>
            <Icon name="search" size={18} />
            <input
              ref={searchRef}
              id="product-search"
              type="search"
              placeholder="Search by medicine name, salt or brand…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                update('q', e.target.value)
              }}
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className="catalog-search__clear"
                onClick={() => {
                  setQuery('')
                  update('q', '')
                }}
                aria-label="Clear search"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </form>

          <div className="chips" role="group" aria-label="Filter by category">
            {[{ id: 'all', name: 'All Categories' }, ...CATEGORIES].map((c) => (
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
          {/* Controls Bar: Sort, Stock Filter, Rx Type Filter */}
          <div className="catalog__controls-bar">
            <div className="catalog__filters-group">
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={stockOnly}
                  onChange={(e) => setStockOnly(e.target.checked)}
                />
                <span>In Stock only</span>
              </label>

              <div className="filter-tabs" role="group" aria-label="Prescription requirement">
                <button
                  type="button"
                  className={`filter-tab${rxFilter === 'all' ? ' is-active' : ''}`}
                  onClick={() => setRxFilter('all')}
                >
                  All Types
                </button>
                <button
                  type="button"
                  className={`filter-tab${rxFilter === 'otc' ? ' is-active' : ''}`}
                  onClick={() => setRxFilter('otc')}
                >
                  OTC Only
                </button>
                <button
                  type="button"
                  className={`filter-tab${rxFilter === 'rx' ? ' is-active' : ''}`}
                  onClick={() => setRxFilter('rx')}
                >
                  Rx Only
                </button>
              </div>
            </div>

            <div className="catalog__sort-wrap">
              <label htmlFor="catalog-sort" className="catalog__sort-label">
                <Icon name="sort" size={16} /> Sort by:
              </label>
              <select
                id="catalog-sort"
                className="catalog__sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured / Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Product Name (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="catalog__status-row">
            <h2 id="results-title" className="catalog__count" aria-live="polite">
              {results.length} {results.length === 1 ? 'product' : 'products'} found
              {category !== 'all' && <> in <strong>{categoryName(category)}</strong></>}
            </h2>
            {(query || stockOnly || rxFilter !== 'all' || category !== 'all') && (
              <button type="button" className="link-button link-button--ink" onClick={resetAllFilters}>
                Reset all filters
              </button>
            )}
          </div>

          {results.length > 0 ? (
            <div className="product-grid">
              {results.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onQuickView={(prod) => setQuickProduct(prod)}
                />
              ))}
            </div>
          ) : (
            <div className="catalog__empty">
              <Icon name="search" size={48} className="catalog__empty-icon" />
              <h3>No matching medicines or products found</h3>
              <p>We couldn't find any items matching your active search and filter combinations.</p>
              <div className="catalog__empty-actions">
                <button type="button" className="btn btn--primary" onClick={resetAllFilters}>
                  Clear all filters
                </button>
                <a
                  className="btn btn--outline"
                  href={prescriptionLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="whatsapp" size={16} /> Ask Pharmacist to Arrange It
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {quickProduct && (
        <QuickViewModal
          product={quickProduct}
          onClose={() => setQuickProduct(null)}
        />
      )}
    </>
  )
}
