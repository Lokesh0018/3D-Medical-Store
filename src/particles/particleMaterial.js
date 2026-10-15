import { Color, NormalBlending, ShaderMaterial, Vector2, Vector3, Vector4 } from 'three'

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
 *  4. Hover ripple — in screen space, so it tracks the cursor whatever the
 *     shape's rotation, scale or offset: expanding rings (a small ring buffer
 *     of uniforms) push particles outward on their wavefront, and a soft
 *     field parts particles around the cursor. Affected particles swell and
 *     shift toward the accent colour.
 *  5. Soft point sprites with normal alpha blending read as
 *     tinted dots on the light page, without any post-processing pass.
 */
export const MAX_RIPPLES = 6

const vertexShader = /* glsl */ `
  #define MAX_RIPPLES ${MAX_RIPPLES}

  attribute vec4 aFrom;   // xyz target A + accent
  attribute vec4 aTo;     // xyz target B + accent
  attribute vec4 aRand;   // x: delay, y: size, z: phase, w: brightness
  attribute vec3 aDir;    // unit scatter direction

  uniform float uProgress;
  uniform float uStagger;
  uniform float uScatter;
  uniform float uSweep;
  uniform float uFlow;     // 0..1 radial scatter → horizontal stream
  uniform float uFlowDir;  // ±1, direction of travel toward the next shape
  uniform float uDepth;    // 0..1 depth shading strength
  uniform float uTwinkle;  // brightness flicker amplitude (0.2 = 80..100%)
  uniform float uSettle;
  uniform float uSizeScale;
  uniform float uTurbulence;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uOpacity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uAccent;
  uniform vec4 uRipples[MAX_RIPPLES]; // xy: screen pos, z: start time, w: strength
  uniform vec4 uRippleShape;          // x: life, y: speed, z: width, w: amplitude
  uniform vec3 uPointer;              // xy: screen pos, z: hover strength (0..1)
  uniform vec2 uHoverShape;           // x: radius, y: push
  uniform float uAspect;

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
    // In-flight offset. Radial: scatter along a random direction plus flow,
    // with a tangential sweep so paths curve. Stream (uFlow): particles are
    // drawn out along the direction of travel into a level ribbon with a soft
    // wave — a controlled horizontal flow rather than a burst.
    vec3 tangent = normalize(vec3(-aDir.z, 0.0, aDir.x) + vec3(1e-4, 0.0, 0.0));
    vec3 radial = (aDir * (0.55 + aRand.y) + flow(pos * 0.45, uTime * 0.6, phase) * 0.6) * uScatter
      + tangent * (0.4 + aRand.y) * uSweep;
    vec3 stream = vec3(
      uFlowDir * (0.6 + aRand.y * 2.8),
      -pos.y * 0.55 + (aRand.w - 0.5) * 0.9 + sin(pos.x * 1.2 + uTime * 0.7 + phase) * 0.14,
      -pos.z * 0.5 + aDir.z * 0.25
    ) * uScatter;
    pos += mix(radial, stream, uFlow) * flight;
    // First-load settle: start slightly expanded, ease into the rest pose.
    pos += aDir * (0.3 + aRand.y) * uSettle;
    pos += flow(pos * 0.7, uTime, phase) * uTurbulence;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // Hover ripple, in aspect-corrected screen space (x scaled by aspect).
    vec2 sp = gl_Position.xy / gl_Position.w;
    sp.x *= uAspect;
    vec2 push = vec2(0.0);
    float lift = 0.0;
    for (int i = 0; i < MAX_RIPPLES; i++) {
      vec4 r = uRipples[i];
      float age = uTime - r.z;
      if (r.w <= 0.0 || age < 0.0 || age > uRippleShape.x) continue;
      vec2 d = sp - r.xy;
      float dist = length(d);
      float band = (dist - age * uRippleShape.y) / uRippleShape.z;
      float fade = 1.0 - age / uRippleShape.x;
      float wave = exp(-band * band) * fade * fade * r.w;
      push += d / max(dist, 1e-4) * wave * uRippleShape.w;
      lift += wave;
    }
    vec2 dp = sp - uPointer.xy;
    float pd = length(dp);
    float hover = smoothstep(uHoverShape.x, 0.0, pd) * uPointer.z;
    push += dp / max(pd, 1e-4) * hover * uHoverShape.y;
    lift = min(lift + hover * 0.4, 1.0);
    push.x /= uAspect;
    gl_Position.xy += push * gl_Position.w;

    float depth = -mv.z;
    // Depth shading (uDepth): front of the shape ≈ 1, back ≈ 0.
    float nearness = smoothstep(9.6, 8.4, depth);
    float depthShade = mix(1.0, 0.45 + 0.55 * nearness, uDepth);
    gl_PointSize = uSize * uSizeScale * mix(1.0, 0.8 + 0.3 * nearness, uDepth) * (0.45 + aRand.y * 0.9) * uPixelRatio * (1.0 - flight * 0.25) / max(depth, 0.5);
    // Cap sprite size so particles passing close to the camera stay crisp dots.
    gl_PointSize = min(gl_PointSize, 14.0 * uPixelRatio) * (1.0 + lift * 0.25);

    float accent = mix(aFrom.w, aTo.w, e);
    vec3 base = mix(uColorA, uColorB, aRand.w);
    vColor = mix(mix(base, uAccent, accent * 0.7), uAccent, lift * 0.3);

    // Gentle twinkle (amplitude per section) and depth fade keep motion calm.
    float twinkle = 1.0 - uTwinkle + uTwinkle * sin(uTime * 1.3 + phase);
    float fog = smoothstep(18.0, 6.0, depth);
    vAlpha = min(uOpacity * (0.45 + 0.55 * aRand.w) * twinkle * fog * depthShade * (1.0 + lift * 0.3), 1.0);
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
    // Normal blending: an additive glow would vanish against the white page.
    gl_FragColor = vec4(vColor, glow * vAlpha);
  }
`

export function createParticleMaterial({ size, pixelRatio }) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: NormalBlending,
    uniforms: {
      uProgress: { value: 0 },
      uStagger: { value: 0.4 },
      uScatter: { value: 1.5 },
      uSweep: { value: 0 },
      uFlow: { value: 0 },
      uFlowDir: { value: -1 },
      uDepth: { value: 0 },
      uTwinkle: { value: 0.2 },
      uSettle: { value: 0 },
      uSizeScale: { value: 1 },
      uTurbulence: { value: 0.045 },
      uTime: { value: 0 },
      uSize: { value: size },
      uPixelRatio: { value: pixelRatio },
      uOpacity: { value: 0 },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() },
      uAccent: { value: new Color() },
      uRipples: { value: Array.from({ length: MAX_RIPPLES }, () => new Vector4(0, 0, 0, 0)) },
      uRippleShape: { value: new Vector4() },
      uPointer: { value: new Vector3() },
      uHoverShape: { value: new Vector2() },
      uAspect: { value: 1 },
    },
  })
}
