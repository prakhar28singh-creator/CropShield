import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, useLocation, Navigate, useRoutes } from 'react-router-dom'
import { useAuth, AuthProvider } from './auth'
import TopNavbar from './TopNav'
import { LanguageProvider, LocalizedContent, translateText, useLanguage } from './i18n'

const FarmerHome = lazy(() => import('./pages/FarmerHome'))
const Home = lazy(() => import('./pages/Home'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const CropRegistration = lazy(() => import('./pages/CropRegistration'))
const BatchList = lazy(() => import('./pages/BatchList'))
const AssessmentResult = lazy(() => import('./pages/AssessmentResult'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MandiFinder = lazy(() => import('./pages/MandiFinder'))

const PAGE_META = {
  '/': { title: 'CropShield', sub: 'Smart post-harvest loss prevention and price protection for crops' },
  '/finder': { title: 'Mandi Price Finder', sub: 'No login required � search mandi prices instantly' },
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

function AppShell() {
  const { farmer } = useAuth()
  const routes = useRoutes([
    { path: '/', element: farmer ? <FarmerHome /> : <Home /> },
    { path: '/finder', element: <MandiFinder /> },
    { path: '/about', element: <AboutPage /> },
    { path: '/auth', element: <AuthPage /> },
    { path: '/register', element: <RequireFarmer><CropRegistration /></RequireFarmer> },
    { path: '/batches', element: <RequireFarmer><BatchList /></RequireFarmer> },
    { path: '/batches/:id/result', element: <RequireFarmer><AssessmentResult /></RequireFarmer> },
    { path: '/market', element: <RequireFarmer><Dashboard /></RequireFarmer> },
    { path: '*', element: <Navigate to="/" replace /> },
  ])
  return (
    <div className="app-top">
      <TopNavbar />
      <main className="page-canvas top">
        <Suspense fallback={<LocalizedContent><div className="page-body loading-center"><span>Loading page…</span></div></LocalizedContent>}>
          {routes}
        </Suspense>
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
