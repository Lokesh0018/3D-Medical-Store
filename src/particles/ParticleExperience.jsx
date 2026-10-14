import { lazy, Suspense, useEffect, useState } from 'react'
import { prefersLightweight, prefersReducedMotion, supportsWebGL } from './quality.js'
import ParticleFallback from './ParticleFallback.jsx'
import ParticleErrorBoundary from './ParticleErrorBoundary.jsx'
import './particles.css'

const ParticleCanvas = lazy(() => import('./ParticleCanvas.jsx'))

/**
 * Site-wide decorative particle layer. Fixed behind page content,
 * aria-hidden and pointer-events: none, so it never affects reading order,
 * focus, taps or layout.
 *
 * The 3D chunk is requested only after the browser is idle, so the heading,
 * CTAs and products render first. Until the scene is ready (or forever, with
 * reduced motion / no WebGL / a GL failure) a static CSS/SVG visual shows.
 */
export default function ParticleExperience({ routeKey }) {
  const [reduced, setReduced] = useState(prefersReducedMotion)
  const [idle, setIdle] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    // Capability checks run client-side only (also keeps SSR output stable).
    if (reduced || !supportsWebGL() || prefersLightweight()) return
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: 1500 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(() => setIdle(true), 300)
    return () => clearTimeout(id)
  }, [reduced])

  const enabled = !reduced && !failed
  const showCanvas = enabled && idle

  return (
    <div className="particle-experience" aria-hidden="true">
      <ParticleFallback hidden={showCanvas && ready} />
      {showCanvas && (
        <ParticleErrorBoundary onError={() => setFailed(true)}>
          <Suspense fallback={null}>
            <div className={`particle-canvas-wrap${ready ? ' is-ready' : ''}`}>
              <ParticleCanvas
                routeKey={routeKey}
                onReady={() => setReady(true)}
                onFail={() => setFailed(true)}
              />
            </div>
          </Suspense>
        </ParticleErrorBoundary>
      )}
    </div>
  )
}
