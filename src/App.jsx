import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './contexts/ToastContext'

// Lazy loading: cada página vira um chunk separado carregado sob demanda.
// jspdf (~1.4 MiB) só será carregado quando o usuário acessar /relatorios.
const Painel      = lazy(() => import('./pages/Painel'))
const Socios      = lazy(() => import('./pages/Socios'))
const NovoSocio   = lazy(() => import('./pages/NovoSocio'))
const Relatorios  = lazy(() => import('./pages/Relatorios'))
const SocioDetalhe = lazy(() => import('./pages/SocioDetalhe'))
const Pagamentos  = lazy(() => import('./pages/Pagamentos'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Carregando...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"            element={<Painel />} />
            <Route path="/socios"      element={<Socios />} />
            <Route path="/socios/novo" element={<NovoSocio />} />
            <Route path="/socios/:id"  element={<SocioDetalhe />} />
            <Route path="/relatorios"  element={<Relatorios />} />
            <Route path="/pagamentos"  element={<Pagamentos />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  )
}
