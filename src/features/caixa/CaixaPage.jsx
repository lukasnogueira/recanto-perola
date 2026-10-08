import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import * as caixa from '../../data/caixa.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { brl, dataHora, apenasData, apenasHora } from '../../lib/format.js'
import { METODOS } from '../pagamentos/metodos.js'
import Modal from '../../components/Modal.jsx'
import PageHeader from '../../components/PageHeader.jsx'

export default function CaixaPage() {
  const { operador } = useAuth()
  const sessao = useLiveQuery(() => caixa.sessaoAberta(), [])
  const resumo = useLiveQuery(
    () => (sessao ? caixa.resumoCaixa(sessao.id) : null),
    [sessao?.id],
  )
  const historico = useLiveQuery(() => caixa.historicoCaixas(), [])

  const [valorAbertura, setValorAbertura] = useState('')
  const [modalMov, setModalMov] = useState(null)
  const [movValor, setMovValor] = useState('')
  const [movObs, setMovObs] = useState('')
  const [modalFechar, setModalFechar] = useState(false)
  const [valorContado, setValorContado] = useState('')
  const [obsFechar, setObsFechar] = useState('')

  if (sessao === undefined) return null

  if (!sessao) {
    return (
      <div className="stack">
        <PageHeader title="Caixa" subtitle="Nenhum caixa aberto" />

        <div className="card stack">
          <h2 className="section-title">Abrir caixa</h2>
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
          <button
            className="btn btn-block"
            onClick={() => caixa.abrirCaixa({ valorAbertura, operador })}
          >
            Abrir caixa
          </button>
        </div>

        <Historico lista={historico ?? []} />
      </div>
    )
  }

  const r = resumo
  const contado = Number(String(valorContado).replace(',', '.')) || 0
  const diferenca = Math.round((contado - (r?.esperadoDinheiro ?? 0)) * 100) / 100

  function abrirMov(tipo) {
    setModalMov(tipo)
    setMovValor('')
    setMovObs('')
  }

  async function salvarMovimento(e) {
    e.preventDefault()
    await caixa.registrarMovimento(sessao.id, {
      tipo: modalMov,
      valor: movValor,
      observacao: movObs,
    })
    setModalMov(null)
  }

  async function confirmarFechamento(e) {
    e.preventDefault()
    await caixa.fecharCaixa(sessao.id, { valorContado: contado, observacao: obsFechar })
    setModalFechar(false)
    setValorContado('')
    setObsFechar('')
  }

  return (
    <div className="stack">
      <PageHeader
        title="Caixa"
        subtitle={`Aberto ${dataHora(sessao.openedAt)}${sessao.operadorNome ? ` · ${sessao.operadorNome}` : ''}`}
      />

      <div className="caixa-destaque">
        <span className="muted">Dinheiro esperado na gaveta</span>
        <strong className="amount caixa-valor">{brl(r?.esperadoDinheiro ?? 0)}</strong>
        <span className="muted">Abertura {brl(sessao.valorAbertura)} · Troco {brl(r?.troco ?? 0)}</span>
      </div>

      <div className="tile-grid">
        <div className="card">
          <span className="muted">Vendas</span>
          <strong className="amount">{brl(r?.totalVendas ?? 0)}</strong>
          <span className="muted">{r?.qtdPedidos ?? 0} pedido(s)</span>
        </div>
        <div className="card">
          <span className="muted">Em dinheiro</span>
          <strong className="amount">{brl(r?.porMetodo?.dinheiro ?? 0)}</strong>
        </div>
        <div className="card">
          <span className="muted">Suprimentos</span>
          <strong className="amount">{brl(r?.suprimentos ?? 0)}</strong>
        </div>
        <div className="card">
          <span className="muted">Sangrias</span>
          <strong className="amount">{brl(r?.sangrias ?? 0)}</strong>
        </div>
      </div>

      <div className="card stack">
        <h2 className="section-title">Por forma de pagamento</h2>
        {METODOS.map((m) => (
          <div className="row-between" key={m.id}>
            <span className="muted">
              {m.emoji} {m.label}
            </span>
            <span className="amount">{brl(r?.porMetodo?.[m.id] ?? 0)}</span>
          </div>
        ))}
      </div>

      <div className="row">
        <button className="btn btn-secondary grow" onClick={() => abrirMov('suprimento')}>
          + Suprimento
        </button>
        <button className="btn btn-secondary grow" onClick={() => abrirMov('sangria')}>
          − Sangria
        </button>
      </div>

      <div className="card stack">
        <h2 className="section-title">Movimentos</h2>
        {(r?.movimentos ?? []).map((m) => (
          <div className="row-between" key={m.id}>
            <span>
              {m.tipo === 'sangria' ? '🔻 Sangria' : '🔺 Suprimento'}
              {m.observacao ? <span className="muted"> · {m.observacao}</span> : ''}
            </span>
            <span className="row">
              <span className="amount">{m.tipo === 'sangria' ? '− ' : '+ '}{brl(m.valor)}</span>
              <button className="btn btn-sm btn-ghost" onClick={() => caixa.removerMovimento(m.id)}>
                🗑
              </button>
            </span>
          </div>
        ))}
        {(r?.movimentos ?? []).length === 0 && <p className="muted">Nenhum movimento.</p>}
      </div>

      <button className="btn btn-block" onClick={() => setModalFechar(true)}>
        Fechar caixa
      </button>

      <Modal
        open={!!modalMov}
        title={modalMov === 'sangria' ? 'Sangria (retirada)' : 'Suprimento (entrada)'}
        onClose={() => setModalMov(null)}
        footer={
          <button className="btn btn-block" type="submit" form="form-movimento">
            Registrar
          </button>
        }
      >
        {modalMov && (
          <form id="form-movimento" className="stack" onSubmit={salvarMovimento}>
            <label className="field">
              <span className="field-label">Valor (R$)</span>
              <input
                className="input"
                inputMode="decimal"
                value={movValor}
                onChange={(e) => setMovValor(e.target.value)}
                placeholder="0,00"
                autoFocus
              />
            </label>
            <label className="field">
              <span className="field-label">Observação</span>
              <input
                className="input"
                value={movObs}
                onChange={(e) => setMovObs(e.target.value)}
                placeholder="Ex.: troco, pagamento de fornecedor"
              />
            </label>
          </form>
        )}
      </Modal>

      <Modal
        open={modalFechar}
        title="Fechar caixa"
        onClose={() => setModalFechar(false)}
        footer={
          <button className="btn btn-block" type="submit" form="form-fechar">
            Confirmar fechamento
          </button>
        }
      >
        <form id="form-fechar" className="stack" onSubmit={confirmarFechamento}>
          <div className="row-between">
            <span className="muted">Esperado em dinheiro</span>
            <span className="amount">{brl(r?.esperadoDinheiro ?? 0)}</span>
          </div>
          <label className="field">
            <span className="field-label">Valor contado (R$)</span>
            <input
              className="input"
              inputMode="decimal"
              value={valorContado}
              onChange={(e) => setValorContado(e.target.value)}
              placeholder="0,00"
              autoFocus
            />
          </label>
          <div className="row-between">
            <span className="muted">Diferença</span>
            <strong className={`amount ${diferenca < 0 ? 'negativo' : diferenca > 0 ? 'positivo' : ''}`}>
              {brl(diferenca)}
            </strong>
          </div>
          <label className="field">
            <span className="field-label">Observação</span>
            <textarea
              className="textarea"
              value={obsFechar}
              onChange={(e) => setObsFechar(e.target.value)}
              placeholder="Opcional"
            />
          </label>
        </form>
      </Modal>
    </div>
  )
}

