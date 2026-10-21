import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db.js'
import * as pagamentos from '../../data/pagamentos.js'
import { sessaoAberta, abrirCaixa, resumoCaixa, fecharCaixa } from '../../data/caixa.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { METODOS, rotuloMetodo } from './metodos.js'
import { brl, dataHora } from '../../lib/format.js'
import PageHeader from '../../components/PageHeader.jsx'
import Modal from '../../components/Modal.jsx'

const arred = (n) => Math.round(n * 100) / 100

function mesmoDia(a, b) {
  if (!a || !b) return true
  const da = new Date(a)
  const db_ = new Date(b)
  return (
    da.getFullYear() === db_.getFullYear() &&
    da.getMonth() === db_.getMonth() &&
    da.getDate() === db_.getDate()
  )
}

export default function PaymentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { operador } = useAuth()
  const pedido = useLiveQuery(() => db.orders.get(id), [id])
  const sessaoCaixa = useLiveQuery(() => sessaoAberta(), [])
  const pagamentosLista =
    useLiveQuery(
      () => db.payments.where('orderId').equals(id).filter((p) => !p.deleted).toArray(),
      [id],
    ) ?? []
  const [metodo, setMetodo] = useState('dinheiro')
  const [valor, setValor] = useState('')
  const [valorAbertura, setValorAbertura] = useState('')
  const [abrindo, setAbrindo] = useState(false)
  const [avisoData, setAvisoData] = useState(false)

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

  if (sessaoCaixa === undefined) return null

  // Não permite fechar o pedido com o caixa fechado.
  if (!sessaoCaixa) {
    async function abrir() {
      setAbrindo(true)
      await abrirCaixa({ valorAbertura, operador })
      setAbrindo(false)
    }
    return (
      <div className="stack">
        <PageHeader title="Pagamento" subtitle="Caixa fechado" />

        <div className="card row-between">
          <span className="muted">Total a pagar</span>
          <strong className="amount" style={{ fontSize: '1.4rem' }}>
            {brl(pedido.total)}
          </strong>
        </div>

        <div className="card stack">
          <strong>🔒 Caixa fechado</strong>
          <p className="muted">É necessário abrir o caixa antes de concluir este pedido.</p>
          <label className="field">
            <span className="field-label">Valor inicial em dinheiro (R$)</span>
            <input
              className="input"
              inputMode="decimal"
              value={valorAbertura}
              onChange={(e) => setValorAbertura(e.target.value)}
              placeholder="0,00"
              autoFocus
            />
          </label>
          <button className="btn btn-block" onClick={abrir} disabled={abrindo}>
            {abrindo ? 'Abrindo…' : 'Abrir caixa e continuar'}
          </button>
          <button className="btn btn-ghost btn-block" onClick={() => navigate('/')}>
            Voltar
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

  const datasDiferentes = !mesmoDia(sessaoCaixa.openedAt, pedido.createdAt)

  async function finalizar() {
    await pagamentos.fecharPedido(id, { cashSessionId: sessaoCaixa.id })
    navigate(`/recibo/${id}`, { replace: true })
  }

  function confirmar() {
    if (!sessaoCaixa) return
    if (datasDiferentes) {
      setAvisoData(true)
      return
    }
    finalizar()
  }

  async function fecharCaixaAnterior() {
    const resumo = await resumoCaixa(sessaoCaixa.id)
    await fecharCaixa(sessaoCaixa.id, {
      valorContado: resumo.esperadoDinheiro,
      observacao: 'FECHAMENTO AUTOMATICO: CAIXA DE OUTRO DIA AO FINALIZAR PEDIDO',
    })
    setAvisoData(false)
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

      {datasDiferentes && (
        <div className="aviso-data card">
          <strong>⚠️ ATENÇÃO: O CAIXA FOI ABERTO EM OUTRA DATA.</strong>
          <span className="muted">
            Ao confirmar, você poderá fechar o caixa do dia anterior ou continuar mesmo assim.
          </span>
        </div>
      )}

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

      <Modal
        open={avisoData}
        title="⚠️ ATENÇÃO ⚠️"
        onClose={() => setAvisoData(false)}
        footer={
          <div className="stack">
            <button className="btn btn-danger btn-block" onClick={fecharCaixaAnterior}>
              ⚠️ FECHAR CAIXA DO DIA ANTERIOR
            </button>
            <button
              className="btn btn-secondary btn-block"
              onClick={() => {
                setAvisoData(false)
                finalizar()
              }}
            >
              CONTINUAR MESMO ASSIM
            </button>
          </div>
        }
      >
        <div className="aviso-data">
          <p>
            <strong>⚠️ O CAIXA FOI ABERTO EM UMA DATA DIFERENTE DA DATA DESTE PEDIDO.</strong>
          </p>
          <p>
            CAIXA ABERTO EM: <strong>{dataHora(sessaoCaixa.openedAt)}</strong>
          </p>
          <p>
            PEDIDO DE: <strong>{dataHora(pedido.createdAt)}</strong>
          </p>
          <p>DESEJA FECHAR O CAIXA DO DIA ANTERIOR OU CONTINUAR MESMO ASSIM?</p>
        </div>
      </Modal>
    </div>
  )
}
