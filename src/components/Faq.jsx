import { useRef } from 'react'
import { FAQS } from '../data/store.js'
import { faqSchema } from '../seo/structuredData.js'
import StructuredData from './StructuredData.jsx'
import './Faq.css'

/**
 * Native <details> disclosure list: keyboard and screen-reader friendly.
 * Exclusive accordion: opening one answer closes the others. The shared
 * `name` does this natively in current browsers; the toggle handler covers
 * older ones.
 */
export default function Faq({ headingId = 'faq-title' }) {
  const listRef = useRef(null)

  const onToggle = (e) => {
    const opened = e.currentTarget
    if (!opened.open) return
    listRef.current?.querySelectorAll('details[open]').forEach((d) => {
      if (d !== opened) d.open = false
    })
  }

  return (
    <div className="faq" id="faq">
      <h2 id={headingId} className="section-title section-title--ink">Frequently asked questions</h2>
      <div className="faq__list" ref={listRef}>
        {FAQS.map((f) => (
          <details key={f.q} className="faq__item" name="faq" onToggle={onToggle}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
      <StructuredData data={faqSchema(FAQS)} />
    </div>
  )
}