function Historico({ lista }) {
  const porDia = new Map()
  for (const s of lista) {
    const d = new Date(s.closedAt)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`
    const sessoes = porDia.get(chave) || []
    sessoes.push(s)
    porDia.set(chave, sessoes)
  }
  const dias = [...porDia.entries()].sort((a, b) => b[0].localeCompare(a[0]))

  return (
    <div className="stack">
      <h2 className="section-title">Faturamento por dia</h2>
      {dias.map(([dia, sessoes]) => {
        const faturamento = sessoes.reduce((s, x) => s + (x.resumoFechamento?.totalVendas ?? 0), 0)
        const pedidos = sessoes.reduce((s, x) => s + (x.resumoFechamento?.qtdPedidos ?? 0), 0)
        const contado = sessoes.reduce((s, x) => s + (x.valorContado ?? 0), 0)
        const diferenca = sessoes.reduce((s, x) => s + (x.diferenca ?? 0), 0)
        return (
          <div className="card stack" key={dia}>
            <div className="row-between">
              <strong>{apenasData(sessoes[0].closedAt)}</strong>
              <span className={`badge ${Math.abs(diferenca) < 0.005 ? 'badge-success' : 'badge-danger'}`}>
                {Math.abs(diferenca) < 0.005 ? 'Sem diferença' : `Dif. ${brl(diferenca)}`}
              </span>
            </div>
            <div className="row-between">
              <span className="muted">Faturamento do dia</span>
              <strong className="amount" style={{ fontSize: '1.4rem' }}>
                {brl(faturamento)}
              </strong>
            </div>
            <div className="row-between muted">
              <span>
                {sessoes.length} fechamento(s) · {pedidos} pedido(s)
              </span>
              <span>Contado {brl(contado)}</span>
            </div>
            {sessoes.length > 1 && (
              <div className="stack">
                {sessoes.map((s) => (
                  <div className="row-between muted" key={s.id}>
                    <span>🕒 {apenasHora(s.closedAt)}</span>
                    <span className="amount">{brl(s.resumoFechamento?.totalVendas ?? 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
      {dias.length === 0 && <p className="muted">Nenhum caixa fechado ainda.</p>}
    </div>
  )
}
