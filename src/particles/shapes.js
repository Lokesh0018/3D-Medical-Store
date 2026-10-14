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
    write(out, i, d[0] * r * 1.4, d[1] * r * 0.9, d[2] * r - 2, rand() < 0.05 ? 1 : 0)
  }
  return out
}

/**
 * Medical cross: an extruded plus sign. The 12-vertex outline is sampled for
 * side walls and a crisp front rim (which define the silhouette); the front and
 * back faces are filled by rejection sampling; a sparse interior adds depth.
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

  const onOutline = () => {
    let t = rand() * perimeter
    let i = 0
    while (t > segLen[i]) t -= segLen[i++]
    const p = outline[i]
    const q = outline[(i + 1) % outline.length]
    const f = t / segLen[i]
    return [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]
  }
  const inside = (x, y) =>
    (Math.abs(x) <= W && Math.abs(y) <= A) || (Math.abs(y) <= W && Math.abs(x) <= A)
  const inFace = () => {
    for (;;) {
      const x = (rand() * 2 - 1) * A
      const y = (rand() * 2 - 1) * A
      if (inside(x, y)) return [x, y]
    }
  }

  const out = new Float32Array(count * 4)
  const j = 0.012
  for (let i = 0; i < count; i++) {
    const r = rand()
    let x, y, z, accent
    if (r < 0.28) {
      ;[x, y] = inFace()
      z = D
      accent = 0.15
    } else if (r < 0.42) {
      ;[x, y] = inFace()
      z = -D
      accent = 0
    } else if (r < 0.72) {
      ;[x, y] = onOutline()
      z = (rand() * 2 - 1) * D
      accent = 0.55
    } else if (r < 0.86) {
      ;[x, y] = onOutline()
      z = D
      accent = 1
    } else {
      ;[x, y] = inFace()
      z = (rand() * 2 - 1) * D * 0.8
      accent = 0
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

const GENERATORS = { cloud, cross, dna, molecule, heartbeat, capsule, sphere, field }
const SEEDS = { cloud: 11, cross: 23, dna: 37, molecule: 41, heartbeat: 53, capsule: 67, sphere: 79, field: 83 }

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
