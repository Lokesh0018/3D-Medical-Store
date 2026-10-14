/**
 * Central configuration for the scroll-driven particle experience.
 *
 * Every tunable value (density, size, colours, timing, per-section layout)
 * lives here so the visual language stays consistent across pages.
 */

// Reusable colour palettes. `a`/`b` form the base gradient each particle picks
// from; `accent` highlights structural features (cross rim, DNA base pairs,
// oxygen atoms, ECG peaks, capsule half).
export const PALETTES = {
  cyan: { a: '#2fe0d4', b: '#4aa8ff', accent: '#e8fffd' },
  teal: { a: '#19c3b1', b: '#5fe6ff', accent: '#c9fff6' },
  blue: { a: '#3d8bff', b: '#38e1e1', accent: '#e4f1ff' },
  pulse: { a: '#24d6c8', b: '#6fb6ff', accent: '#ffffff' },
  dim: { a: '#1f8fa8', b: '#2b5f9e', accent: '#7fd8ff' },
}

export const PARTICLE_CONFIG = {
  // Device quality tiers. `count` is the stable particle population; `size`
  // is the point-sprite base size in world-scaled pixels; `dpr` caps the
  // device pixel ratio (R3F clamps window.devicePixelRatio into the range).
  tiers: {
    high: { count: 16000, size: 38, dpr: [1, 1.75] },
    medium: { count: 9000, size: 42, dpr: [1, 1.5] },
    low: { count: 5500, size: 48, dpr: [1, 1.25] },
  },

  camera: { fov: 45, z: 9 },

  // Largest dimension (world units) each shape is normalised to.
  shapeSize: {
    cross: 4.4,
    dna: 5.6,
    molecule: 4.6,
    heartbeat: 7.4,
    capsule: 4.8,
    sphere: 4.2,
  },

  transition: {
    // 0..1 share of a transition used to stagger particle departure, so the
    // shape dissolves progressively rather than all at once.
    stagger: 0.4,
    // How far (world units) particles drift outward mid-transition.
    scatter: 1.5,
    // Opacity reduction (0..1) at the midpoint of a morph, so particles in
    // flight across headings and buttons stay in the background.
    flightDim: 0.45,
    // Extra Y twist (radians) applied at the midpoint of each morph.
    twist: 0.9,
    // Exponential damping rate used to scrub toward the scroll target.
    // Higher = tighter to the scrollbar, lower = floatier.
    smoothing: 3.4,
    // Initial "cloud gathers into the first shape" intro.
    introDuration: 2.6,
    // Dissolve duration when the route changes.
    routeFade: 0.35,
  },

  motion: {
    // Amplitude (world units) of idle flow-field turbulence.
    turbulence: 0.045,
    // Pointer parallax tilt (radians) on fine-pointer devices.
    pointerTilt: 0.22,
  },

  // ScrollTrigger window for the morph INTO a section's shape: begins as the
  // section's top enters the viewport and completes before the section reaches
  // its main focus. `clamp()` keeps short trailing sections (the footer)
  // reachable at the bottom of the page.
  trigger: { start: 'clamp(top 88%)', end: 'clamp(top 28%)' },

  // Breakpoint below which mobile overrides are applied to presets.
  mobileBreakpoint: 768,
}

/**
 * Section presets. A page marks a section with `<ParticleSection preset="…">`
 * and the particles morph to that preset's shape and layout.
 *
 * x / y  — offset of the shape centre as a fraction of the viewport size
 * scale  — multiplier on the normalised shape size
 * opacity— particle opacity for this section
 * sway   — amplitude (radians) of the gentle idle Y rotation
 * palette— key into PALETTES
 * mobile — overrides applied below `mobileBreakpoint`
 */
export const SECTION_PRESETS = {
  hero: {
    shape: 'cross', x: 0.23, y: 0.02, scale: 1, opacity: 1, sway: 0.5, palette: 'cyan',
    mobile: { x: 0, y: 0.25, scale: 0.58, opacity: 0.75 },
  },
  about: {
    shape: 'dna', x: -0.26, y: 0, scale: 1, opacity: 0.95, sway: 0.25, palette: 'teal',
    mobile: { x: 0.18, y: 0, scale: 0.7, opacity: 0.35 },
  },
  categories: {
    shape: 'molecule', x: 0.25, y: 0, scale: 0.85, opacity: 0.9, sway: 0.45, palette: 'blue',
    mobile: { x: 0, y: -0.05, scale: 0.6, opacity: 0.3 },
  },
  services: {
    shape: 'heartbeat', x: 0, y: 0.06, scale: 0.85, opacity: 0.65, sway: 0.12, palette: 'pulse',
    mobile: { y: 0.08, scale: 0.46, opacity: 0.6 },
  },
  order: {
    shape: 'capsule', x: 0.22, y: 0, scale: 0.8, opacity: 0.95, sway: 0.4, palette: 'cyan',
    mobile: { x: 0, y: 0.22, scale: 0.55, opacity: 0.4 },
  },
  footer: {
    shape: 'field', x: 0, y: 0, scale: 1, opacity: 0.32, sway: 0.08, palette: 'dim',
    mobile: { opacity: 0.25 },
  },
  productsHero: {
    shape: 'capsule', x: 0.27, y: 0.12, scale: 0.6, opacity: 0.9, sway: 0.4, palette: 'teal',
    mobile: { x: 0.2, y: 0.24, scale: 0.42, opacity: 0.35 },
  },
  contactHero: {
    shape: 'heartbeat', x: 0.05, y: -0.06, scale: 0.72, opacity: 0.65, sway: 0.12, palette: 'pulse',
    mobile: { y: 0.32, scale: 0.42, opacity: 0.4 },
  },
  productDetail: {
    shape: 'molecule', x: 0.3, y: 0.02, scale: 0.6, opacity: 0.85, sway: 0.4, palette: 'teal',
    mobile: { x: 0.22, y: 0.1, scale: 0.4, opacity: 0.3 },
  },
  notFound: {
    shape: 'sphere', x: 0, y: 0.02, scale: 1.1, opacity: 0.45, sway: 0.6, palette: 'blue',
    mobile: { scale: 0.6, opacity: 0.5 },
  },
}

/** Resolve a preset by name, applying mobile overrides when needed. */
export function resolvePreset(name, isMobile) {
  const base = SECTION_PRESETS[name] ?? SECTION_PRESETS.footer
  const { mobile, ...desktop } = base
  return isMobile && mobile ? { ...desktop, ...mobile } : desktop
}
