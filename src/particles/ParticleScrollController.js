import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PARTICLE_CONFIG, resolvePreset } from './config.js'

gsap.registerPlugin(ScrollTrigger)
// Mobile URL-bar show/hide changes the viewport height; refreshing on it
// would cause measurement jumps mid-scroll.
ScrollTrigger.config({ ignoreMobileResize: true })

/**
 * Single source of scroll truth for the particle field.
 *
 * Every `[data-particle]` section after the first gets one ScrollTrigger that
 * covers the morph INTO that section's shape. The triggers are ordered and
 * do not overlap, so the sum of their progress values is a continuous
 * "shape index":
 *
 *   0.0 → first section's shape fully formed
 *   1.4 → 40% of the way from shape 1 to shape 2
 *
 * The triggers drive no tweens themselves; the render loop reads this index
 * and scrubs toward it with damping. One value feeds one particle system,
 * so no timelines compete, and fast or reverse scrolling and refreshes
 * mid-page all resolve from ScrollTrigger's own measurements without jumps.
 */
export class ParticleScrollController {
  constructor() {
    this.sections = []
    this.presets = []
    this.triggers = []
    this.version = 0
    this.listeners = new Set()
    this.isMobile = this.#mobile()

    // Re-resolve mobile/desktop presets when a refresh follows a resize.
    this.onRefresh = () => {
      const mobile = this.#mobile()
      if (mobile !== this.isMobile) {
        this.isMobile = mobile
        this.presets = this.sections.map((el) => resolvePreset(el.dataset.particle, mobile))
      }
    }
    ScrollTrigger.addEventListener('refresh', this.onRefresh)

    // Content height changes (filtering products, images, fonts) move every
    // later section, so trigger positions must be re-measured.
    this.refreshSoon = debounce(() => ScrollTrigger.refresh(), 150)
    this.resizeObserver = new ResizeObserver(this.refreshSoon)
    this.resizeObserver.observe(document.body)
    document.fonts?.ready.then(this.refreshSoon)
  }

  #mobile() {
    return window.innerWidth < PARTICLE_CONFIG.mobileBreakpoint
  }

  /** (Re)collect sections from the DOM — call after each route render. */
  scan(root = document) {
    this.#killTriggers()
    this.sections = Array.from(root.querySelectorAll('[data-particle]'))
    this.presets = this.sections.map((el) => resolvePreset(el.dataset.particle, this.isMobile))
    const { start, end } = PARTICLE_CONFIG.trigger
    this.triggers = this.sections.slice(1).map((el) =>
      ScrollTrigger.create({ trigger: el, start, end }),
    )
    ScrollTrigger.refresh()
    this.version++
    this.listeners.forEach((fn) => fn(this))
  }

  /** Continuous shape index in [0, sections - 1]. */
  getIndex() {
    let s = 0
    for (let i = 0; i < this.triggers.length; i++) s += this.triggers[i].progress
    return s
  }

  subscribe(fn) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  #killTriggers() {
    this.triggers.forEach((t) => t.kill())
    this.triggers = []
  }

  destroy() {
    this.#killTriggers()
    ScrollTrigger.removeEventListener('refresh', this.onRefresh)
    this.resizeObserver.disconnect()
    this.refreshSoon.cancel()
    this.listeners.clear()
    this.sections = []
    this.presets = []
  }
}

function debounce(fn, ms) {
  let id
  const wrapped = () => {
    clearTimeout(id)
    id = setTimeout(fn, ms)
  }
  wrapped.cancel = () => clearTimeout(id)
  return wrapped
}
