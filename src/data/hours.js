import { STORE, formatTime } from './store.js'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Weekday and minutes-since-midnight in the store's own time zone. */
function storeClock(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: STORE.timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).map((p) => [p.type, p.value]),
  )
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday)
  return { day, minutes: Number(parts.hour) * 60 + Number(parts.minute) }
}

const slotFor = (day) => STORE.hours.find((h) => h.days.includes(day))

/**
 * Open/closed status computed in the store's time zone (not the visitor's).
 * @returns {{ open: boolean, text: string }}
 */
export function openStatus(date = new Date()) {
  const { day, minutes } = storeClock(date)
  const today = slotFor(day)
  if (today && minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
    return { open: true, text: `Open now · closes ${formatTime(today.close)}` }
  }
  if (today && minutes < toMinutes(today.open)) {
    return { open: false, text: `Closed · opens today ${formatTime(today.open)}` }
  }
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7
    const slot = slotFor(d)
    if (slot) {
      const when = i === 1 ? 'tomorrow' : DAY_NAMES[d]
      return { open: false, text: `Closed · opens ${when} ${formatTime(slot.open)}` }
    }
  }
  return { open: false, text: 'Closed' }
}

/**
 * Transparent Delivery Estimate:
 * Computes next delivery departure/arrival window.
 * E.g., "Order in the next 38 mins for delivery by 1:30 PM today"
 * If store is closed or near closing, reports next opening delivery window.
 */
export function deliveryEstimate(date = new Date()) {
  const { day, minutes } = storeClock(date)
  const today = slotFor(day)

  if (today) {
    const openM = toMinutes(today.open)
    const closeM = toMinutes(today.close)
    const lastCutoff = closeM - 60 // 1 hour before store close is last same-day dispatch

    // Store is currently active and within delivery dispatch hours
    if (minutes >= openM && minutes < lastCutoff) {
      // Delivery intervals every 90 minutes starting 1 hour after open
      const firstBatch = openM + 60
      let nextBatchM = firstBatch
      while (nextBatchM <= minutes) {
        nextBatchM += 90
      }

      // Cutoff is 15 minutes before batch departure
      const cutoffM = nextBatchM - 15
      let minsRemaining = cutoffM - minutes
      let targetDeliveryM = nextBatchM + 45 // 45 min transit time

      if (minsRemaining <= 0) {
        nextBatchM += 90
        minsRemaining = (nextBatchM - 15) - minutes
        targetDeliveryM = nextBatchM + 45
      }

      const h = Math.floor(targetDeliveryM / 60) % 24
      const m = targetDeliveryM % 60
      const hhmmStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

      return {
        available: true,
        minutesRemaining: minsRemaining,
        deliveryTimeStr: formatTime(hhmmStr),
        isToday: true,
        text: `Order in next ${minsRemaining} mins for delivery by ${formatTime(hhmmStr)} today`,
      }
    }
  }

  // Next slot tomorrow or later
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7
    const slot = slotFor(d)
    if (slot) {
      const when = i === 1 ? 'tomorrow' : DAY_NAMES[d]
      const deliveryM = toMinutes(slot.open) + 90
      const h = Math.floor(deliveryM / 60) % 24
      const m = deliveryM % 60
      const hhmmStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      return {
        available: false,
        isToday: false,
        text: `Order now for delivery ${when} by ${formatTime(hhmmStr)}`,
      }
    }
  }

  return {
    available: false,
    isToday: false,
    text: 'Express delivery available on store opening',
  }
}
