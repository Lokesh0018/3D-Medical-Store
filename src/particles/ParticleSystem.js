import { BufferAttribute, BufferGeometry, Color, DynamicDrawUsage, MathUtils, Points } from 'three'
import { gsap } from 'gsap'
import { PALETTES, PARTICLE_CONFIG } from './config.js'
import { getShape } from './shapes.js'
import { createParticleMaterial } from './particleMaterial.js'

const { transition, motion } = PARTICLE_CONFIG
const smooth = (t) => t * t * (3 - 2 * t)

// Preallocated palette colours — nothing is allocated inside the frame loop.
const PALETTE_COLORS = Object.fromEntries(
  Object.entries(PALETTES).map(([k, p]) => [k, { a: new Color(p.a), b: new Color(p.b), accent: new Color(p.accent) }]),
)

function buildGeometry(count) {
  const geometry = new BufferGeometry()
  // `position` is required by three for the draw count; actual positions are
  // computed in the shader from aFrom/aTo.
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3))
  geometry.setAttribute('aFrom', new BufferAttribute(new Float32Array(count * 4), 4).setUsage(DynamicDrawUsage))
  geometry.setAttribute('aTo', new BufferAttribute(new Float32Array(count * 4), 4).setUsage(DynamicDrawUsage))

  // Stable per-particle identity: delay, size, phase, brightness + direction.
  const rand = new Float32Array(count * 4)
  const dir = new Float32Array(count * 3)
  let seed = 1234567
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  for (let i = 0; i < count; i++) {
    rand[i * 4] = rnd()
    rand[i * 4 + 1] = rnd()
    rand[i * 4 + 2] = rnd()
    rand[i * 4 + 3] = rnd()
    const z = rnd() * 2 - 1
    const a = rnd() * Math.PI * 2
    const r = Math.sqrt(1 - z * z)
    dir[i * 3] = r * Math.cos(a)
    dir[i * 3 + 1] = r * Math.sin(a)
    dir[i * 3 + 2] = z
  }
  geometry.setAttribute('aRand', new BufferAttribute(rand, 4))
  geometry.setAttribute('aDir', new BufferAttribute(dir, 3))
  return geometry
}

/**
 * The single shared particle system (framework-agnostic).
 *
 * Each frame it reads the scroll controller's continuous shape index, damps
 * toward it (the scrub), and blends layout/colour between the two adjacent
 * section presets. GPU buffers are only rewritten when the active transition
 * segment changes; everything else is uniforms.
 */
export class ParticleSystem {
  constructor({ count, size, pixelRatio }) {
    this.count = count
    this.geometry = buildGeometry(count)
    this.material = createParticleMaterial({ size, pixelRatio })
    this.points = new Points(this.geometry, this.material)
    this.points.frustumCulled = false

    this.version = -1 // controller.version last applied
    this.shapes = [] // shape names; index 0 is the virtual intro cloud
    this.layouts = [] // presets aligned with `shapes`
    this.seg = -1
    this.s = 0 // smoothed shape index
    this.time = 0
    this.intro = { v: 0 }
    this.fade = { v: 0 }
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    this.perf = { frames: 0, elapsed: 0, warmup: 3, degraded: 0 }
    // Reduced-motion mode: hold shapes without intro, drift, morph or parallax.
    this.still = false
  }

  setStill(still) {
    this.still = still
    if (still) {
      gsap.killTweensOf([this.intro, this.fade])
      this.intro.v = 1
      this.fade.v = 1
    }
  }

  setPointer(nx, ny) {
    this.pointer.tx = nx
    this.pointer.ty = ny
  }

