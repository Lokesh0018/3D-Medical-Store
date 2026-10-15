/**
 * Deterministic target-shape generators.
 *
 * Each generator returns a Float32Array of `count * 4` values: xyz position
 * plus an `accent` weight (0..1) the shader uses to highlight structure.
 *
 * Design rules that keep morphing smooth and cheap:
 *  - A seeded PRNG per shape means particle i always lands on the same spot,
 *    so scrolling back and forth never reshuffles the scene.
 *  - Every particle samples its target independently (no sequential index
 *    walks), so any prefix of the population is a uniform sample of the
 *    shape. The renderer can shrink its draw range on weak GPUs and every
 *    silhouette stays recognisable.
 *  - Shapes are centred and normalised to a target size (config.shapeSize).
 */
import { PARTICLE_CONFIG } from './config.js'

const TAU = Math.PI * 2

function mulberry32(seed) {
  return function rand() {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gauss(rand) {
  let u = 0
  while (u === 0) u = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * rand())
}

/** Uniform random unit vector written into `out`. */
function randomDirection(rand, out) {
  const z = rand() * 2 - 1
  const a = rand() * TAU
  const r = Math.sqrt(1 - z * z)
  out[0] = r * Math.cos(a)
  out[1] = r * Math.sin(a)
  out[2] = z
  return out
}

function rotateZ(arr, angle) {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  for (let i = 0; i < arr.length; i += 4) {
    const x = arr[i]
    const y = arr[i + 1]
    arr[i] = x * c - y * s
    arr[i + 1] = x * s + y * c
  }
}

function rotateX(arr, angle) {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  for (let i = 0; i < arr.length; i += 4) {
    const y = arr[i + 1]
    const z = arr[i + 2]
    arr[i + 1] = y * c - z * s
    arr[i + 2] = y * s + z * c
  }
}

/** Centre the bounding box on the origin and scale the largest side to `size`. */
function normalize(arr, size) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < arr.length; i += 4) {
    for (let k = 0; k < 3; k++) {
      const v = arr[i + k]
      if (v < min[k]) min[k] = v
      if (v > max[k]) max[k] = v
    }
  }
  const extent = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1
  const s = size / extent
  const c = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]
  for (let i = 0; i < arr.length; i += 4) {
    arr[i] = (arr[i] - c[0]) * s
    arr[i + 1] = (arr[i + 1] - c[1]) * s
    arr[i + 2] = (arr[i + 2] - c[2]) * s
  }
  return arr
}

function write(arr, i, x, y, z, accent) {
  const o = i * 4
  arr[o] = x
  arr[o + 1] = y
  arr[o + 2] = z
  arr[o + 3] = accent
}

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

/** Wide spherical cloud that sits beyond the viewport edges — the intro state. */
function cloud(count, rand) {
  const out = new Float32Array(count * 4)
  const d = [0, 0, 0]
  for (let i = 0; i < count; i++) {
    randomDirection(rand, d)
    const r = 3.5 + Math.sqrt(rand()) * 7
    // z is compressed so no particle starts near the camera (no giant blurry sprites).
    write(out, i, d[0] * r * 1.4, d[1] * r * 0.9, d[2] * r * 0.45 - 2.5, rand() < 0.05 ? 1 : 0)
  }
  return out
}

/** Fisher–Yates shuffle with the shape's seeded PRNG. */
function shuffle(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) {
    const k = Math.floor(rand() * (i + 1))
    const t = arr[i]
    arr[i] = arr[k]
    arr[k] = t
  }
  return arr
}

/**
 * Medical cross: an extruded plus sign, sampled in layers.
 *
 * Faces use stratified (jittered-grid) sampling instead of pure random
 * points, so the fill is even — no clumps or holes — and the silhouette reads
 * as precise rather than noisy. Front and back rims are traced with tight
 * jitter to give crisp edges on both planes; side walls join them and a
 * sparse interior adds volume. Each stratified pool is shuffled, so particle
 * i still lands on an arbitrary spot and any prefix of the population remains
 * a uniform sample (the density fallback relies on that).
 */
