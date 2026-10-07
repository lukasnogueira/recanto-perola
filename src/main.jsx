import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './features/auth/AuthProvider.jsx'
import { seedDefaults } from './data/seed.js'
import './theme/global.css'

async function iniciar() {
  try {
    await seedDefaults()
  } catch (erro) {
    console.error('Falha ao preparar dados iniciais:', erro)
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  )
}

iniciar()