  /** Point the system at a (new) set of sections. */
  #applySections(presets, intro, startIndex) {
    if (!presets.length) return
    this.shapes = ['cloud', ...presets.map((p) => p.shape)]
    // The intro cloud borrows the first preset's look, roughly centred.
    this.layouts = [{ ...presets[0], scale: 1, x: presets[0].x * 0.4 }, ...presets]
    this.seg = -1
    gsap.killTweensOf(this.intro)
    if (this.still) {
      this.intro.v = 1
      this.s = 1 + startIndex
      this.fade.v = 1
      return
    }
    if (intro) {
      this.intro.v = 0
      this.s = 0
      gsap.to(this.intro, { v: 1, duration: transition.introDuration, ease: 'power2.inOut' })
    } else {
      // Loaded/refreshed mid-page: start fully formed where the user is.
      this.intro.v = 1
      this.s = 1 + startIndex
    }
    gsap.to(this.fade, { v: 1, duration: intro ? 0.8 : 0.4, ease: 'power1.out' })
  }

  #syncSections(controller) {
    if (controller.version === this.version) return
    const first = this.version === -1
    this.version = controller.version
    if (first) {
      this.#applySections(controller.presets, window.scrollY < 40, controller.getIndex())
      return
    }
    if (this.still) {
      this.#applySections(controller.presets, false, controller.getIndex())
      return
    }
    // Route change: dissolve, then regroup into the new page's first shape.
    gsap.killTweensOf(this.fade)
    gsap.to(this.fade, {
      v: 0,
      duration: transition.routeFade,
      ease: 'power1.in',
      onComplete: () => this.#applySections(controller.presets, true, 0),
    })
  }

  /**
   * Advance one frame. Returns false until the system has something to draw.
   * @param {object} f
   * @param {import('./ParticleScrollController.js').ParticleScrollController} f.controller
   * @param {{width:number,height:number}} f.viewport  world-space viewport at z=0
   */
  update({ controller, viewport, pixelRatio, delta: rawDelta }) {
    if (controller.presets.length === 0) return false
    this.#syncSections(controller)
    if (this.shapes.length < 2) return false

    const delta = Math.min(rawDelta, 0.1)
    const u = this.material.uniforms

    // Scrub toward the scroll target with frame-rate-independent damping.
    const target = this.intro.v + controller.getIndex()
    if (this.still) {
      // Snap to the nearest formed shape: no in-between morph frames.
      this.s = Math.round(target)
    } else {
      this.s += (target - this.s) * (1 - Math.exp(-delta * transition.smoothing))
      if (Math.abs(target - this.s) < 1e-4) this.s = target
    }
    const maxS = this.shapes.length - 1
    const s = MathUtils.clamp(this.s, 0, maxS)
    const seg = Math.min(Math.floor(s), maxS - 1)
    const p = s - seg

    if (seg !== this.seg) {
      const { aFrom, aTo } = this.geometry.attributes
      aFrom.array.set(getShape(this.shapes[seg], this.count))
      aTo.array.set(getShape(this.shapes[seg + 1], this.count))
      aFrom.needsUpdate = true
      aTo.needsUpdate = true
      this.seg = seg
    }

    // Blend layout, colour and opacity between the two adjacent presets.
    const A = this.layouts[seg]
    const B = this.layouts[seg + 1] ?? A
    const e = smooth(p)
    const pts = this.points
    pts.position.set(
      MathUtils.lerp(A.x, B.x, e) * viewport.width,
      MathUtils.lerp(A.y, B.y, e) * viewport.height,
      0,
    )
    pts.scale.setScalar(MathUtils.lerp(A.scale, B.scale, e))

    if (!this.still) this.time += delta
    const pt = this.pointer
    if (this.still) {
      pt.tx = 0
      pt.ty = 0
      pt.x = 0
      pt.y = 0
    }
    const k = 1 - Math.exp(-delta * 2)
    pt.x += (pt.tx - pt.x) * k
    pt.y += (pt.ty - pt.y) * k
    const sway = MathUtils.lerp(A.sway, B.sway, e)
    // Rest pose always faces the viewer; the twist only exists mid-morph.
    pts.rotation.y = Math.sin(this.time * 0.35) * sway + Math.sin(Math.PI * p) * transition.twist +
      pt.x * motion.pointerTilt
    pts.rotation.x = Math.sin(this.time * 0.27) * sway * 0.25 + pt.y * motion.pointerTilt * 0.5

    const ca = PALETTE_COLORS[A.palette] ?? PALETTE_COLORS.cyan
    const cb = PALETTE_COLORS[B.palette] ?? PALETTE_COLORS.cyan
    u.uColorA.value.lerpColors(ca.a, cb.a, e)
    u.uColorB.value.lerpColors(ca.b, cb.b, e)
    u.uAccent.value.lerpColors(ca.accent, cb.accent, e)
    const flight = Math.sin(Math.PI * p)
    u.uOpacity.value = MathUtils.lerp(A.opacity, B.opacity, e) * this.fade.v * (1 - transition.flightDim * flight)
    u.uProgress.value = p
    u.uTime.value = this.time
    u.uStagger.value = transition.stagger
    u.uScatter.value = transition.scatter
    u.uTurbulence.value = this.still ? 0 : motion.turbulence
    u.uPixelRatio.value = pixelRatio
    return true
  }

  /**
   * Frame-rate watchdog. Returns 'dpr' or 'density' when a degradation step
   * should be applied, otherwise null. Step 1 drops DPR to 1; step 2 draws
   * 60% of the particles (every prefix is a uniform sample of each shape).
   */
  monitor(rawDelta) {
    const perf = this.perf
    if (perf.degraded >= 2) return null
    if (rawDelta > 0.25) {
      // Resumed after a pause (tab hidden / offscreen): not a slow frame.
      perf.frames = 0
      perf.elapsed = 0
      return null
    }
    if (perf.warmup > 0) {
      perf.warmup -= rawDelta
      return null
    }
    perf.frames++
    perf.elapsed += rawDelta
    if (perf.elapsed < 2.5) return null
    const fps = perf.frames / perf.elapsed
    perf.frames = 0
    perf.elapsed = 0
    if (fps >= 40) return null
    perf.degraded++
    if (perf.degraded === 1) return 'dpr'
    this.geometry.setDrawRange(0, Math.floor(this.count * 0.6))
    return 'density'
  }

  dispose() {
    gsap.killTweensOf([this.intro, this.fade])
    this.geometry.dispose()
    this.material.dispose()
  }
}
