import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import * as pedidos from '../../data/pedidos.js'
import { brl, dataHora } from '../../lib/format.js'
import PageHeader from '../../components/PageHeader.jsx'

export default function FechamentoPage() {
  const navigate = useNavigate()
  const abertos = useLiveQuery(() => pedidos.pedidosAbertos(), [])
  const lista = abertos ?? []
  const totalGeral = lista.reduce((s, o) => s + (o.total || 0), 0)

  return (
    <div className="stack">
      <PageHeader
        title="Fechamento"
        subtitle="Comandas em aberto"
        action={
          <button className="btn btn-sm" onClick={() => navigate('/pedido')}>
            + Pedido
          </button>
        }
      />

      <div className="card row-between">
        <span className="muted">{lista.length} comanda(s) aberta(s)</span>
        <strong className="amount">{brl(totalGeral)}</strong>
      </div>

      <div className="list">
        {lista.map((o) => (
          <button key={o.id} className="list-item comanda-item" onClick={() => navigate(`/ordem/${o.id}`)}>
            <span className={`tag tag-${o.tipo}`}>{tagTipo(o)}</span>
            <span className="grow" style={{ textAlign: 'left' }}>
              <strong>{titulo(o)}</strong>
              <span className="muted comanda-sub">
                {o.itemsCount || 0} item(ns) · {dataHora(o.createdAt)}
              </span>
            </span>
            <strong className="amount">{brl(o.total)}</strong>
          </button>
        ))}
        {lista.length === 0 && (
          <p className="muted">Nenhuma comanda em aberto. Bom descanso! 🎉</p>
        )}
      </div>
    </div>
  )
}

function tagTipo(o) {
  if (o.tipo === 'mesa') return '🪑'
  if (o.tipo === 'delivery') return '🛵'
  return '🧾'
}

function titulo(o) {
  if (o.tipo === 'mesa') {
    return `${o.mesaNome || `Mesa ${o.mesaNumero}`}${o.clienteNome ? ` · ${o.clienteNome}` : ''}`
  }
  if (o.tipo === 'delivery') return `Delivery${o.clienteNome ? ` · ${o.clienteNome}` : ''}`
  return `Balcão${o.clienteNome ? ` · ${o.clienteNome}` : ''}`
}
