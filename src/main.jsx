import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './features/auth/AuthProvider.jsx'
import { seedDefaults } from './data/seed.js'
import { deduplicarCatalogo } from './data/catalogo.js'
import './theme/global.css'

async function iniciar() {
  try {
    await seedDefaults()
    await deduplicarCatalogo()
  } catch (erro) {
    console.error('Falha ao preparar dados iniciais:', erro)
  }

  // Quando publicado em subpasta (ex.: GitHub Pages /recanto-perola/),
  // o roteador precisa do basename. No dev/raiz fica sem basename.
  const base = import.meta.env.BASE_URL
  const basename = base && base !== '/' ? base.replace(/\/$/, '') : undefined

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter basename={basename}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  )
}

iniciar()
