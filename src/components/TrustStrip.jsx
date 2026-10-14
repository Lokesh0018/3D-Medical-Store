import { TRUST_POINTS } from '../data/store.js'
import Icon from './Icon.jsx'
import './TrustStrip.css'

/** Licence, pharmacist, sourcing and payment reassurance right after the hero. */
export default function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Why customers trust us">
      <ul className="container trust-strip__list">
        {TRUST_POINTS.map((t) => (
          <li key={t.id} className="trust-strip__item">
            <span className="trust-strip__icon"><Icon name={t.icon} size={20} /></span>
            <span>
              <strong>{t.title}</strong>
              <span className="trust-strip__body">{t.body}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
