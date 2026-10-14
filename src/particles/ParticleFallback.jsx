import { useMemo } from 'react'

/**
 * Static healthcare visual used before the WebGL scene is ready, and
 * permanently for reduced-motion users, browsers without WebGL, or after a
 * GL failure: a dotted medical cross with soft glows. No animation loop.
 */
export default function ParticleFallback({ hidden }) {
  // Dot grid clipped to a plus-sign silhouette (computed once).
  const dots = useMemo(() => {
    const out = []
    const step = 9
    for (let x = -100; x <= 100; x += step) {
      for (let y = -100; y <= 100; y += step) {
        const inCross = (Math.abs(x) <= 34 && Math.abs(y) <= 100) || (Math.abs(y) <= 34 && Math.abs(x) <= 100)
        if (!inCross) continue
        const edge = Math.abs(Math.abs(x) - 34) < step || Math.abs(Math.abs(y) - 34) < step ||
          Math.abs(x) > 94 || Math.abs(y) > 94
        out.push({ x, y, r: edge ? 2.1 : 1.4, o: edge ? 0.95 : 0.55 })
      }
    }
    return out
  }, [])

  return (
    <div className={`particle-fallback${hidden ? ' is-hidden' : ''}`}>
      <div className="particle-fallback__glow particle-fallback__glow--a" />
      <div className="particle-fallback__glow particle-fallback__glow--b" />
      <svg className="particle-fallback__cross" viewBox="-110 -110 220 220" focusable="false">
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#2fe0d4" opacity={d.o} />
        ))}
      </svg>
    </div>
  )
}
