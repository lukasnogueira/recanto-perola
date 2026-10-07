import { Link } from 'react-router-dom'

const atalhos = [
  { to: '/salao', emoji: '🍽️', titulo: 'Mesa', desc: 'Abrir ou continuar comanda' },
  { to: '/pedido', emoji: '🧾', titulo: 'Balcão', desc: 'Pedido rápido no balcão' },
  { to: '/pedido/delivery', emoji: '🛵', titulo: 'Delivery', desc: 'Entrega com endereço' },
  { to: '/fechamento', emoji: '✅', titulo: 'Fechamento', desc: 'Comandas em aberto' },
  { to: '/caixa', emoji: '💰', titulo: 'Caixa', desc: 'Abrir, fechar e movimentos' },
  { to: '/relatorios', emoji: '📊', titulo: 'Relatórios', desc: 'Vendas do dia' },
  { to: '/ajustes', emoji: '⚙️', titulo: 'Ajustes', desc: 'Produtos, mesas, operadores' },
]

export default function DashboardPage() {
  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Início</h1>
        <p className="page-subtitle">Recanto Pérola — pedidos e caixa</p>
      </div>

      <div className="tile-grid">
        {atalhos.map((a) => (
          <Link key={a.to} to={a.to} className="tile">
            <span className="tile-emoji" aria-hidden="true">
              {a.emoji}
            </span>
            <span className="tile-title">{a.titulo}</span>
            <span className="tile-desc">{a.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
