import { useEffect, useState } from 'react'
import { openStatus } from '../data/hours.js'
import './OpenStatus.css'

/**
 * Live "Open now / Closed" badge in the store's time zone. Rendered only
 * after mount (pre-rendered HTML would otherwise bake in the build time), with
 * space reserved so it causes no layout shift. Refreshes every minute.
 */
export default function OpenStatus({ className = '' }) {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    const tick = () => setStatus(openStatus())
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className={`open-status ${status ? (status.open ? 'is-open' : 'is-closed') : 'is-pending'} ${className}`}>
      <span className="open-status__dot" aria-hidden="true" />
      {status ? status.text : 'Checking hours…'}
    </span>
  )
}
