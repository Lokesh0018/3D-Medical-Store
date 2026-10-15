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

const POPULAR_SEARCHES = ['Paracetamol', 'ORS', 'Thermometer', 'Vitamin C']
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
    scrollTo('products')
  }

  const resetAllFilters = () => {
    setQuery('')
    setCategory('all')
    setStockOnly(false)
    setRxFilter('all')
    setSortBy('featured')
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
                <div className="hero-marquee__track" role="group" aria-label="Quick category filters">
                  {/* First set */}
                  <div className="hero-marquee__group">
                    <button
                      type="button"
                      className="quick-pill quick-pill--medicines"
                      onClick={() => handleCategorySelect('medicines')}
                    >
                      <Icon name="pill" size={14} /> <span>Medicines</span>
                    </button>
                    <button
                      type="button"
                      className="quick-pill quick-pill--wellness"
                      onClick={() => handleCategorySelect('wellness')}
                    >
                      <Icon name="leaf" size={14} /> <span>Daily Vitamins</span>
                    </button>
                    <button
                      type="button"
                      className="quick-pill quick-pill--devices"
                      onClick={() => handleCategorySelect('devices')}
                    >
                      <Icon name="device" size={14} /> <span>Health Devices</span>
                    </button>
                    <button
                      type="button"
                      className="quick-pill quick-pill--baby"
                      onClick={() => handleCategorySelect('baby-care')}
                    >
                      <Icon name="baby" size={14} /> <span>Baby Care</span>
                    </button>
                  </div>

                  {/* Duplicate set for seamless infinite loop */}
                  <div className="hero-marquee__group" aria-hidden="true">
                    <button
                      type="button"
                      tabIndex={-1}
                      className="quick-pill quick-pill--medicines"
                      onClick={() => handleCategorySelect('medicines')}
                    >
                      <Icon name="pill" size={14} /> <span>Medicines</span>
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      className="quick-pill quick-pill--wellness"
                      onClick={() => handleCategorySelect('wellness')}
                    >
                      <Icon name="leaf" size={14} /> <span>Daily Vitamins</span>
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      className="quick-pill quick-pill--devices"
                      onClick={() => handleCategorySelect('devices')}
                    >
                      <Icon name="device" size={14} /> <span>Health Devices</span>
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      className="quick-pill quick-pill--baby"
                      onClick={() => handleCategorySelect('baby-care')}
                    >
                      <Icon name="baby" size={14} /> <span>Baby Care</span>
                    </button>
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
          <div className="split__copy split__copy--wide">
            <p className="eyebrow">Shop by category</p>
            <h2 id="cat-title" className="section-title">Everything for everyday health</h2>
            <ul className="category-grid">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(c.id)}
                    className="category-card"
                  >
                    <span className="category-card__icon"><Icon name={c.icon} size={22} /></span>
                    <span className="category-card__name">{c.name}</span>
                    <span className="category-card__blurb">{c.blurb}</span>
                  </button>
                </li>
              ))}
            </ul>
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

          {/* Product grid */}
          {filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((p) => (
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

      {/* Services & delivery — heartbeat waveform */}
      <ParticleSection preset="services" id="services" className="services section--dark" aria-labelledby="services-title">
        <div className="container">
          <div className="services__head">
            <p className="eyebrow">Services &amp; delivery</p>
            <h2 id="services-title" className="section-title">Care that keeps pace with you</h2>
          </div>
          <div className="services__pulse" aria-hidden="true" />
          <ul className="service-grid">
            {SERVICES.map((s) => (
              <li key={s.id} className="service-card glass-panel">
                <span className="service-card__icon"><Icon name={s.icon} size={22} /></span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </ParticleSection>

      {/* Ordering — capsule */}
      <ParticleSection preset="order" id="order" className="split section--dark" aria-labelledby="order-title">
        <div className="container split__inner">
          <div className="split__copy glass-panel">
            <p className="eyebrow">How to order</p>
            <h2 id="order-title" className="section-title">Three simple steps</h2>
            <ol className="steps">
              <li><p><strong>Send your list or prescription</strong> on WhatsApp, by phone, or add items to your cart.</p></li>
              <li><p><strong>We confirm</strong> availability and the final price with you.</p></li>
              <li><p><strong>Pick up or get it delivered</strong> {STORE.delivery.radius}.</p></li>
            </ol>
            <div className="hero__ctas">
              <a className="btn btn--primary" href={whatsappLink('Hello, I would like to place an order.')} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" size={18} /> Start on WhatsApp
              </a>
              <button
                type="button"
                className="btn btn--glass"
                onClick={() => setRxModalOpen(true)}
              >
                <Icon name="rx" size={18} /> Upload prescription
              </button>
              <a className="btn btn--glass" href={STORE.phoneHref}>
                <Icon name="phone" size={18} /> {STORE.phoneDisplay}
              </a>
            </div>
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

          {/* Embedded FAQ */}
          <div className="contact-faq">
            <Faq />
          </div>
        </div>
      </section>

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
