import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db.js'
import { brl, dataHora } from '../../lib/format.js'
import PageHeader from '../../components/PageHeader.jsx'

export default function OrderViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const pedido = useLiveQuery(() => db.orders.get(id), [id])
  const itens = useLiveQuery(
    () => db.orderItems.where('orderId').equals(id).filter((i) => !i.deleted).toArray(),
    [id],
  )

  if (pedido === undefined) return null
  if (!pedido || pedido.deleted || pedido.status !== 'aberto') {
    return (
      <div className="stack">
        <PageHeader title="Comanda" />
        <div className="card">Comanda indisponível.</div>
      </div>
    )
  }

  const lista = itens ?? []

  return (
    <div className="stack">
      <PageHeader title={rotulo(pedido)} subtitle={`Aberta em ${dataHora(pedido.createdAt)}`} />

      {pedido.tipo === 'delivery' && (
        <div className="card stack">
          <div className="row-between">
            <strong>🛵 Entrega</strong>
            <span className="badge">Delivery</span>
          </div>
          <div>{pedido.clienteNome}</div>
          {pedido.clienteTelefone && <div className="muted">📞 {pedido.clienteTelefone}</div>}
          <div className="muted">📍 {pedido.endereco}</div>
        </div>
      )}

      <div className="card stack">
        {lista.map((item) => (
          <div key={item.id} className="stack" style={{ gap: 4 }}>
            <div className="row-between">
              <span>
                <strong>{item.quantidade}×</strong> {item.nome}
              </span>
              <span className="amount">{brl(item.preco * item.quantidade)}</span>
            </div>
            {item.observacao && <span className="muted">↳ {item.observacao}</span>}
          </div>
        ))}
        {lista.length === 0 && <p className="muted">Nenhum item.</p>}

        {pedido.observacao && <p className="muted">Obs.: {pedido.observacao}</p>}

        <div className="totais">
          <div className="row-between muted">
            <span>Subtotal</span>
            <span className="amount">{brl(pedido.subtotal)}</span>
          </div>
          {!!pedido.desconto && (
            <div className="row-between muted">
              <span>Desconto</span>
              <span className="amount">− {brl(pedido.desconto)}</span>
            </div>
          )}
          {pedido.tipo === 'delivery' && (
            <div className="row-between muted">
              <span>Entrega</span>
              <span className="amount">{brl(pedido.taxaEntrega)}</span>
            </div>
          )}
          <div className="row-between total-line">
            <strong>Total</strong>
            <strong className="amount">{brl(pedido.total)}</strong>
          </div>
        </div>
      </div>

      <div className="stack">
        <button className="btn btn-secondary btn-block" onClick={() => navigate(`/pedido/ordem/${id}`)}>
          Editar comanda
        </button>
        <button className="btn btn-block" onClick={() => navigate(`/pagamento/${id}`)}>
          Receber e fechar
        </button>
      </div>
    </div>
  )
}

function rotulo(pedido) {
  if (pedido.tipo === 'mesa') {
    return `${pedido.mesaNome || `Mesa ${pedido.mesaNumero}`}${pedido.clienteNome ? ` · ${pedido.clienteNome}` : ''}`
  }
  if (pedido.tipo === 'delivery') return `Delivery${pedido.clienteNome ? ` · ${pedido.clienteNome}` : ''}`
  return `Balcão${pedido.clienteNome ? ` · ${pedido.clienteNome}` : ''}`
}