function cross(count, rand) {
  const A = 1.95 // half arm length
  const W = 0.68 // half arm width
  const D = 0.42 // half depth
  const outline = [
    [W, A], [-W, A], [-W, W], [-A, W], [-A, -W], [-W, -W],
    [-W, -A], [W, -A], [W, -W], [A, -W], [A, W], [W, W],
  ]
  const segLen = outline.map((p, i) => {
    const q = outline[(i + 1) % outline.length]
    return Math.hypot(q[0] - p[0], q[1] - p[1])
  })
  const perimeter = segLen.reduce((a, b) => a + b, 0)
  const inside = (x, y) =>
    (Math.abs(x) <= W && Math.abs(y) <= A) || (Math.abs(y) <= W && Math.abs(x) <= A)

  const alongOutline = (t) => {
    let i = 0
    while (t > segLen[i] && i < segLen.length - 1) t -= segLen[i++]
    const p = outline[i]
    const q = outline[(i + 1) % outline.length]
    const f = t / segLen[i]
    return [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]
  }

  // Stratified pools: roughly n evenly spread points each, then shuffled.
  const facePool = (n) => {
    const area = 8 * A * W - 4 * W * W
    const h = Math.sqrt(area / Math.max(n, 1))
    const pts = []
    for (let gx = -A; gx < A; gx += h) {
      for (let gy = -A; gy < A; gy += h) {
        const x = gx + rand() * h
        const y = gy + rand() * h
        if (inside(x, y)) pts.push([x, y])
      }
    }
    return shuffle(pts, rand)
  }
  const outlinePool = (n) => {
    const pts = []
    for (let k = 0; k < n; k++) pts.push(alongOutline(((k + rand()) / n) * perimeter))
    return shuffle(pts, rand)
  }
  const randomFace = () => {
    for (;;) {
      const x = (rand() * 2 - 1) * A
      const y = (rand() * 2 - 1) * A
      if (inside(x, y)) return [x, y]
    }
  }
  // Draw from a pool; if random layer picks overrun it, fall back to random.
  const take = (pool, fallback) => pool.pop() ?? fallback()
  const randomOutline = () => alongOutline(rand() * perimeter)

  // Layer shares of the population.
  const FRONT = 0.3
  const BACK = 0.12
  const WALL = 0.24
  const RIM_FRONT = 0.16
  const RIM_BACK = 0.08 // remainder (0.10): interior volume
  const front = facePool(count * FRONT)
  const back = facePool(count * BACK)
  const wall = outlinePool(Math.ceil(count * WALL))
  const rimFront = outlinePool(Math.ceil(count * RIM_FRONT))
  const rimBack = outlinePool(Math.ceil(count * RIM_BACK))

  const out = new Float32Array(count * 4)
  const jFace = 0.012
  const jRim = 0.007
  for (let i = 0; i < count; i++) {
    const r = rand()
    let x, y, z, accent, j
    if (r < FRONT) {
      ;[x, y] = take(front, randomFace)
      z = D
      accent = 0.12
      j = jFace
    } else if (r < FRONT + BACK) {
      ;[x, y] = take(back, randomFace)
      z = -D
      accent = 0
      j = jFace
    } else if (r < FRONT + BACK + WALL) {
      ;[x, y] = take(wall, randomOutline)
      z = (rand() * 2 - 1) * D
      accent = 0.5
      j = jRim
    } else if (r < FRONT + BACK + WALL + RIM_FRONT) {
      ;[x, y] = take(rimFront, randomOutline)
      z = D
      accent = 1
      j = jRim
    } else if (r < FRONT + BACK + WALL + RIM_FRONT + RIM_BACK) {
      ;[x, y] = take(rimBack, randomOutline)
      z = -D
      accent = 0.7
      j = jRim
    } else {
      ;[x, y] = randomFace()
      z = (rand() * 2 - 1) * D * 0.8
      accent = 0
      j = jFace
    }
    write(out, i, x + gauss(rand) * j, y + gauss(rand) * j, z + gauss(rand) * j, accent)
  }
  return normalize(out, PARTICLE_CONFIG.shapeSize.cross)
}

/**
 * DNA double helix: two phase-shifted backbones (offset < π to suggest the
 * major/minor grooves) joined by evenly spaced base-pair rungs. The two halves
 * of each rung carry different accents, like paired bases.
 */
