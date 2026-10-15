import { useMemo, useRef, useState } from 'react'
import ParticleSection from '../particles/ParticleSection.jsx'
import ProductCard from '../components/ProductCard.jsx'
import QuickViewModal from '../components/QuickViewModal.jsx'
import PrescriptionModal from '../components/PrescriptionModal.jsx'
import Icon from '../components/Icon.jsx'
import { CATEGORIES, PRODUCTS, categoryName } from '../data/products.js'
import { SERVICES, STORE, directionsLink, hoursText, prescriptionLink, whatsappLink } from '../data/store.js'
import TrustStrip from '../components/TrustStrip.jsx'
import OpenStatus from '../components/OpenStatus.jsx'
import Faq from '../components/Faq.jsx'
import StructuredData from '../components/StructuredData.jsx'
import DeliveryCountdown from '../components/DeliveryCountdown.jsx'
import { pharmacySchema } from '../seo/structuredData.js'
import './Home.css'

/**
 * Per-service footer: one concrete detail and a direct next step. Details come
 * from store data only (no invented claims); 'countdown' renders the live
 * delivery estimate.
 */
const SERVICE_EXTRAS = {
  prescriptions: {
    detailIcon: 'check',
    detail: `Checked by ${STORE.pharmacist.name}, ${STORE.pharmacist.qualification.split(' · ')[0]}`,
    action: 'rx',
    label: 'Upload prescription',
  },
  delivery: {
    detail: 'countdown',
    label: 'Check your area',
    message: 'Hello, do you deliver to my area? My address is: ',
  },
  'order-ahead': {
    detailIcon: 'clock',
    detail: `Counter open ${STORE.hours[0].label}, ${hoursText(STORE.hours[0])}`,
    label: 'Send your list',
    message: 'Hello, I would like to order ahead for pickup. My list: ',
  },
  advice: {
    detailIcon: 'chat',
    detail: 'In store or on WhatsApp',
    label: 'Ask a pharmacist',
    message: 'Hello, I have a question about my medicines.',
  },
}

const POPULAR_SEARCHES =['Paracetamol', 'ORS', 'Thermometer', 'Vitamin C']
const ABOUT_POINTS = [
  { icon: 'shield', title: 'Genuine stock', body: 'Medicines sourced only from authorised distributors.' },
  { icon: 'rx', title: 'Pharmacist-checked', body: 'Every prescription reviewed by a registered pharmacist.' },
  { icon: 'leaf', title: 'Stored right', body: 'Kept as per manufacturer temperature guidance.' },
]
const initials = (name) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()

const EMPTY_FORM = { name: '', phone: '', message: '' }

function validateContact(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Please enter your name.'
  if (!/^[+\d][\d\s-]{7,}$/.test(values.phone.trim())) errors.phone = 'Please enter a valid phone number.'
  if (values.message.trim().length < 5) errors.message = 'Please tell us what you need.'
  return errors
}

/**
 * Reserved space for the particle cross. The particle layer measures this box
 * (data-particle-anchor) to place the cross, which assembles directly from
 * particles on load. The static dotted cross (same proportions, arm width ≈
 * 0.35 of the span) is shown only to visitors without the 3D layer.
 */
function HeroVisual() {
  return (
    <div className="hero__visual" data-particle-anchor aria-hidden="true">
      <span className="hero__glow" />
      <svg className="hero__fallback" viewBox="0 0 100 100" focusable="false">
        <defs>
          <pattern id="hero-dots" width="3.2" height="3.2" patternUnits="userSpaceOnUse">
            <circle cx="1.6" cy="1.6" r="0.55" />
          </pattern>
        </defs>
        <path
          className="hero__fallback-fill"
          d="M32.5 0h35v32.5H100v35H67.5V100h-35V67.5H0v-35h32.5z"
        />
        <path
          className="hero__fallback-rim"
          d="M32.5 0h35v32.5H100v35H67.5V100h-35V67.5H0v-35h32.5z"
        />
      </svg>
    </div>
  )
}

