import { AdditiveBlending, Color, ShaderMaterial } from 'three'

/**
 * Particle morph shader.
 *
 * The CPU only uploads two target buffers (aFrom / aTo) when the active
 * transition segment changes. All per-frame work happens here on the GPU:
 *
 *  1. Staggered progress — each particle starts its journey after a random
 *     delay (aRand.x * uStagger), so shapes dissolve and regroup gradually.
 *  2. Scatter — while in flight (sin(π·p) > 0) particles are pushed outward
 *     along a fixed random direction plus a flow field, so they travel
 *     through 3D space instead of sliding in straight lines. Both terms are
 *     zero at p = 0 and p = 1, so segment boundaries are seamless.
 *  3. Idle turbulence — a cheap sum-of-sines flow keeps formed shapes alive
 *     with sub-pixel drift (scaled by uTurbulence).
 *  4. Soft point sprites with additive blending give a restrained glow
 *     without any post-processing pass.
 */
const vertexShader = /* glsl */ `
  attribute vec4 aFrom;   // xyz target A + accent
  attribute vec4 aTo;     // xyz target B + accent
  attribute vec4 aRand;   // x: delay, y: size, z: phase, w: brightness
  attribute vec3 aDir;    // unit scatter direction

  uniform float uProgress;
  uniform float uStagger;
  uniform float uScatter;
  uniform float uTurbulence;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uOpacity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uAccent;

  varying vec3 vColor;
  varying float vAlpha;

  vec3 flow(vec3 p, float t, float phase) {
    return vec3(
      sin(p.y * 1.3 + t * 0.7 + phase),
      sin(p.z * 1.1 + t * 0.6 + phase * 1.7),
      sin(p.x * 1.2 + t * 0.5 + phase * 2.3)
    );
  }

  void main() {
    float phase = aRand.z * 6.2831853;
    float p = clamp((uProgress - aRand.x * uStagger) / (1.0 - uStagger), 0.0, 1.0);
    float e = p * p * p * (p * (p * 6.0 - 15.0) + 10.0); // smootherstep
    float flight = sin(3.14159265 * p);

    vec3 pos = mix(aFrom.xyz, aTo.xyz, e);
    pos += (aDir * (0.55 + aRand.y) + flow(pos * 0.45, uTime * 0.6, phase) * 0.6) * uScatter * flight;
    pos += flow(pos * 0.7, uTime, phase) * uTurbulence;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float depth = -mv.z;
    gl_PointSize = uSize * (0.45 + aRand.y * 0.9) * uPixelRatio * (1.0 - flight * 0.25) / max(depth, 0.5);
    // Cap sprite size so particles passing close to the camera stay crisp dots.
    gl_PointSize = min(gl_PointSize, 14.0 * uPixelRatio);

    float accent = mix(aFrom.w, aTo.w, e);
    vec3 base = mix(uColorA, uColorB, aRand.w);
    vColor = mix(base, uAccent, accent * 0.7) * (1.0 + flight * 0.25);

    // Gentle twinkle (never below 80%) and depth fade keep motion calm.
    float twinkle = 0.8 + 0.2 * sin(uTime * 1.3 + phase);
    float fog = smoothstep(18.0, 6.0, depth);
    vAlpha = uOpacity * (0.45 + 0.55 * aRand.w) * twinkle * fog;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = smoothstep(0.5, 0.0, d);
    glow *= glow;
    if (glow < 0.01) discard;
    // Additive blending: premultiply so overlaps brighten, never go opaque.
    gl_FragColor = vec4(vColor * glow * vAlpha, 1.0);
  }
`

export function createParticleMaterial({ size, pixelRatio }) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
    uniforms: {
      uProgress: { value: 0 },
      uStagger: { value: 0.4 },
      uScatter: { value: 1.5 },
      uTurbulence: { value: 0.045 },
      uTime: { value: 0 },
      uSize: { value: size },
      uPixelRatio: { value: pixelRatio },
      uOpacity: { value: 0 },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() },
      uAccent: { value: new Color() },
    },
  })
}