function dna(count, rand) {
  const H = 5.4
  const R = 1.05
  const turns = 2.3
  const offset = Math.PI * 0.82
  const rungs = 26
  const out = new Float32Array(count * 4)

  for (let i = 0; i < count; i++) {
    if (rand() < 0.58) {
      const t = rand()
      const strand = rand() < 0.5 ? 0 : 1
      const a = t * turns * TAU + strand * offset
      write(
        out, i,
        R * Math.cos(a) + gauss(rand) * 0.06,
        (t - 0.5) * H + gauss(rand) * 0.06,
        R * Math.sin(a) + gauss(rand) * 0.06,
        strand ? 0.3 : 0,
      )
    } else {
      const k = Math.floor(rand() * rungs)
      const t = (k + 0.5) / rungs
      const a0 = t * turns * TAU
      const a1 = a0 + offset
      const u = rand()
      const x = R * (Math.cos(a0) + (Math.cos(a1) - Math.cos(a0)) * u)
      const z = R * (Math.sin(a0) + (Math.sin(a1) - Math.sin(a0)) * u)
      write(
        out, i,
        x + gauss(rand) * 0.03,
        (t - 0.5) * H + gauss(rand) * 0.03,
        z + gauss(rand) * 0.03,
        u < 0.5 ? 1 : 0.65,
      )
    }
  }
  rotateZ(out, 0.38)
  return normalize(out, PARTICLE_CONFIG.shapeSize.dna)
}

/**
 * Ball-and-stick molecule (acetylsalicylic acid skeleton — a familiar
 * pharmacy molecule). Atoms are sampled as shells weighted by surface area;
 * bonds as thin cylinders between atom surfaces, with double bonds drawn as
 * two parallel cylinders. Substituents get small z offsets for real depth.
 */
function molecule(count, rand) {
  // [x, y, z, isOxygen]; bond length = 1
  const atoms = [
    [0, 1, 0, 0], [0.866, 0.5, 0, 0], [0.866, -0.5, 0, 0],
    [0, -1, 0, 0], [-0.866, -0.5, 0, 0], [-0.866, 0.5, 0, 0], // benzene ring
    [-1.732, 1, 0.1, 0], // carboxyl C
    [-1.732, 2, 0.3, 1], // =O
    [-2.598, 0.5, 0.35, 1], // -OH
    [0, 2, -0.15, 1], // ester O
    [0.866, 2.5, -0.25, 0], // carbonyl C
    [0.866, 3.5, 0.3, 1], // =O
    [1.732, 2, -0.45, 0], // methyl C
  ]
  const bonds = [
    [0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1],
    [5, 6, 1], [6, 7, 2], [6, 8, 1], [0, 9, 1], [9, 10, 1], [10, 11, 2], [10, 12, 1],
  ]
  const radius = (a) => (a[3] ? 0.34 : 0.28)
  const atomWeights = atoms.map((a) => radius(a) ** 2)
  const atomTotal = atomWeights.reduce((s, w) => s + w, 0)
  const bondWeights = bonds.map(([a, b, order]) =>
    Math.hypot(atoms[b][0] - atoms[a][0], atoms[b][1] - atoms[a][1], atoms[b][2] - atoms[a][2]) * order)
  const bondTotal = bondWeights.reduce((s, w) => s + w, 0)

  const pick = (weights, total) => {
    let t = rand() * total
    let i = 0
    while (t > weights[i] && i < weights.length - 1) t -= weights[i++]
    return i
  }

  const out = new Float32Array(count * 4)
  const d = [0, 0, 0]
  for (let i = 0; i < count; i++) {
    if (rand() < 0.6) {
      const atom = atoms[pick(atomWeights, atomTotal)]
      const r = radius(atom) * (0.82 + 0.18 * rand())
      randomDirection(rand, d)
      write(out, i, atom[0] + d[0] * r, atom[1] + d[1] * r, atom[2] + d[2] * r, atom[3] ? 1 : 0.12)
    } else {
      const [ia, ib, order] = bonds[pick(bondWeights, bondTotal)]
      const A = atoms[ia]
      const B = atoms[ib]
      const dx = B[0] - A[0]
      const dy = B[1] - A[1]
      const dz = B[2] - A[2]
      const len = Math.hypot(dx, dy, dz)
      const ux = dx / len
      const uy = dy / len
      const uz = dz / len
      // Perpendicular basis: p lies in the molecule plane, q completes it.
      let px = -uy
      let py = ux
      const pl = Math.hypot(px, py) || 1
      px /= pl
      py /= pl
      const qx = uy * 0 - uz * py
      const qy = uz * px - ux * 0
      const qz = ux * py - uy * px
      const t = radius(A) / len + rand() * (1 - (radius(A) + radius(B)) / len)
      const lane = order === 2 ? (rand() < 0.5 ? -0.09 : 0.09) : 0
      const ang = rand() * TAU
      const rr = 0.045 * Math.sqrt(rand())
      const ox = px * (lane + Math.cos(ang) * rr) + qx * Math.sin(ang) * rr
      const oy = py * (lane + Math.cos(ang) * rr) + qy * Math.sin(ang) * rr
      const oz = qz * Math.sin(ang) * rr
      write(out, i, A[0] + dx * t + ox, A[1] + dy * t + oy, A[2] + dz * t + oz, 0.4)
    }
  }
  rotateZ(out, -0.18)
  return normalize(out, PARTICLE_CONFIG.shapeSize.molecule)
}

