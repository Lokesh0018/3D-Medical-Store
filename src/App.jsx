import Home from './pages/Home.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import MobileActionBar from './components/MobileActionBar.jsx'
import ScrollManager from './components/ScrollManager.jsx'
import ParticleExperience from './particles/ParticleExperience.jsx'
import usePageMeta from './hooks/usePageMeta.js'

export default function App() {
  usePageMeta()

  return (
    <>
      <ScrollManager />
      {/* One shared, persistent particle canvas behind the page */}
      <ParticleExperience routeKey="/" />
      <div className="app">
        <Header />
        <main id="main" tabIndex={-1}>
          <Home />
        </main>
        <Footer />
        <MobileActionBar />
        <CartDrawer />
      </div>
    </>
  )
}
