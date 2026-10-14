import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import MobileActionBar from './components/MobileActionBar.jsx'
import ScrollManager from './components/ScrollManager.jsx'
import ParticleExperience from './particles/ParticleExperience.jsx'
import Home from './pages/Home.jsx'
import Products from './pages/Products.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import usePageMeta from './hooks/usePageMeta.js'
import Contact from './pages/Contact.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  const { pathname } = useLocation()
  usePageMeta()

  return (
    <>
      <ScrollManager />
      {/* One shared, persistent particle canvas behind every route. */}
      <ParticleExperience routeKey={pathname} />
      <div className="app">
        <Header />
        <main id="main" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <MobileActionBar />
        <CartDrawer />
      </div>
    </>
  )
}