/**
 * Heartbeat (ECG) waveform: two P-QRS-T complexes built from Gaussians.
 * A dense polyline is sampled by arc length so steep QRS spikes get as many
 * particles per unit length as the flat baseline. A gentle z-wave gives the
 * trace depth when the field rotates; a sparse halo softens the line.
 */
function heartbeat(count, rand) {
  const g = (u, s) => Math.exp(-(u * u) / (2 * s * s))
  const beats = [-1.6, 1.8]
  const ecg = (x) =>
    beats.reduce((y, c) => {
      const u = x - c
      return y + 0.22 * g(u + 0.62, 0.09) - 0.28 * g(u + 0.12, 0.035) + 2.1 * g(u, 0.045)
        - 0.55 * g(u - 0.12, 0.04) + 0.42 * g(u - 0.62, 0.15)
    }, 0)

  const M = 1600
  const xs = new Float32Array(M)
  const ys = new Float32Array(M)
  const cum = new Float32Array(M)
  for (let k = 0; k < M; k++) {
    xs[k] = -3.6 + (7.2 * k) / (M - 1)
    ys[k] = ecg(xs[k])
    cum[k] = k === 0 ? 0 : cum[k - 1] + Math.hypot(xs[k] - xs[k - 1], ys[k] - ys[k - 1])
  }
  const total = cum[M - 1]

  const out = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) {
    const s = rand() * total
    let lo = 0
    let hi = M - 1
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1
      if (cum[mid] < s) lo = mid
      else hi = mid
    }
    const f = (s - cum[lo]) / (cum[hi] - cum[lo] || 1)
    const x = xs[lo] + (xs[hi] - xs[lo]) * f
    const y = ys[lo] + (ys[hi] - ys[lo]) * f
    const halo = rand() < 0.12
    const spread = halo ? 0.22 : 0.045
    write(
      out, i,
      x + gauss(rand) * spread * 0.5,
      y + gauss(rand) * spread,
      0.28 * Math.sin(x * 0.9) + gauss(rand) * spread,
      halo ? 0 : Math.abs(y) > 0.35 ? 1 : 0.25,
    )
  }
  return normalize(out, PARTICLE_CONFIG.shapeSize.heartbeat)
}

/** Two-tone medicine capsule with a seam ring and loose granules inside. */
function capsule(count, rand) {
  const L = 1.35 // half cylinder length
  const R = 0.82
  const cylArea = TAU * R * 2 * L
  const capArea = 4 * Math.PI * R * R
  const out = new Float32Array(count * 4)
  const d = [0, 0, 0]
  for (let i = 0; i < count; i++) {
    const r = rand()
    let x, y, z, accent
    if (r < 0.06) {
      const a = rand() * TAU
      x = Math.cos(a) * R * 1.02
      z = Math.sin(a) * R * 1.02
      y = gauss(rand) * 0.02
      accent = 0.6
    } else if (r < 0.2) {
      const a = rand() * TAU
      const rr = R * 0.7 * Math.sqrt(rand())
      x = Math.cos(a) * rr
      z = Math.sin(a) * rr
      y = (rand() * 2 - 1) * (L + R * 0.4)
      accent = 0.5
    } else if (rand() < cylArea / (cylArea + capArea)) {
      const a = rand() * TAU
      x = Math.cos(a) * R
      z = Math.sin(a) * R
      y = (rand() * 2 - 1) * L
      accent = y > 0 ? 1 : 0
    } else {
      randomDirection(rand, d)
      x = d[0] * R
      z = d[2] * R
      y = d[1] * R + (d[1] > 0 ? L : -L)
      accent = y > 0 ? 1 : 0
    }
    write(out, i, x, y, z, accent)
  }
  rotateZ(out, -0.78)
  rotateX(out, 0.35)
  return normalize(out, PARTICLE_CONFIG.shapeSize.capsule)
}

