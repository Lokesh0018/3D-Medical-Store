import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ParticleSystem } from './ParticleSystem.js'

/**
 * React binding for the shared ParticleSystem. All per-frame work lives in
 * the system; this component wires it to R3F's loop without React state
 * updates per frame.
 */
export default function ParticleField({ controllerRef, tier, onReady }) {
  const gl = useThree((s) => s.gl)
  const setDpr = useThree((s) => s.setDpr)
  const [system] = useState(() => new ParticleSystem({
    count: tier.count,
    size: tier.size,
    pixelRatio: gl.getPixelRatio(),
  }))

  useEffect(() => () => system.dispose(), [system])

  // Pointer parallax on fine pointers only; touch devices get no listeners.
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const onMove = (e) => system.setPointer(
      (e.clientX / window.innerWidth) * 2 - 1,
      (e.clientY / window.innerHeight) * 2 - 1,
    )
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [system])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__particles = system
    return () => { delete window.__particles }
  }, [system])

  const readySent = useRef(false)
  useFrame((state, delta) => {
    const controller = controllerRef.current
    if (!controller) return
    const drew = system.update({
      controller,
      viewport: state.viewport,
      pixelRatio: state.gl.getPixelRatio(),
      delta,
    })
    if (!drew) return
    if (!readySent.current) {
      readySent.current = true
      onReady?.()
    }
    if (system.monitor(delta) === 'dpr') setDpr(1)
  })

  return <primitive object={system.points} />
}
