# CarePoint Pharmacy — 3D particle storefront

Vite + React 19 medical store with a scroll-driven, GPU-morphed particle layer
(three.js + React Three Fiber + GSAP ScrollTrigger).

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build
```

## ⚠️ Placeholders to replace before launch
- `src/data/store.js` — store name, phone/WhatsApp, email, address, hours, licence no., delivery terms
- `src/data/products.js` — sample catalogue (names, packs, prices, stock, Rx flags)
- `index.html` — canonical URL / Open Graph tags (TODO comment)
- Page copy in `src/pages/*` is starter text — review all claims

## Particle system (`src/particles/`)
| File | Role |
|---|---|
| `config.js` | All tunables: quality tiers, timing, palettes, per-section presets |
| `shapes.js` | Deterministic generators: cloud, cross, dna, molecule, heartbeat, capsule, sphere, field |
| `particleMaterial.js` | GLSL morph shader (stagger, scatter, turbulence, soft glow) |
| `ParticleSystem.js` | Framework-agnostic frame logic, buffers, adaptive degradation |
| `ParticleScrollController.js` | One ScrollTrigger per morph → a continuous shape index |
| `ParticleField.jsx` / `ParticleCanvas.jsx` | R3F binding; lazy chunk; pause when offscreen/hidden |
| `ParticleExperience.jsx` | Idle-time loading, reduced-motion / no-WebGL / error fallback |
| `ParticleSection.jsx` | `<ParticleSection preset="dna">` marks a section as a morph stop |

To add a stop: wrap a dark section in `<ParticleSection preset="…">` and add the
preset to `SECTION_PRESETS`. Light (`.section--light`) sections are opaque and
pause rendering while they fill the screen.
