import { Link } from 'react-router-dom'
import ParticleSection from '../particles/ParticleSection.jsx'

export default function NotFound() {
  return (
    <ParticleSection preset="notFound" className="page-hero page-hero--center section--dark" aria-labelledby="nf-title">
      <div className="container">
        <p className="eyebrow">404</p>
        <h1 id="nf-title" className="page-hero__title">We couldn't find that page</h1>
        <p className="page-hero__lead">The link may be outdated. Try the catalogue or head back home.</p>
        <div className="hero__ctas hero__ctas--center">
          <Link to="/" className="btn btn--primary">Go home</Link>
          <Link to="/products" className="btn btn--glass">Browse products</Link>
        </div>
      </div>
    </ParticleSection>
  )
}
