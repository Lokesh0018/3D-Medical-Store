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
