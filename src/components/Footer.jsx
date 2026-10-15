import { Link } from 'react-router-dom'
import ParticleSection from '../particles/ParticleSection.jsx'
import { CATEGORIES } from '../data/products.js'
import { STORE, hoursText, whatsappLink } from '../data/store.js'
import Icon from './Icon.jsx'
import './Footer.css'

export default function Footer() {
  return (
    <ParticleSection as="footer" id="site-footer" preset="footer" className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <Link to="/" className="brand">
            <span className="brand__mark"><Icon name="cross" size={18} strokeWidth={2} /></span>
            <span className="brand__name">{STORE.name}</span>
          </Link>
          <p>{STORE.tagline}. Genuine medicines and everyday health essentials, with care at the counter and at your door.</p>
          <p className="site-footer__licence">{STORE.licence}</p>

          <div className="site-footer__trust-badges">
            <span className="footer-trust-tag"><Icon name="shield" size={14} /> Drug License Verified</span>
            <span className="footer-trust-tag"><Icon name="check" size={14} /> Registered Pharmacist on Duty</span>
            <span className="footer-trust-tag"><Icon name="snowflake" size={14} /> Cold-Chain Stored (2°C - 8°C)</span>
          </div>
        </div>

        <div>
          <h2 className="site-footer__heading">Shop</h2>
          <ul className="site-footer__list">
            {CATEGORIES.map((c) => (
              <li key={c.id}><a href="#products">{c.name}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="site-footer__heading">Visit</h2>
          <address className="site-footer__list">
            <span><Icon name="pin" size={16} /> {STORE.address.join(', ')}</span>
            {STORE.hours.map((h) => (
              <span key={h.label}><Icon name="clock" size={16} /> {h.label}: {hoursText(h)}</span>
            ))}
          </address>
        </div>

        <div>
          <h2 className="site-footer__heading">Contact</h2>
          <ul className="site-footer__list">
            <li><a href={STORE.phoneHref}><Icon name="phone" size={16} /> {STORE.phoneDisplay}</a></li>
            <li><a href={whatsappLink()} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={16} /> WhatsApp</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href={`mailto:${STORE.email}`}><Icon name="mail" size={16} /> {STORE.email}</a></li>
            {STORE.social.map((s) => (
              <li key={s.label}><a href={s.href}>{s.label}</a></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container site-footer__bottom">
        <p>Prescription medicines are dispensed only against a valid prescription. Information on this site is not a substitute for medical advice.</p>
        <p>© {new Date().getFullYear()} {STORE.name}</p>
      </div>
    </ParticleSection>
  )
}
