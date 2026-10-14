import { Component } from 'react'

/** Catches WebGL/shader initialisation errors so the static fallback takes over. */
export default class ParticleErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.warn('[particles] falling back to static visual:', error)
    this.props.onError?.(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
