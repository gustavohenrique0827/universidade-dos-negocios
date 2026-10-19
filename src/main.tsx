import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useLocation } from 'react-router-dom'
import App from './App.tsx'
import ErroTela from './components/ErroTela.tsx'
import { DialogProvider } from './components/Dialogs.tsx'
import { AuthProvider } from './lib/auth.tsx'
import './index.css'

/** Reseta o scroll para o topo a cada mudança de rota. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErroTela>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <DialogProvider>
            <App />
          </DialogProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErroTela>
  </StrictMode>,
)
