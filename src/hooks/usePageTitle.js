import { useEffect } from 'react'
import { STORE } from '../data/store.js'

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${STORE.name}` : `${STORE.name} — Genuine Medicines & Home Delivery`
  }, [title])
}
