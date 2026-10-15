import { lazy, Suspense, useEffect, useState } from 'react'
import { prefersLightweight, prefersReducedMotion, supportsWebGL } from './quality.js'
import ParticleErrorBoundary from './ParticleErrorBoundary.jsx'
import './particles.css'

const loadCanvas = () => import('./ParticleCanvas.jsx')
const ParticleCanvas = lazy(loadCanvas)

/**
 * Site-wide decorative particle layer. Fixed behind page content,
 * aria-hidden and pointer-events: none, so it never affects reading order,
 * focus, taps or layout.
 *
 * The 3D chunk is requested as soon as the app mounts (no static stand-in);
 * the particles fade in and gather into the first shape. With
 * prefers-reduced-motion the same scene renders "still": shapes are held
 * without drift or morph animation and only redrawn when the page scrolls.
 */
export default function ParticleExperience({ routeKey }) {
  const [reduced, setReduced] = useState(prefersReducedMotion)
  const [userDisabled, setUserDisabled] = useState(() => {
    try {
      return localStorage.getItem('carepoint-3d-disabled') === 'true'
    } catch {
      return false
    }
  })
  const [loaded, setLoaded] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)

    const onToggle = (e) => setUserDisabled(e.detail?.disabled ?? false)
    window.addEventListener('toggle-3d-particles', onToggle)

    return () => {
      mq.removeEventListener('change', onChange)
      window.removeEventListener('toggle-3d-particles', onToggle)
    }
  }, [])

  // Capability checks run client-side only (keeps pre-rendered HTML stable).
  // Fetch the 3D chunk immediately rather than waiting for browser idle time.
  useEffect(() => {
    if (userDisabled || !supportsWebGL() || prefersLightweight()) return
    let cancelled = false
    loadCanvas().then(
      () => !cancelled && setLoaded(true),
      () => !cancelled && setFailed(true),
    )
    return () => { cancelled = true }
  }, [userDisabled])

  const showCanvas = loaded && !userDisabled && !failed

  return (
    <div className="particle-experience" aria-hidden="true">
      {/* Ambient depth behind the particles (not a stand-in for them). */}
      <div className="particle-experience__glow particle-experience__glow--a" />
      <div className="particle-experience__glow particle-experience__glow--b" />
      {showCanvas && (
        <ParticleErrorBoundary onError={() => setFailed(true)}>
          <Suspense fallback={null}>
            <div className={`particle-canvas-wrap${ready ? ' is-ready' : ''}`}>
              <ParticleCanvas
                routeKey={routeKey}
                still={reduced}
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
