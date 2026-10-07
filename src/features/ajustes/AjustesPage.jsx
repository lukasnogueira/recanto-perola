import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'
import { PERFIS } from '../auth/permissions.js'
import SyncCard from '../sync/SyncCard.jsx'

const itens = [
  { to: '/ajustes/produtos', emoji: '🍤', label: 'Produtos e categorias' },
  { to: '/ajustes/mesas', emoji: '🪑', label: 'Mesas' },
  { to: '/ajustes/operadores', emoji: '👤', label: 'Operadores e PIN' },
  { to: '/ajustes/restaurante', emoji: '🏪', label: 'Dados do restaurante' },
]

export default function AjustesPage() {
  const { operador, sair } = useAuth()

  if (operador?.role !== 'gerente') {
    return (
      <div className="stack">
        <h1 className="page-title">Ajustes</h1>
        <div className="card">Acesso restrito ao gerente.</div>
      </div>
    )
  }

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Ajustes</h1>
        <p className="page-subtitle">Cadastros e configuração do sistema</p>
      </div>

      <div className="card row">
        <span className="list-item-emoji" aria-hidden="true">
          {PERFIS[operador.role]?.emoji ?? '👤'}
        </span>
        <div className="grow">
          <strong>{operador.nome}</strong>
          <div className="muted">{PERFIS[operador.role]?.label ?? operador.role}</div>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={sair}>
          Sair
        </button>
      </div>

      <div className="list">
        {itens.map((item) => (
          <Link key={item.to} to={item.to} className="list-item">
            <span className="list-item-emoji" aria-hidden="true">
              {item.emoji}
            </span>
            <span className="grow">{item.label}</span>
            <span aria-hidden="true">›</span>
          </Link>
        ))}
      </div>

      <SyncCard />
    </div>
  )
}
