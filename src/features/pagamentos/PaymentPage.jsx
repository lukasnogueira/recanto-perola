import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db.js'
import * as pagamentos from '../../data/pagamentos.js'
import { METODOS, rotuloMetodo } from './metodos.js'
import { brl } from '../../lib/format.js'
import PageHeader from '../../components/PageHeader.jsx'

const arred = (n) => Math.round(n * 100) / 100

export default function PaymentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const pedido = useLiveQuery(() => db.orders.get(id), [id])
  const pagamentosLista =
    useLiveQuery(
      () => db.payments.where('orderId').equals(id).filter((p) => !p.deleted).toArray(),
      [id],
    ) ?? []
  const [metodo, setMetodo] = useState('dinheiro')
  const [valor, setValor] = useState('')

  if (pedido === undefined) return null
  if (!pedido || pedido.deleted) {
    return (
      <div className="stack">
        <PageHeader title="Pagamento" />
        <div className="card">Pedido não encontrado.</div>
      </div>
    )
  }
  if (pedido.status !== 'aberto') {
    return (
      <div className="stack">
        <PageHeader title="Pagamento" />
        <div className="card stack">
          <span>Este pedido já foi finalizado.</span>
          <button className="btn" onClick={() => navigate(`/recibo/${id}`)}>
            Ver comprovante
          </button>
        </div>
      </div>
    )
  }

  const totalPago = arred(pagamentosLista.reduce((s, p) => s + p.valor, 0))
  const restante = arred(Math.max(0, pedido.total - totalPago))
  const troco = arred(Math.max(0, totalPago - pedido.total))
  const quitado = totalPago >= pedido.total - 0.001

  async function adicionar() {
    const digitado = Number(String(valor).replace(',', '.')) || 0
    const valorFinal = arred(digitado > 0 ? digitado : restante)
    if (valorFinal <= 0) return
    await pagamentos.registrarPagamento(id, { metodo, valor: valorFinal })
    setValor('')
  }

  async function confirmar() {
    await pagamentos.fecharPedido(id)
    navigate(`/recibo/${id}`, { replace: true })
  }

  return (
    <div className="stack">
      <PageHeader title="Pagamento" subtitle="Receber e fechar o pedido" />

      <div className="card row-between">
        <span className="muted">Total a pagar</span>
        <strong className="amount" style={{ fontSize: '1.4rem' }}>
          {brl(pedido.total)}
        </strong>
      </div>

      <div className="metodos">
        {METODOS.map((m) => (
          <button
            key={m.id}
            className={`metodo${metodo === m.id ? ' active' : ''}`}
            onClick={() => setMetodo(m.id)}
          >
            <span aria-hidden="true">{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>

      {pagamentosLista.length > 0 && (
        <div className="card stack">
          {pagamentosLista.map((p) => (
            <div className="row-between" key={p.id}>
              <span>
                {rotuloMetodo(p.metodo)} <span className="muted">· {brl(p.valor)}</span>
              </span>
              <button className="btn btn-sm btn-ghost" onClick={() => pagamentos.removerPagamento(p.id)}>
                🗑
              </button>
            </div>
          ))}
          <div className="row-between total-line">
            <strong>Recebido</strong>
            <strong className="amount">{brl(totalPago)}</strong>
          </div>
          <div className="row-between">
            <span className="muted">{quitado ? 'Troco' : 'Falta'}</span>
            <strong className="amount">{brl(quitado ? troco : restante)}</strong>
          </div>
        </div>
      )}

      <div className="card stack">
        <label className="field">
          <span className="field-label">Valor ({rotuloMetodo(metodo)})</span>
          <input
            className="input"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={restante > 0 ? `Falta ${brl(restante)}` : '0,00'}
          />
        </label>
        <button className="btn btn-secondary btn-block" onClick={adicionar}>
          Adicionar pagamento
        </button>
      </div>

      <button className="btn btn-block" onClick={confirmar} disabled={!quitado || totalPago <= 0}>
        {quitado ? 'Confirmar e fechar' : `Faltam ${brl(restante)}`}
      </button>
    </div>
  )
}
