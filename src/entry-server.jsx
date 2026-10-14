import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { CartProvider } from './context/CartContext.jsx'
import App from './App.jsx'

/** Server render used by scripts/prerender.mjs at build time. */
export function render(url) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <CartProvider>
          <App />
        </CartProvider>
      </StaticRouter>
    </StrictMode>,
  )
}

export { metaFor, fullTitle, STATIC_ROUTES } from './seo/meta.js'
export { STORE } from './data/store.js'
