import About from '../components/About'
import Apparatus from '../components/Apparatus'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import Header from '../components/Header'
import Hero from '../components/Hero'
import Pricing from '../components/Pricing'

export default function Home({ theme, onToggleTheme, toggleLabel }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header
        theme={theme}
        onToggleTheme={onToggleTheme}
        toggleLabel={toggleLabel}
      />
      <main>
        <Hero />
        <About />
        <Apparatus />
        <Pricing />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
