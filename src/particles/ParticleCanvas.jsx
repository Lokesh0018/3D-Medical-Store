import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PARTICLE_CONFIG } from './config.js'
import { getQualityTier } from './quality.js'
import { ParticleScrollController } from './ParticleScrollController.js'
import ParticleField from './ParticleField.jsx'

/**
 * Lazily loaded WebGL layer (three.js, R3F and GSAP live in this chunk).
 * Mounted once for the whole app, so route changes never re-create the
 * GL context — only the section scan is redone.
 */
export default function ParticleCanvas({ routeKey, still = false, onReady, onFail }) {
  const [quality] = useState(getQualityTier)
  const tier = PARTICLE_CONFIG.tiers[quality]
  const controllerRef = useRef(null)
  const [running, setRunning] = useState(true)

  // One controller for the canvas lifetime; StrictMode/HMR double-mounts
  // destroy the first instance, so ScrollTriggers never duplicate.
  useEffect(() => {
    const controller = new ParticleScrollController()
    controllerRef.current = controller
    return () => {
      controller.destroy()
      controllerRef.current = null
    }
  }, [])

  // Re-scan sections after every route render (effects run post-commit, so
  // the new page's DOM is present).
  useEffect(() => {
    controllerRef.current?.scan(document)
  }, [routeKey])

  // Render only while a particle section is on screen and the tab is visible.
  // Light (opaque) sections cover the canvas, so the GPU idles there.
  useEffect(() => {
    const controller = controllerRef.current
    if (!controller) return
    const visible = new Set()
    let tabVisible = !document.hidden
    const update = () => setRunning(tabVisible && visible.size > 0)

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target)
        else visible.delete(entry.target)
      }
      update()
    }, { rootMargin: '15% 0px' })

    const observe = (c) => {
      io.disconnect()
      visible.clear()
      c.sections.forEach((el) => io.observe(el))
    }
    observe(controller)
    const unsubscribe = controller.subscribe(observe)

    const onVisibility = () => {
      tabVisible = !document.hidden
      update()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      unsubscribe()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const glOptions = useMemo(() => ({
    antialias: false,
    alpha: true,
    depth: false,
    stencil: false,
    powerPreference: quality === 'high' ? 'high-performance' : 'default',
  }), [quality])

  const cleanupRef = useRef(null)
  useEffect(() => () => cleanupRef.current?.(), [])

  return (
    <Canvas
      className="particle-canvas"
      frameloop={running ? (still ? 'demand' : 'always') : 'never'}
      dpr={tier.dpr}
      gl={glOptions}
      camera={{ fov: PARTICLE_CONFIG.camera.fov, position: [0, 0, PARTICLE_CONFIG.camera.z], near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        const canvas = gl.domElement
        const onLost = (e) => {
          e.preventDefault()
          onFail?.()
        }
        canvas.addEventListener('webglcontextlost', onLost)
        cleanupRef.current = () => canvas.removeEventListener('webglcontextlost', onLost)
      }}
    >
      <ParticleField controllerRef={controllerRef} tier={tier} still={still} onReady={onReady} />
    </Canvas>
  )
}
