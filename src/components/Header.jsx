import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { STORE } from '../data/store.js'
import Icon from './Icon.jsx'
import './Header.css'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Products' },
  { to: '/#services', label: 'Services', hash: true },
  { to: '/contact', label: 'Contact' },
]

export default function Header() {
  const { count, setOpen } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 24))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  return (
    <header className={`site-header${scrolled || menuOpen ? ' is-solid' : ''}`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="site-header__inner container">
        <Link to="/" className="brand" onClick={close} aria-label={`${STORE.name} home`}>
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
                {item.hash ? (
                  <Link to={item.to} onClick={close}>{item.label}</Link>
                ) : (
                  <NavLink to={item.to} end={item.end} onClick={close}>{item.label}</NavLink>
                )}
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
  )
}
