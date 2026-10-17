import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { BrowserRouter, useLocation, Navigate, useRoutes } from 'react-router-dom'
import { useAuth, AuthProvider } from './auth'
import TopNavbar from './TopNav'
import { LanguageProvider, LocalizedContent, translateText, useLanguage } from './i18n'

const FarmerHome = lazy(() => import('./pages/FarmerHome'))
const Home = lazy(() => import('./pages/Home'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const CropRegistration = lazy(() => import('./pages/CropRegistration'))
const BatchList = lazy(() => import('./pages/BatchList'))
const AssessmentResult = lazy(() => import('./pages/AssessmentResult'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MandiFinder = lazy(() => import('./pages/MandiFinder'))

const PAGE_META = {
  '/': { title: 'CropShield', sub: 'Smart post-harvest loss prevention and price protection for crops' },
  '/finder': { title: 'Mandi Price Finder', sub: 'No login required � search mandi prices instantly' },
  '/how-it-works': { title: 'How CropShield Works', sub: 'Workflow and application architecture' },
  '/contact': { title: 'Contact CropShield', sub: 'Get in touch with the CropShield team' },
  '/register': { title: 'Protect My Crops', sub: 'Register your harvest and get a spoilage risk assessment' },
  '/batches': { title: 'Crop Batches', sub: 'All registered harvest batches' },
  '/market': { title: 'Dashboard', sub: 'Post-harvest monitoring & market overview' },
  '/batches/:id/result': { title: 'Assessment Report', sub: 'Risk, market comparison and recommendation' },
}

function RequireFarmer({ children }) {
  const { farmer, ready } = useAuth()
  if (!ready) return <LocalizedContent><div className="page-body loading-center"><div className="spinner"></div><span>Checking login…</span></div></LocalizedContent>
  if (!farmer) return (<Navigate to="/auth" replace />)
  return <>{children}</>
}

function TitleSetter() {
  const loc = useLocation()
  const { language } = useLanguage()
  const key = /^\/batches\/[^/]+\/result$/.test(loc.pathname)
    ? '/batches/:id/result'
    : loc.pathname
  const meta = PAGE_META[key] || { title: 'CropShield' }
  const docTitle = translateText(meta.title, language)

  useEffect(() => {
    document.title = docTitle
  }, [loc.pathname, docTitle])

  return null
}

function PageMotion({ children }) {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let sequence = 0
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' })
    const targets = new Set()
    const selectors = [
      '.landing-hero-text', '.landing-hero-img', '.landing-section',
      '.landing-aside', '.landing-honest', '.landing-cta-block',
      '.landing-benefit', '.landing-crops-heading', '.landing-crop',
      '.landing-why-copy', '.landing-why-art', '.landing-step',
      '.landing-market-copy', '.landing-price-card', '.landing-produce-art',
      '.landing-final-cta', '.landing-reference-preview',
      '.farmer-welcome', '.farmer-actions-section', '.farmer-workflow',
      '.farmer-action-card', '.farmer-workflow-step',
      '.about-hero', '.about-card', '.about-stack-item',
      '.how-hero', '.how-flow-card', '.how-public-photo', '.how-public-copy',
      '.how-architecture-section', '.how-honesty-note',
      '.contact-hero', '.contact-card', '.contact-form-card',
      '.auth-side', '.auth-card', '.reg-head', '.reg-card', '.stepper',
      '.card', '.kpi-card', '.insight', '.dash-split > *',
    ].join(',')

    const observeTargets = node => {
      if (!(node instanceof Element)) return
      const matches = []
      if (node.matches(selectors)) matches.push(node)
      matches.push(...node.querySelectorAll(selectors))
      matches.forEach(target => {
        if (targets.has(target)) return
        targets.add(target)
        target.style.setProperty('--motion-delay', `${Math.min(sequence++, 6) * 55}ms`)
        target.classList.add('motion-item')
        observer.observe(target)
      })
    }

    observeTargets(root)
    const mutations = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(observeTargets))
    })
    mutations.observe(root, { childList: true, subtree: true })

    return () => {
      mutations.disconnect()
      observer.disconnect()
      targets.forEach(target => {
        target.classList.remove('motion-item', 'is-visible')
        target.style.removeProperty('--motion-delay')
      })
    }
  }, [])

  return <div className="page-motion" ref={rootRef}>{children}</div>
}

function AppShell() {
  const { farmer } = useAuth()
  const location = useLocation()
  const isPublicHome = location.pathname === '/' && !farmer

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname])

  const routes = useRoutes([
    { path: '/', element: farmer ? <FarmerHome /> : <Home /> },
    { path: '/finder', element: <MandiFinder /> },
    { path: '/about', element: <AboutPage /> },
    { path: '/how-it-works', element: <HowItWorksPage /> },
    { path: '/contact', element: <ContactPage /> },
    { path: '/auth', element: <AuthPage /> },
    { path: '/register', element: <RequireFarmer><CropRegistration /></RequireFarmer> },
    { path: '/batches', element: <RequireFarmer><BatchList /></RequireFarmer> },
    { path: '/batches/:id/result', element: <RequireFarmer><AssessmentResult /></RequireFarmer> },
    { path: '/market', element: <RequireFarmer><Dashboard /></RequireFarmer> },
    { path: '*', element: <Navigate to="/" replace /> },
  ])
  return (
    <div className={`app-top${isPublicHome ? ' app-top-home' : ''}`}>
      <TopNavbar />
      <main className="page-canvas top">
        <PageMotion key={location.pathname}>
        <Suspense fallback={<LocalizedContent><div className="page-body loading-center"><span>Loading page…</span></div></LocalizedContent>}>
          {routes}
        </Suspense>
        </PageMotion>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <TitleSetter />
          <AppShell />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