/** Glowing orb: a shell with an orbiting equatorial ring. */
function sphere(count, rand) {
  const out = new Float32Array(count * 4)
  const d = [0, 0, 0]
  for (let i = 0; i < count; i++) {
    if (rand() < 0.78) {
      randomDirection(rand, d)
      const r = 1.6 * (0.94 + 0.06 * rand())
      write(out, i, d[0] * r, d[1] * r, d[2] * r, rand() < 0.08 ? 1 : 0.1)
    } else {
      const a = rand() * TAU
      const r = 2.35 + gauss(rand) * 0.04
      write(out, i, Math.cos(a) * r, gauss(rand) * 0.03, Math.sin(a) * r, 0.8)
    }
  }
  rotateX(out, 0.42)
  rotateZ(out, 0.25)
  return normalize(out, PARTICLE_CONFIG.shapeSize.sphere)
}

/**
 * Delivery van in side profile, driving toward +x: an extruded cargo box and
 * a cab with a sloped windshield, two wheels per side, a medical cross on the
 * cargo panel (the pharmacy's mark) and short speed lines trailing behind.
 * Faces are sparse fills; box edges, cab outline, window, wheels and cross
 * carry most particles (high accent), so the silhouette reads crisply even
 * while the shape gently sways.
 */
function truck(count, rand) {
  const D = 0.62 // half depth (body width)
  const GROUND = -0.55 // underside of the body
  // Cargo box: x0..x1, y0..y1.
  const box = { x0: -2.0, x1: 0.55, y0: GROUND, y1: 1.2 }
  // Cab outline (counter-clockwise), with a sloped windshield at the front.
  const cab = [[0.55, GROUND], [1.75, GROUND], [1.75, 0.12], [1.42, 0.68], [0.55, 0.68]]
  const windowPoly = [[0.72, 0.12], [1.5, 0.12], [1.3, 0.52], [0.72, 0.52]]
  const wheels = [-1.25, 1.12] // axle x positions
  const WHEEL_R = 0.36
  const WHEEL_Y = GROUND - 0.06

  const inPoly = (poly, x, y) => {
    let inside = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i]
      const [xj, yj] = poly[j]
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
    }
    return inside
  }
  const onPoly = (poly) => {
    const lens = poly.map((p, i) => Math.hypot(poly[(i + 1) % poly.length][0] - p[0], poly[(i + 1) % poly.length][1] - p[1]))
    let t = rand() * lens.reduce((a, b) => a + b, 0)
    let i = 0
    while (t > lens[i] && i < lens.length - 1) t -= lens[i++]
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const f = t / lens[i]
    return [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]
  }
  const boxPoly = [[box.x0, box.y0], [box.x1, box.y0], [box.x1, box.y1], [box.x0, box.y1]]
  const side = () => (rand() < 0.78 ? D : -D) // favour the side facing the viewer

  // Medical cross on the cargo panel.
  const CX = -0.72
  const CY = 0.33
  const CA = 0.42 // half arm length
  const CW = 0.14 // half arm width
  const inCross = (x, y) =>
    (Math.abs(x - CX) <= CW && Math.abs(y - CY) <= CA) || (Math.abs(y - CY) <= CW && Math.abs(x - CX) <= CA)

  const out = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) {
    const r = rand()
    let x, y, z, accent
    if (r < 0.1) {
      // Cargo box side panels (sparse fill).
      x = box.x0 + rand() * (box.x1 - box.x0)
      y = box.y0 + rand() * (box.y1 - box.y0)
      z = side()
      accent = 0.08
    } else if (r < 0.25) {
      // Cargo box edges: both side outlines plus the depth edges at corners.
      if (rand() < 0.72) {
        ;[x, y] = onPoly(boxPoly)
        z = side()
      } else {
        ;[x, y] = boxPoly[Math.floor(rand() * 4)]
        z = (rand() * 2 - 1) * D
      }
      accent = 0.65
    } else if (r < 0.31) {
      // Cargo roof and rear door panels, for volume.
      if (rand() < 0.6) {
        x = box.x0 + rand() * (box.x1 - box.x0)
        y = box.y1
      } else {
        x = box.x0
        y = box.y0 + rand() * (box.y1 - box.y0)
      }
      z = (rand() * 2 - 1) * D
      accent = 0.2
    } else if (r < 0.36) {
      // Cab side panels (sparse fill, window left open).
      do {
        x = 0.55 + rand() * 1.2
        y = GROUND + rand() * 1.23
      } while (!inPoly(cab, x, y) || inPoly(windowPoly, x, y))
      z = side()
      accent = 0.08
    } else if (r < 0.47) {
      // Cab outline, plus its depth edges and the windshield/hood surfaces.
      const k = rand()
      if (k < 0.6) {
        ;[x, y] = onPoly(cab)
        z = side()
      } else if (k < 0.8) {
        ;[x, y] = cab[1 + Math.floor(rand() * 4)]
        z = (rand() * 2 - 1) * D
      } else {
        // Windshield surface across the width.
        const f = rand()
        x = 1.75 - 0.33 * f
        y = 0.12 + 0.56 * f
        z = (rand() * 2 - 1) * D
      }
      accent = 0.65
    } else if (r < 0.52) {
      // Side window frame.
      ;[x, y] = onPoly(windowPoly)
      z = side()
      accent = 0.9
    } else if (r < 0.66) {
      // Medical cross on the cargo panel, raised off the surface on the side
      // facing the viewer so it reads as the van's livery.
      do {
        x = CX + (rand() * 2 - 1) * CA
        y = CY + (rand() * 2 - 1) * CA
      } while (!inCross(x, y))
      z = D * 1.04
      accent = 1
    } else if (r < 0.86) {
      // Wheels: tyre ring (dense) and hub, on both sides.
      const wx = wheels[rand() < 0.5 ? 0 : 1]
      const a = rand() * TAU
      const hub = rand() < 0.25
      const rr = hub ? WHEEL_R * 0.38 : WHEEL_R * (0.86 + rand() * 0.14)
      x = wx + Math.cos(a) * rr
      y = WHEEL_Y + Math.sin(a) * rr
      z = side() * 1.04 + (hub ? 0 : (rand() * 2 - 1) * 0.08)
      accent = hub ? 1 : 0.8
    } else if (r < 0.93) {
      // Speed lines trailing the van: three dashed strokes behind the box.
      const lane = Math.floor(rand() * 3)
      const ly = [0.92, 0.36, -0.2][lane]
      const len = [0.7, 1.0, 0.55][lane]
      x = box.x0 - 0.25 - rand() * len
      y = ly + gauss(rand) * 0.012
      z = gauss(rand) * 0.05
      accent = 0.45
    } else {
      // Sparse interior volume.
      x = box.x0 + rand() * (1.75 - box.x0)
      y = GROUND + rand() * (x < box.x1 ? box.y1 - GROUND : 1.2)
      if (x >= box.x1 && !inPoly(cab, x, y)) y = GROUND + rand() * 0.6
      z = (rand() * 2 - 1) * D * 0.8
      accent = 0
    }
    write(out, i, x + gauss(rand) * 0.008, y + gauss(rand) * 0.008, z + gauss(rand) * 0.008, accent)
  }
  // A slight three-quarter turn so depth reads, while the profile stays clear.
  rotateX(out, 0.12)
  return normalize(out, PARTICLE_CONFIG.shapeSize.truck)
}

/** Low-density ambient field spread across and behind the viewport. */
function field(count, rand) {
  const out = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) {
    write(
      out, i,
      (rand() * 2 - 1) * 7.5,
      (rand() * 2 - 1) * 4.6,
      -5 + rand() * 7.5,
      rand() < 0.1 ? 1 : 0,
    )
  }
  return out
}

const GENERATORS = { cloud, cross, dna, molecule, heartbeat, capsule, truck, sphere, field }
const SEEDS = { cloud: 11, cross: 23, dna: 37, molecule: 41, heartbeat: 53, capsule: 67, truck: 71, sphere: 79, field: 83 }

export const SHAPE_NAMES = Object.keys(GENERATORS)

const cache = new Map()

/** Get (and memoise) the target buffer for a shape at a given population size. */
export function getShape(name, count) {
  const key = `${name}:${count}`
  let buf = cache.get(key)
  if (!buf) {
    const gen = GENERATORS[name] ?? GENERATORS.field
    buf = gen(count, mulberry32(SEEDS[name] ?? 1))
    cache.set(key, buf)
  }
  return buf
}
