import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ParticleSection from '../particles/ParticleSection.jsx'
import ProductCard from '../components/ProductCard.jsx'
import Icon from '../components/Icon.jsx'
import { CATEGORIES, PRODUCTS } from '../data/products.js'
import { SERVICES, STORE, prescriptionLink, whatsappLink } from '../data/store.js'
import usePageTitle from '../hooks/usePageTitle.js'
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
  usePageTitle()

  return (
    <>
      {/* Hero — particles gather into a medical cross */}
      <ParticleSection preset="hero" className="hero section--dark" aria-labelledby="hero-title">
        <div className="container hero__inner">
          <div className="hero__copy">
            <p className="eyebrow"><span className="eyebrow__dot" /> {STORE.tagline}</p>
            <h1 id="hero-title" className="hero__title">
              Genuine medicines. <span className="text-gradient">Trusted care</span>, delivered to your door.
            </h1>
            <p className="hero__lead">
              Order prescription and everyday health essentials from {STORE.name}. Every order is checked by our
              pharmacist before it is packed.
            </p>
            <HeroSearch />
            <div className="hero__ctas">
              <a className="btn btn--glass btn--lg" href={prescriptionLink()} target="_blank" rel="noopener noreferrer">
                <Icon name="rx" size={18} /> Upload prescription
              </a>
              <Link to="/products" className="btn btn--ghost btn--lg">
                Browse all products <Icon name="arrow" size={18} />
              </Link>
            </div>
            <ul className="hero__facts">
              <li><Icon name="clock" size={16} /> {STORE.hours[0].days}: {STORE.hours[0].time}</li>
              <li><Icon name="delivery" size={16} /> Home delivery {STORE.delivery.radius}</li>
              <li><Icon name="rx" size={16} /> Prescriptions via WhatsApp</li>
            </ul>
          </div>
        </div>
      </ParticleSection>

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
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
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
              <a className="btn btn--glass" href={prescriptionLink()} target="_blank" rel="noopener noreferrer">
                <Icon name="rx" size={18} /> Upload prescription
              </a>
              <a className="btn btn--glass" href={STORE.phoneHref}>
                <Icon name="phone" size={18} /> {STORE.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </ParticleSection>
    </>
  )
}
