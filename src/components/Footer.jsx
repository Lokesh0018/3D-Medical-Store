import { Link } from 'react-router-dom'
import { CATEGORIES } from '../data/products.js'
import { STORE, directionsLink, hoursText, whatsappLink } from '../data/store.js'
import Icon from './Icon.jsx'
import OpenStatus from './OpenStatus.jsx'
import './Footer.css'

function backToTop() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}

export default function Footer() {
  return (
    <footer id="site-footer" className="site-footer">
      {/* Closing call to action */}
      <div className="container site-footer__cta">
        <div className="site-footer__cta-copy">
          <h2 className="site-footer__cta-title">Need something today?</h2>
          <p>Message or call us. We confirm availability and the final price before your order is packed.</p>
        </div>
        <div className="site-footer__cta-actions">
          <OpenStatus className="site-footer__status" />
          <a
            className="btn btn--primary site-footer__btn"
            href={whatsappLink('Hello, I would like to place an order.')}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="whatsapp" size={18} /> Order on WhatsApp
          </a>
          <a className="btn site-footer__btn site-footer__btn--ghost" href={STORE.phoneHref}>
            <Icon name="phone" size={18} /> Call {STORE.phoneDisplay}
          </a>
        </div>
      </div>

      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <Link to="/" className="brand">
            <span className="brand__mark"><Icon name="cross" size={18} strokeWidth={2} /></span>
            <span className="brand__name">{STORE.name}</span>
          </Link>
          <p>{STORE.tagline}. Genuine medicines and everyday health essentials, with care at the counter and at your door.</p>
          <p className="site-footer__licence">{STORE.licence}</p>

          <ul className="site-footer__trust-badges" aria-label="Store credentials">
            <li className="footer-trust-tag"><Icon name="shield" size={14} /> Drug License Verified</li>
            <li className="footer-trust-tag"><Icon name="check" size={14} /> Registered Pharmacist on Duty</li>
            <li className="footer-trust-tag"><Icon name="snowflake" size={14} /> Cold-Chain Stored (2°C - 8°C)</li>
          </ul>
        </div>

        <nav aria-labelledby="footer-shop">
          <h2 id="footer-shop" className="site-footer__heading">Shop</h2>
          <ul className="site-footer__list">
            {CATEGORIES.map((c) => (
              <li key={c.id}><a href="#products">{c.name}</a></li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="site-footer__heading">Visit</h2>
          <address className="site-footer__list">
            <span><Icon name="pin" size={16} /> {STORE.address.join(', ')}</span>
            {STORE.hours.map((h) => (
              <span key={h.label}><Icon name="clock" size={16} /> {h.label}: {hoursText(h)}</span>
            ))}
            <a className="site-footer__more" href={directionsLink()} target="_blank" rel="noopener noreferrer">
              Get directions <Icon name="arrow" size={15} />
            </a>
          </address>
        </div>

        <div>
          <h2 className="site-footer__heading">Contact</h2>
          <ul className="site-footer__list">
            <li><a href={STORE.phoneHref}><Icon name="phone" size={16} /> {STORE.phoneDisplay}</a></li>
            <li><a href={whatsappLink()} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={16} /> WhatsApp</a></li>
            <li><a href={`mailto:${STORE.email}`}><Icon name="mail" size={16} /> {STORE.email}</a></li>
            <li><a href="#faq"><Icon name="info" size={16} /> Frequently asked questions</a></li>
          </ul>
          {STORE.social.length > 0 && (
            <ul className="site-footer__social" aria-label="Social media">
              {STORE.social.map((s) => (
                <li key={s.label}><a href={s.href}>{s.label}</a></li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="container site-footer__bottom">
        <p>Prescription medicines are dispensed only against a valid prescription. Information on this site is not a substitute for medical advice.</p>
        <div className="site-footer__bottom-end">
          <p>© {new Date().getFullYear()} {STORE.name}</p>
          <button type="button" className="site-footer__top" onClick={backToTop}>
            Back to top <Icon name="arrow" size={15} className="site-footer__top-icon" />
          </button>
        </div>
      </div>

      {/* Aesthetic brand watermark across footer background */}
      <div className="site-footer__watermark" aria-hidden="true">
        <span>{STORE.name}</span>
      </div>
    </footer>
  )
}
