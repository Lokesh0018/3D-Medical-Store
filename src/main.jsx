import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/inter'
import '@fontsource-variable/manrope'
import { CartProvider } from './context/CartContext.jsx'
import App from './App.jsx'
import './index.css'

const app = (
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </StrictMode>
)

const container = document.getElementById('root')
// Hydrate only when the pre-rendered markup belongs to this exact URL. A host
// SPA fallback (unknown path, or a ?query) serves another page's HTML, so
// render fresh there instead of hydrating mismatched markup.
const prerendered = container.dataset.prerendered
if (prerendered && prerendered === window.location.pathname && !window.location.search) {
  hydrateRoot(container, app)
} else {
  container.textContent = ''
  createRoot(container).render(app)
}
