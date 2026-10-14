import { FAQS } from '../data/store.js'
import { faqSchema } from '../seo/structuredData.js'
import StructuredData from './StructuredData.jsx'
import './Faq.css'

/** Native <details> disclosure list: keyboard and screen-reader friendly, no JS. */
export default function Faq({ headingId = 'faq-title' }) {
  return (
    <div className="faq" id="faq">
      <h2 id={headingId} className="section-title section-title--ink">Frequently asked questions</h2>
      <div className="faq__list">
        {FAQS.map((f) => (
          <details key={f.q} className="faq__item">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
      <StructuredData data={faqSchema(FAQS)} />
    </div>
  )
}
