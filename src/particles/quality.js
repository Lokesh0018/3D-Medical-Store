/**
 * Capability helpers. Kept free of three.js imports so the main bundle can
 * decide whether to load the 3D chunk at all.
 */

export function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

let webglSupport
export function supportsWebGL() {
  if (webglSupport !== undefined) return webglSupport
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    webglSupport = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webglSupport = false
  }
  return webglSupport
}

/**
 * Pick a quality tier from practical signals: viewport width, CPU cores,
 * device memory (Chromium only, so undefined is treated as capable) and
 * whether the primary pointer is touch. The renderer additionally degrades
 * at runtime if measured frame rate is poor (see ParticleField).
 */
export function getQualityTier() {
  const w = window.innerWidth
  const cores = navigator.hardwareConcurrency || 4
  const mem = navigator.deviceMemory ?? 8
  const coarse = window.matchMedia('(pointer: coarse)').matches
  if (w < 768 || mem <= 2 || cores <= 2) return 'low'
  if (w < 1200 || coarse || cores <= 4 || mem <= 4) return 'medium'
  return 'high'
}
