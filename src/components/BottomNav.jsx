import { NavLink } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider.jsx'
import { pode } from '../features/auth/permissions.js'

const items = [
  { to: '/', label: 'Início', icon: '🏠', end: true },
  { to: '/salao', label: 'Salão', icon: '🍽️', recurso: 'salao' },
  { to: '/pedido', label: 'Pedido', icon: '🧾', recurso: 'pedidos' },
  { to: '/caixa', label: 'Caixa', icon: '💰', recurso: 'caixa' },
  { to: '/ajustes', label: 'Ajustes', icon: '⚙️', recurso: 'gerente' },
]

export default function BottomNav() {
  const { operador } = useAuth()
  const visiveis = items.filter((i) => {
    if (!i.recurso) return true
    if (i.recurso === 'gerente') return operador?.role === 'gerente'
    return pode(operador, i.recurso)
  })
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {visiveis.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon" aria-hidden="true">
            {item.icon}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
