# CarePoint Pharmacy — 3D particle storefront

Vite + React 19 medical store with a scroll-driven, GPU-morphed particle layer
(three.js + React Three Fiber + GSAP ScrollTrigger).

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build    # client build + server render + pre-render of every route
npm run preview  # serve dist/ (pre-rendered HTML, hydrated on load)
```

`npm run build` pre-renders `/`, `/products`, `/contact` and every
`/products/:id` to `dist/<route>/index.html`, plus `404.html`,
`sitemap.xml` and `robots.txt` (see `scripts/prerender.mjs`). Deploy `dist/`
to any static host; configure unknown paths to serve `404.html`.

## ⚠️ Placeholders to replace before launch
- `src/data/store.js` — name, `siteUrl`, phone/WhatsApp, email, address
  (+ `addressParts`), hours, licence no., pharmacist, payments, delivery terms,
  returns policy, FAQ answers. Then set **`isPlaceholder: false`** to enable
  schema.org JSON-LD (Pharmacy, Product, FAQPage).
- `src/data/products.js` — sample catalogue (names, packs, `price` ≤ `mrp`,
  stock, Rx flags). Optional per product: `image: { src, width, height, alt }`
  and `description`.
- Photos: put files in `public/images/` and set `STORE.photos.storefront` and
  product `image` fields — they replace the icon illustrations automatically.
- Map: paste a Google Maps embed URL into `STORE.mapEmbedUrl` (optional).
- `POPULAR_SEARCHES` in `src/pages/Home.jsx` — match your best sellers.
- Page copy in `src/pages/*` is starter text — review all claims.

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
