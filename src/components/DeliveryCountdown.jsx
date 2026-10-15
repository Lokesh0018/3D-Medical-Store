import { useEffect, useState } from 'react'
import { deliveryEstimate } from '../data/hours.js'
import Icon from './Icon.jsx'
import './DeliveryCountdown.css'

/**
 * Transparent Delivery Estimates:
 * Shows a dynamic delivery countdown timer:
 * "Order in the next 42 mins for delivery by 1:30 PM today"
 * Prevents hydration mismatch by rendering default or placeholder until client mount.
 */
export default function DeliveryCountdown({ className = '', compact = false }) {
  const [estimate, setEstimate] = useState(null)

  useEffect(() => {
    const update = () => setEstimate(deliveryEstimate())
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [])

  if (!estimate) {
    return (
      <span className={`delivery-countdown is-pending ${className}`} aria-live="polite">
        <Icon name="delivery" size={15} className="delivery-countdown__icon" />
        <span>Calculating delivery schedule…</span>
      </span>
    )
  }

  return (
    <span
      className={`delivery-countdown ${estimate.available ? 'is-active' : 'is-scheduled'} ${compact ? 'delivery-countdown--compact' : ''} ${className}`}
      aria-live="polite"
      title={estimate.text}
    >
      <Icon name="delivery" size={15} className="delivery-countdown__icon" />
      <span className="delivery-countdown__text">
        {estimate.available ? (
          <>
            Order in next <strong>{estimate.minutesRemaining}m</strong> for delivery by <strong>{estimate.deliveryTimeStr}</strong> today
          </>
        ) : (
          <span>{estimate.text}</span>
        )}
      </span>
    </span>
  )
}
