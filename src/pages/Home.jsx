import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ParticleSection from '../particles/ParticleSection.jsx'
import ProductCard from '../components/ProductCard.jsx'
import QuickViewModal from '../components/QuickViewModal.jsx'
import PrescriptionModal from '../components/PrescriptionModal.jsx'
import Icon from '../components/Icon.jsx'
import { CATEGORIES, PRODUCTS } from '../data/products.js'
import { SERVICES, STORE, whatsappLink } from '../data/store.js'
import TrustStrip from '../components/TrustStrip.jsx'
import OpenStatus from '../components/OpenStatus.jsx'
import StructuredData from '../components/StructuredData.jsx'
import { pharmacySchema } from '../seo/structuredData.js'
import './Home.css'

const featured = PRODUCTS.filter((p) => p.featured).slice(0, 6)
const POPULAR_SEARCHES = ['Paracetamol', 'ORS', 'Thermometer', 'Vitamin C']

/** Search-first hero entry: most visitors arrive looking for one item. */
function HeroSearch() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const go = (term) => navigate(term.trim() ? `/products?q=${encodeURIComponent(term.trim())}` : '/products')

  return (
    <div className="hero-search">
      <form
        className="hero-search__form"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          go(q)
        }}
      >
        <label htmlFor="hero-search" className="sr-only">Search medicines and health products</label>
        <Icon name="search" size={20} className="hero-search__icon" />
        <input
          id="hero-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search medicines, devices, baby care…"
          autoComplete="off"
        />
        <button type="submit" className="btn btn--primary">Search</button>
      </form>
      <p className="hero-search__popular">
        <span>Popular:</span>
        {POPULAR_SEARCHES.map((term) => (
          <Link key={term} to={`/products?q=${encodeURIComponent(term)}`}>{term}</Link>
        ))}
      </p>
    </div>
  )
}

export default function Home() {
  const [quickProduct, setQuickProduct] = useState(null)
  const [rxModalOpen, setRxModalOpen] = useState(false)

  return (
    <>
      {/* Hero — particles gather into a medical cross */}
      <ParticleSection preset="hero" className="hero section--dark" aria-labelledby="hero-title">
        <div className="container hero__inner">
          <div className="hero__copy">
            <p className="eyebrow"><span className="eyebrow__dot" /> {STORE.tagline}</p>
            <h1 id="hero-title" className="hero__title">
              <span className="hero__title-line">Genuine medicines,</span>{' '}
              <span className="hero__title-line text-gradient">delivered with care.</span>
            </h1>
            <p className="hero__lead">
              Prescription and everyday health essentials from {STORE.name}, checked by our pharmacist
              before every order is packed.
            </p>
            <HeroSearch />
            <div className="hero__ctas">
              <button
                type="button"
                className="btn btn--glass btn--lg"
                onClick={() => setRxModalOpen(true)}
              >
                <Icon name="rx" size={18} /> Upload prescription
              </button>
              <Link to="/products" className="btn btn--ghost btn--lg">
                Browse all products <Icon name="arrow" size={18} />
              </Link>
            </div>
            <ul className="hero__facts">
              <li><OpenStatus /></li>
              <li><Icon name="delivery" size={16} /> Home delivery {STORE.delivery.radius}</li>
            </ul>
          </div>
        </div>
      </ParticleSection>

      <TrustStrip />

      {/* About — particles become a DNA helix */}
      <ParticleSection preset="about" id="about" className="split section--dark" aria-labelledby="about-title">
        <div className="container split__inner split__inner--right">
          <div className="split__copy glass-panel">
            <p className="eyebrow">About the pharmacy</p>
            <h2 id="about-title" className="section-title">Pharmacy care, rooted in your neighbourhood</h2>
            <p>
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
            <ul className="check-list">
              <li><Icon name="shield" size={20} /> Medicines sourced from authorised distributors</li>
              <li><Icon name="check" size={20} /> Prescriptions checked by a registered pharmacist</li>
              <li><Icon name="check" size={20} /> Stored as per manufacturer temperature guidance</li>
            </ul>
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
                  <Link to={`/products?category=${c.id}`} className="category-card">
                    <span className="category-card__icon"><Icon name={c.icon} size={22} /></span>
                    <span className="category-card__name">{c.name}</span>
                    <span className="category-card__blurb">{c.blurb}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ParticleSection>

      {/* Featured products — light, opaque section: particles stay out of the way */}
      <section className="section--light featured" aria-labelledby="featured-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow eyebrow--light">Popular right now</p>
              <h2 id="featured-title" className="section-title">Featured products</h2>
            </div>
            <Link to="/products" className="btn btn--outline">View all products <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onQuickView={(prod) => setQuickProduct(prod)}
              />
            ))}
          </div>
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
              Questions about prescriptions, delivery or payment? <Link to="/contact#faq">Read the FAQ</Link>
            </p>
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
