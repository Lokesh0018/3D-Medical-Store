import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { STORE } from '../data/store.js'
import Icon from './Icon.jsx'
import './Header.css'

const NAV = [
  { targetId: 'hero', label: 'Home' },
  { targetId: 'about', label: 'About' },
  { targetId: 'products', label: 'Products' },
  { targetId: 'services', label: 'Services' },
  { targetId: 'contact', label: 'Contact' },
]

export default function Header() {
  const { count, setOpen } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [onLight, setOnLight] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // Track active section as user scrolls
  useEffect(() => {
    const handleObserver = () => {
      const ids = NAV.map((n) => n.targetId)
      for (const id of [...ids].reverse()) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 140) {
            setActiveSection(id)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleObserver, { passive: true })
    handleObserver()
    return () => window.removeEventListener('scroll', handleObserver)
  }, [])

  // Track scroll state and whether the header currently sits over a light
  // section, so it can switch to a light, high-contrast variant there.
  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24)
        const probe = 36 // ~ middle of the header bar
        setOnLight(Array.from(document.querySelectorAll('.section--light')).some((el) => {
          const r = el.getBoundingClientRect()
          return r.top <= probe && r.bottom >= probe
        }))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [pathname])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && menuOpen) setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  const scrollTo = (targetId) => {
    close()
    if (pathname !== '/') {
      navigate(`/#${targetId}`)
      return
    }
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      try {
        window.history.pushState(null, '', `#${targetId}`)
      } catch {
        /* ignore */
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      <header className={`site-header${scrolled || menuOpen ? ' is-solid' : ''}${onLight && !menuOpen ? ' is-light' : ''}`}>
        <a className="skip-link" href="#main">Skip to content</a>
        <div className="site-header__inner container">
          <Link
            to="/"
            className="brand"
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault()
                scrollTo('hero')
              } else {
                close()
              }
            }}
            aria-label={`${STORE.name} home`}
          >
            <span className="brand__mark"><Icon name="cross" size={18} strokeWidth={2} /></span>
            <span className="brand__name">{STORE.name}</span>
          </Link>

          <nav
            id="site-nav"
            className={`site-nav${menuOpen ? ' is-open' : ''}`}
            aria-label="Main"
          >
            <ul>
              {NAV.map((item) => (
                <li key={item.label}>
                  <a
                    href={`#${item.targetId}`}
                    className={activeSection === item.targetId ? 'active' : ''}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollTo(item.targetId)
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <a className="site-nav__call" href={STORE.phoneHref}>
              <Icon name="phone" size={16} /> {STORE.phoneDisplay}
            </a>
          </nav>

          <div className="site-header__actions">
            <button
              type="button"
              className="cart-button"
              onClick={() => setOpen(true)}
              aria-label={`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`}
            >
              <Icon name="cart" size={20} />
              {count > 0 && <span className="cart-button__badge" aria-hidden="true">{count}</span>}
            </button>
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="site-nav"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
