import { useState } from 'react'
import ParticleSection from '../particles/ParticleSection.jsx'
import Icon from '../components/Icon.jsx'
import { STORE, directionsLink, hoursText, whatsappLink } from '../data/store.js'
import OpenStatus from '../components/OpenStatus.jsx'
import Faq from '../components/Faq.jsx'
import './Contact.css'

const EMPTY = { name: '', phone: '', message: '' }

function validate(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Please enter your name.'
  if (!/^[+\d][\d\s-]{7,}$/.test(values.phone.trim())) errors.phone = 'Please enter a valid phone number.'
  if (values.message.trim().length < 5) errors.message = 'Please tell us what you need.'
  return errors
}

export default function Contact() {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }))

  // No backend: the enquiry is handed to WhatsApp with the details prefilled.
  const onSubmit = (e) => {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.getElementById(`contact-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    const text = `Hello ${STORE.name},\nName: ${values.name}\nPhone: ${values.phone}\n\n${values.message}`
    window.open(whatsappLink(text), '_blank', 'noopener,noreferrer')
    setSent(true)
    setValues(EMPTY)
  }

  return (
    <>
      <ParticleSection preset="contactHero" className="page-hero page-hero--contact section--dark" aria-labelledby="contact-title">
        <div className="container">
          <p className="eyebrow">Contact &amp; ordering</p>
          <h1 id="contact-title" className="page-hero__title">We're here to help</h1>
          <p className="page-hero__lead">Call, message or visit us. For urgent medical help, contact your doctor or local emergency services.</p>

          <ul className="contact-cards">
            <li className="glass-panel">
              <Icon name="phone" size={22} />
              <h2>Call</h2>
              <a href={STORE.phoneHref}>{STORE.phoneDisplay}</a>
            </li>
            <li className="glass-panel">
              <Icon name="whatsapp" size={22} />
              <h2>WhatsApp</h2>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">Send a message</a>
            </li>
            <li className="glass-panel">
              <Icon name="mail" size={22} />
              <h2>Email</h2>
              <a href={`mailto:${STORE.email}`}>{STORE.email}</a>
            </li>
            <li className="glass-panel">
              <Icon name="pin" size={22} />
              <h2>Visit</h2>
              <address>{STORE.address.map((l) => <span key={l}>{l}</span>)}</address>
              <a href={directionsLink()} target="_blank" rel="noopener noreferrer">Get directions</a>
            </li>
          </ul>
        </div>
      </ParticleSection>

      <section className="section--light contact-body" aria-labelledby="enquiry-title">
        <div className="container contact-body__grid">
          <form className="contact-form" onSubmit={onSubmit} noValidate>
            <h2 id="enquiry-title" className="section-title section-title--ink">Send an enquiry</h2>
            <p className="contact-form__hint">Your message opens in WhatsApp so you can review it before sending.</p>

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
                  value={values[f.name]}
                  onChange={onChange}
                  aria-invalid={!!errors[f.name]}
                  aria-describedby={errors[f.name] ? `contact-${f.name}-error` : undefined}
                  required
                />
                {errors[f.name] && <p className="field__error" id={`contact-${f.name}-error`}>{errors[f.name]}</p>}
              </div>
            ))}
            <div className="field">
              <label htmlFor="contact-message">What do you need?</label>
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                value={values.message}
                onChange={onChange}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'contact-message-error' : undefined}
                required
              />
              {errors.message && <p className="field__error" id="contact-message-error">{errors.message}</p>}
            </div>
            <button type="submit" className="btn btn--primary">Continue in WhatsApp <Icon name="arrow" size={16} /></button>
            <p className="contact-form__status" role="status">
              {sent ? 'WhatsApp opened with your enquiry. If it did not open, call us instead.' : ''}
            </p>
          </form>

          <aside className="contact-hours" aria-labelledby="hours-title">
            <h2 id="hours-title" className="section-title section-title--ink">Opening hours</h2>
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
        <div className="container contact-faq">
          <Faq />
        </div>
      </section>
    </>
  )
}