export default function Home() {
  const [quickProduct, setQuickProduct] = useState(null)
  const [rxModalOpen, setRxModalOpen] = useState(false)

  // Products filter & search state (contained directly on the single page)
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [stockOnly, setStockOnly] = useState(false)
  const [rxFilter, setRxFilter] = useState('all') // 'all', 'otc', 'rx'
  const [showAllProducts, setShowAllProducts] = useState(false)
  const searchInputRef = useRef(null)

  // Contact form state
  const [contactValues, setContactValues] = useState(EMPTY_FORM)
  const [contactErrors, setContactErrors] = useState({})
  const [contactSent, setContactSent] = useState(false)

  const handleContactChange = (e) =>
    setContactValues((v) => ({ ...v, [e.target.name]: e.target.value }))

  const handleContactSubmit = (e) => {
    e.preventDefault()
    const errs = validateContact(contactValues)
    setContactErrors(errs)
    if (Object.keys(errs).length) {
      document.getElementById(`contact-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    const text = `Hello ${STORE.name},\nName: ${contactValues.name}\nPhone: ${contactValues.phone}\n\n${contactValues.message}`
    window.open(whatsappLink(text), '_blank', 'noopener,noreferrer')
    setContactSent(true)
    setContactValues(EMPTY_FORM)
  }

  // Helper to scroll to any section smoothly and sync URL hash
  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      try {
        const newHash = id === 'hero' ? '' : `#${id}`
        window.history.pushState(null, '', window.location.pathname + newHash)
      } catch {
        /* ignore */
      }
    }
  }

  // Trigger search from Hero or Quick search chips
  const handleHeroSearch = (term) => {
    setQuery(term)
    scrollTo('products')
    setTimeout(() => searchInputRef.current?.focus(), 400)
  }

  const handleCategorySelect = (catId) => {
    setCategory(catId)
    setShowAllProducts(false)
    scrollTo('products')
  }

  const resetAllFilters = () => {
    setQuery('')
    setCategory('all')
    setStockOnly(false)
    setRxFilter('all')
    setSortBy('featured')
    setShowAllProducts(false)
  }

  // Filtered & sorted products list
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = PRODUCTS.filter((p) => {
      const matchCat = category === 'all' || p.category === category
      const matchQuery =
        !q ||
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
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }

    return list
  }, [category, query, stockOnly, rxFilter, sortBy])

  // Initial limit: 8 products; "Show More" expands to full list
  const INITIAL_PRODUCT_LIMIT = 8
  const hasMoreProducts = filteredProducts.length > INITIAL_PRODUCT_LIMIT
  const displayedProducts = showAllProducts
    ? filteredProducts
    : filteredProducts.slice(0, INITIAL_PRODUCT_LIMIT)

  return (
    <>
      {/* Hero — particles gather into a medical cross */}
      <ParticleSection preset="hero" id="hero" className="hero section--dark" aria-labelledby="hero-title">
        <div className="container hero__inner">
          <div className="hero__copy">
            {/* Interactive Verified Pharmacist Guarantee Badge */}
            <div className="hero__badge-row">
              <span className="hero__guarantee-pill">
                <Icon name="shield" size={15} />
                <span>100% Genuine Medicines · Licensed Pharmacist Checked</span>
              </span>
            </div>

            <h1 id="hero-title" className="hero__title">
              <span className="hero__title-line">Genuine medicines,</span>{' '}
              <span className="hero__title-line text-gradient">delivered with care.</span>
            </h1>
            <p className="hero__lead">
              Prescription and everyday health essentials from {STORE.name}, checked by our pharmacist
              before every order is packed.
            </p>

            <div className="hero-search">
              <form
                className="hero-search__form"
                role="search"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleHeroSearch(query)
                }}
              >
                <label htmlFor="hero-search" className="sr-only">Search medicines and health products</label>
                <Icon name="search" size={20} className="hero-search__icon" />
                <input
                  id="hero-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search medicines, devices, baby care…"
                  autoComplete="off"
                />
                <button type="submit" className="btn btn--primary">Search</button>
              </form>

              {/* Category Ticker Marquee constrained to hero search width */}
              <div
                className="hero-marquee"
                role="region"
                aria-label="Popular Categories"
              >
                <div className="hero-marquee__track" aria-hidden="true">
                  {/* First set */}
                  <div className="hero-marquee__group">
                    <span className="quick-pill quick-pill--medicines">
                      <Icon name="pill" size={14} /> <span>Medicines</span>
                    </span>
                    <span className="quick-pill quick-pill--wellness">
                      <Icon name="leaf" size={14} /> <span>Daily Vitamins</span>
                    </span>
                    <span className="quick-pill quick-pill--devices">
                      <Icon name="device" size={14} /> <span>Health Devices</span>
                    </span>
                    <span className="quick-pill quick-pill--baby">
                      <Icon name="baby" size={14} /> <span>Baby Care</span>
                    </span>
                  </div>

                  {/* Duplicate set for seamless infinite loop */}
                  <div className="hero-marquee__group">
                    <span className="quick-pill quick-pill--medicines">
                      <Icon name="pill" size={14} /> <span>Medicines</span>
                    </span>
                    <span className="quick-pill quick-pill--wellness">
                      <Icon name="leaf" size={14} /> <span>Daily Vitamins</span>
                    </span>
                    <span className="quick-pill quick-pill--devices">
                      <Icon name="device" size={14} /> <span>Health Devices</span>
                    </span>
                    <span className="quick-pill quick-pill--baby">
                      <Icon name="baby" size={14} /> <span>Baby Care</span>
                    </span>
                  </div>
                </div>
              </div>

              <p className="hero-search__popular">
                <span className="hero-search__label">Popular:</span>
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="hero-search__chip-btn"
                    onClick={() => handleHeroSearch(term)}
                  >
                    {term}
                  </button>
                ))}
              </p>
            </div>

            <div className="hero__ctas">
              <button
                type="button"
                className="btn btn--soft btn--lg"
                onClick={() => setRxModalOpen(true)}
              >
                <Icon name="rx" size={18} /> Upload prescription
              </button>
              <a
                href="#products"
                className="btn btn--outline btn--lg"
                onClick={(e) => {
                  e.preventDefault()
                  scrollTo('products')
                }}
              >
                Browse products <Icon name="arrow" size={18} />
              </a>
            </div>
            <ul className="hero__facts">
              <li><OpenStatus /></li>
              <li><DeliveryCountdown /></li>
              <li><Icon name="delivery" size={16} /> Free local delivery above ₹500</li>
            </ul>
          </div>
          <HeroVisual />
        </div>
      </ParticleSection>

      <TrustStrip />

      {/* About — particles become a DNA helix */}
      <ParticleSection preset="about" id="about" className="split section--dark" aria-labelledby="about-title">
        <div className="container split__inner split__inner--right">
          <div className="split__copy about">
            <p className="eyebrow"><span className="eyebrow__dot" aria-hidden="true" />About the pharmacy</p>
            <h2 id="about-title" className="about__title">
              Pharmacy care, rooted in <span className="text-gradient">your neighbourhood</span>
            </h2>
            <p className="about__lead">
              {STORE.name} stocks medicines, wellness products and personal care essentials for families nearby.
              Ask us anything about your medicines — we are here to help you take them safely.
            </p>
            {STORE.photos.storefront && (
              <img
                className="split__photo"
                src={STORE.photos.storefront.src}
                width={STORE.photos.storefront.width}
                height={STORE.photos.storefront.height}
                alt={STORE.photos.storefront.alt}
                loading="lazy"
                decoding="async"
              />
            )}
            <ul className="about__points">
              {ABOUT_POINTS.map((point) => (
                <li key={point.title}>
                  <span className="about__icon" aria-hidden="true"><Icon name={point.icon} size={20} /></span>
                  <span>
                    <strong>{point.title}</strong>
                    <span className="about__point-body">{point.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="about__signoff">
              <span className="about__avatar" aria-hidden="true">{initials(STORE.pharmacist.name)}</span>
              <div className="about__person">
                <div className="about__person-header">
                  <strong>{STORE.pharmacist.name}</strong>
                  <span className="cert-badge" title="Council Verified Pharmacist">
                    <Icon name="check" size={13} strokeWidth={2.5} /> Verified
                  </span>
                </div>
                <span>{STORE.pharmacist.qualification}</span>
                <span className="about__reg-num">{STORE.pharmacist.regNo} · {STORE.pharmacist.council}</span>
              </div>
              <a
                className="about__link"
                href={directionsLink()}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open Google Maps directions to ${STORE.name}`}
              >
                Visit the store <Icon name="arrow" size={16} />
              </a>
            </div>
          </div>
        </div>
      </ParticleSection>

      {/* Categories — particles form a molecule */}
      <ParticleSection preset="categories" id="categories" className="split section--dark" aria-labelledby="cat-title">
        <div className="container split__inner">
          <div className="split__copy split__copy--wide category-showcase">
            <div className="category-showcase__header">
              <span className="eyebrow"><span className="eyebrow__dot" aria-hidden="true" />Shop by category</span>
              <h2 id="cat-title" className="section-title">
                Everything for <span className="text-gradient">everyday health</span>
              </h2>
              <p className="category-showcase__sub">
                Explore pharmacy-grade formulations, daily wellness essentials, and clinical care kits curated by licensed pharmacists.
              </p>
            </div>

            <ul className="category-grid" role="list">
              {CATEGORIES.map((c) => {
                const count = PRODUCTS.filter((p) => p.category === c.id).length
                const isActive = category === c.id
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => handleCategorySelect(c.id)}
                      className={`category-card category-card--${c.id}${isActive ? ' is-active' : ''}`}
                      aria-pressed={isActive}
                    >
                      <div className="category-card__visual">
                        <span className="category-card__icon" aria-hidden="true">
                          <Icon name={c.icon} size={22} strokeWidth={2} />
                        </span>
                        <span className="category-card__count">{count} {count === 1 ? 'item' : 'items'}</span>
                      </div>
                      <div className="category-card__content">
                        <span className="category-card__name">{c.name}</span>
                        <span className="category-card__blurb">{c.blurb}</span>
                      </div>
                      <span className="category-card__arrow" aria-hidden="true">
                        <Icon name="arrow" size={15} />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="category-showcase__footer">
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => {
                  setCategory('all')
                  scrollTo('products')
                }}
              >
                <span>View Full Inventory ({PRODUCTS.length} products)</span>
                <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
        </div>
      </ParticleSection>

      {/* Full Products Catalog Section */}
      <section id="products" className="section--light catalog-section" aria-labelledby="products-catalog-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow eyebrow--light">Complete Pharmacy Store</p>
              <h2 id="products-catalog-title" className="section-title">Medicines &amp; Health Essentials</h2>
            </div>
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => setRxModalOpen(true)}
            >
              <Icon name="rx" size={16} /> Upload Prescription
            </button>
          </div>

          {/* Search bar inside products catalog */}
          <div className="catalog-search-wrap">
            <form className="catalog-search" role="search" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="catalog-product-search" className="sr-only">Search products by name or salt</label>
              <Icon name="search" size={18} />
              <input
                ref={searchInputRef}
                id="catalog-product-search"
                type="search"
                placeholder="Search by medicine name, salt or brand…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="catalog-search__clear"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </form>

            {/* Category chips filter */}
            <div className="chips" role="group" aria-label="Filter by category">
              {[{ id: 'all', name: 'All Categories' }, ...CATEGORIES].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip${category === c.id ? ' is-active' : ''}`}
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Controls Bar: Sort, Stock Filter, Rx Type Filter */}
          <div className="catalog__controls-bar">
            <div className="catalog__filters-group">
              <label className={`filter-checkbox${stockOnly ? ' is-checked' : ''}`}>
                <input
                  type="checkbox"
                  className="filter-checkbox__input sr-only"
                  checked={stockOnly}
                  onChange={(e) => setStockOnly(e.target.checked)}
                />
                <span className="filter-checkbox__box" aria-hidden="true">
                  <svg viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1 5L4.5 8.5L11 1.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="filter-checkbox__label">
                  <span className="filter-checkbox__dot" aria-hidden="true" />
                  In Stock Only
                </span>
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

          {/* Results count, active filter badges & reset */}
          <div className="catalog__status-row">
            <div className="catalog__status-left">
              <h3 className="catalog__count" aria-live="polite">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                {category !== 'all' && <> in <strong>{categoryName(category)}</strong></>}
              </h3>

              {/* Active Filter Badges with remove buttons */}
              {(query || stockOnly || rxFilter !== 'all' || category !== 'all') && (
                <div className="catalog__active-badges" role="group" aria-label="Active filters">
                  {category !== 'all' && (
                    <button
                      type="button"
                      className="active-filter-badge"
                      onClick={() => setCategory('all')}
                      aria-label={`Remove ${categoryName(category)} filter`}
                    >
                      <span>Category: {categoryName(category)}</span>
                      <Icon name="close" size={13} />
                    </button>
                  )}
                  {query && (
                    <button
                      type="button"
                      className="active-filter-badge"
                      onClick={() => setQuery('')}
                      aria-label={`Clear search for ${query}`}
                    >
                      <span>Query: "{query}"</span>
                      <Icon name="close" size={13} />
                    </button>
                  )}
                  {stockOnly && (
                    <button
                      type="button"
                      className="active-filter-badge"
                      onClick={() => setStockOnly(false)}
                      aria-label="Remove in stock only filter"
                    >
                      <span>In Stock Only</span>
                      <Icon name="close" size={13} />
                    </button>
                  )}
                  {rxFilter !== 'all' && (
                    <button
                      type="button"
                      className="active-filter-badge"
                      onClick={() => setRxFilter('all')}
                      aria-label={`Remove ${rxFilter.toUpperCase()} filter`}
                    >
                      <span>Type: {rxFilter.toUpperCase()}</span>
                      <Icon name="close" size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {(query || stockOnly || rxFilter !== 'all' || category !== 'all') && (
              <button type="button" className="link-button link-button--ink" onClick={resetAllFilters}>
                Reset all filters
              </button>
            )}
          </div>

          {/* Product grid with 8 items initial limit + Show More toggle */}
          {filteredProducts.length > 0 ? (
            <>
              <div className="product-grid" role="region" aria-label="Products Catalogue">
                {displayedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onQuickView={(prod) => setQuickProduct(prod)}
                  />
                ))}
              </div>

              {/* Show More / Show Less Action Area */}
              {hasMoreProducts && (
                <div className="catalog__show-more-wrap">
                  <div className="catalog__show-more-count">
                    <span>
                      Showing <strong>{displayedProducts.length}</strong> of <strong>{filteredProducts.length}</strong> products
                    </span>
                    <div className="catalog__progress-bar" role="progressbar" aria-valuenow={displayedProducts.length} aria-valuemin="0" aria-valuemax={filteredProducts.length}>
                      <span
                        className="catalog__progress-fill"
                        style={{ width: `${Math.round((displayedProducts.length / filteredProducts.length) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="catalog__show-more-actions">
                    {!showAllProducts ? (
                      <button
                        type="button"
                        className="btn btn--primary btn--lg catalog__show-more-btn"
                        onClick={() => setShowAllProducts(true)}
                      >
                        <span>Show All {filteredProducts.length} Products</span>
                        <Icon name="arrow" size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--outline catalog__show-less-btn"
                        onClick={() => {
                          setShowAllProducts(false)
                          document.getElementById('products-catalog-title')?.scrollIntoView({ behavior: 'smooth' })
                        }}
                      >
                        <span>Show Less (Show first 8)</span>
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
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

      {/* Services & delivery — heartbeat waveform */}
      <ParticleSection preset="services" id="services" className="services section--dark" aria-labelledby="services-title">
        <div className="container">
          <div className="services__head">
            <p className="eyebrow"><span className="eyebrow__dot" aria-hidden="true" />Services &amp; delivery</p>
            <h2 id="services-title" className="services__title">Care that keeps pace with you</h2>
            <p className="services__lead">
              From checking your prescription to bringing it to your door, every order goes through our pharmacist.
            </p>
          </div>
          <div className="services__pulse" aria-hidden="true" />
          <ul className="service-grid">
            {SERVICES.map((s) => {
              const extra = SERVICE_EXTRAS[s.id]
              return (
                <li key={s.id} className="service-card">
                  <span className="service-card__icon" aria-hidden="true"><Icon name={s.icon} size={22} /></span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                  {extra && (
                    <div className="service-card__foot">
                      {extra.detail === 'countdown'
                        ? <DeliveryCountdown compact className="service-card__countdown" />
                        : <span className="service-card__detail"><Icon name={extra.detailIcon} size={14} /> {extra.detail}</span>}
                      {extra.action === 'rx' ? (
                        <button type="button" className="service-card__action" onClick={() => setRxModalOpen(true)}>
                          {extra.label} <Icon name="arrow" size={15} />
                        </button>
                      ) : (
                        <a
                          className="service-card__action"
                          href={whatsappLink(extra.message)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${extra.label} on WhatsApp (opens in a new tab)`}
                        >
                          {extra.label} <Icon name="arrow" size={15} />
                        </a>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Practical details people check before ordering. */}
          <dl className="service-facts">
            <div className="service-facts__item">
              <dt><span className="service-facts__icon" aria-hidden="true"><Icon name="clock" size={18} /></span> Store hours</dt>
              <dd>
                <ul className="service-facts__hours">
                  {STORE.hours.map((h) => (
                    <li key={h.label}><span>{h.label}</span> <span>{hoursText(h)}</span></li>
                  ))}
                </ul>
                <OpenStatus className="service-facts__status" />
              </dd>
            </div>
            <div className="service-facts__item">
              <dt><span className="service-facts__icon" aria-hidden="true"><Icon name="delivery" size={18} /></span> Delivery</dt>
              <dd>Doorstep delivery {STORE.delivery.radius}. {STORE.delivery.note}</dd>
            </div>
            <div className="service-facts__item">
              <dt><span className="service-facts__icon" aria-hidden="true"><Icon name="shield" size={18} /></span> Exchanges</dt>
              <dd>Items delivered damaged, expired or not as ordered are exchanged. Please check your order at delivery and tell us the same day.</dd>
            </div>
          </dl>
        </div>
      </ParticleSection>

      {/* How to order — particles form a capsule */}
      <ParticleSection preset="order" id="order" className="split section--dark" aria-labelledby="order-title">
        <div className="container split__inner">
          <div className="split__copy order">
            <p className="eyebrow"><span className="eyebrow__dot" aria-hidden="true" />How to order</p>
            <h2 id="order-title" className="order__title">Three simple steps</h2>
            <ol className="order-steps">
              <li>
                <span className="order-steps__num" aria-hidden="true">1</span>
                <div>
                  <h3>Send your list or prescription</h3>
                  <p>Message us on WhatsApp, call the store, or add items to your cart here.</p>
                  <ul className="order-steps__channels" aria-label="Ways to send your order">
                    <li><Icon name="whatsapp" size={14} /> WhatsApp</li>
                    <li><Icon name="phone" size={14} /> Phone</li>
                    <li><Icon name="cart" size={14} /> Online cart</li>
                  </ul>
                </div>
              </li>
              <li>
                <span className="order-steps__num" aria-hidden="true">2</span>
                <div>
                  <h3>We confirm availability and price</h3>
                  <p>We check stock and share the final price with you before your order is packed.</p>
                </div>
              </li>
              <li>
                <span className="order-steps__num" aria-hidden="true">3</span>
                <div>
                  <h3>Pick up or get it delivered</h3>
                  <p>Collect it from the counter, or get doorstep delivery {STORE.delivery.radius}.</p>
                </div>
              </li>
            </ol>
            <div className="order__ctas">
              <a className="btn btn--primary" href={whatsappLink('Hello, I would like to place an order.')} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" size={18} /> Start on WhatsApp
              </a>
              <button
                type="button"
                className="btn btn--soft"
                onClick={() => setRxModalOpen(true)}
              >
                <Icon name="rx" size={18} /> Upload prescription
              </button>
            </div>
            <p className="order__call">
              Prefer to talk?{' '}
              <a href={STORE.phoneHref}><Icon name="phone" size={16} /> Call {STORE.phoneDisplay}</a>
            </p>
            <p className="order__tip">
              <Icon name="info" size={16} />
              <span><strong>Keep handy:</strong> a clear photo of the prescription, the patient&rsquo;s name and your delivery address.</span>
            </p>
            <p className="split__note">
              Questions about prescriptions, delivery or payment?{' '}
              <a
                href="#faq"
                onClick={(e) => {
                  e.preventDefault()
                  scrollTo('faq')
                }}
              >
                Read the FAQ
              </a>
            </p>
          </div>
        </div>
      </ParticleSection>

      {/* Contact Section — embedded cleanly on Home */}
      <section id="contact" className="section--light contact-body" aria-labelledby="contact-info-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow eyebrow--light">Get In Touch</p>
              <h2 id="contact-info-title" className="section-title section-title--ink">Contact &amp; Enquiry</h2>
            </div>
            <p className="contact-body__subtitle">
              Call, message or visit us in person. For urgent medical help, always contact emergency services.
            </p>
          </div>

          <ul className="contact-cards">
            <li className="contact-card-item">
              <Icon name="phone" size={22} />
              <h3>Call</h3>
              <a href={STORE.phoneHref}>{STORE.phoneDisplay}</a>
            </li>
            <li className="contact-card-item">
              <Icon name="whatsapp" size={22} />
              <h3>WhatsApp</h3>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">Send a message</a>
            </li>
            <li className="contact-card-item">
              <Icon name="mail" size={22} />
              <h3>Email</h3>
              <a href={`mailto:${STORE.email}`}>{STORE.email}</a>
            </li>
            <li className="contact-card-item">
              <Icon name="pin" size={22} />
              <h3>Visit</h3>
              <address>{STORE.address.map((l) => <span key={l}>{l}</span>)}</address>
              <a href={directionsLink()} target="_blank" rel="noopener noreferrer">Get directions</a>
            </li>
          </ul>

          <div className="contact-body__grid">
            <form className="contact-form" onSubmit={handleContactSubmit} noValidate>
              <h3 className="section-title section-title--ink">Send an enquiry</h3>
              <p className="contact-form__hint">Your message opens directly in WhatsApp for instant response.</p>

              {[
                { name: 'name', label: 'Your name', type: 'text', autoComplete: 'name' },
                { name: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel' },
              ].map((f) => (
                <div className="field" key={f.name}>
                  <label htmlFor={`contact-${f.name}`}>{f.label}</label>
                  <input
                    id={`contact-${f.name}`}
                    name={f.name}
                    type={f.type}
                    autoComplete={f.autoComplete}
                    value={contactValues[f.name]}
                    onChange={handleContactChange}
                    aria-invalid={!!contactErrors[f.name]}
                    aria-describedby={contactErrors[f.name] ? `contact-${f.name}-error` : undefined}
                    required
                  />
                  {contactErrors[f.name] && <p className="field__error" id={`contact-${f.name}-error`}>{contactErrors[f.name]}</p>}
                </div>
              ))}
              <div className="field">
                <label htmlFor="contact-message">What do you need?</label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  value={contactValues.message}
                  onChange={handleContactChange}
                  aria-invalid={!!contactErrors.message}
                  aria-describedby={contactErrors.message ? 'contact-message-error' : undefined}
                  required
                />
                {contactErrors.message && <p className="field__error" id="contact-message-error">{contactErrors.message}</p>}
              </div>
              <button type="submit" className="btn btn--primary">Continue in WhatsApp <Icon name="arrow" size={16} /></button>
              <p className="contact-form__status" role="status">
                {contactSent ? 'WhatsApp opened with your enquiry. If it did not open, call us directly.' : ''}
              </p>
            </form>

            <aside className="contact-hours" aria-labelledby="hours-title">
              <h3 id="hours-title" className="section-title section-title--ink">Opening hours</h3>
              <OpenStatus className="contact-hours__status" />
              <dl>
                {STORE.hours.map((h) => (
                  <div key={h.label}><dt>{h.label}</dt><dd>{hoursText(h)}</dd></div>
                ))}
              </dl>
              <p className="contact-hours__note"><Icon name="delivery" size={18} /> Home delivery {STORE.delivery.radius}. {STORE.delivery.note}</p>
              <p className="contact-hours__note"><Icon name="card" size={18} /> We accept {STORE.payments.join(', ')}.</p>
              {STORE.mapEmbedUrl && (
                <iframe
                  className="contact-map"
                  src={STORE.mapEmbedUrl}
                  title={`Map showing ${STORE.name}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
              <a className="btn btn--outline contact-hours__directions" href={directionsLink()} target="_blank" rel="noopener noreferrer">
                <Icon name="pin" size={18} /> Get directions
              </a>
            </aside>
          </div>

        </div>
      </section>

      {/* FAQ — plain background; the particles become a capsule on the right */}
      <ParticleSection preset="faq" id="faq-section" className="split section--dark faq-section" aria-labelledby="faq-title">
        <div className="container split__inner">
          <div className="split__copy faq-section__copy">
            <p className="eyebrow"><span className="eyebrow__dot" aria-hidden="true" />Help &amp; answers</p>
            <Faq />
          </div>
        </div>
      </ParticleSection>

      <StructuredData data={pharmacySchema()} />

      {quickProduct && (
        <QuickViewModal
          product={quickProduct}
          onClose={() => setQuickProduct(null)}
        />
      )}

      <PrescriptionModal
        isOpen={rxModalOpen}
        onClose={() => setRxModalOpen(false)}
      />
    </>
  )
}
