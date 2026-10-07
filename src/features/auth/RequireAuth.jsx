import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider.jsx'

export default function RequireAuth({ children }) {
  const { operador, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="splash">
        <span className="brand-mark" aria-hidden="true">
          🦪
        </span>
      </div>
    )
  }

  if (!operador) return <Navigate to="/login" replace />
  return children
}
