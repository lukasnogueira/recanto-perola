import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { resumoPeriodo, diaRange, hojeStr } from '../../data/relatorios.js'
import { settingsRepo } from '../../data/repositories.js'
import { gerarRelatorioPDF, nomeArquivoRelatorio } from '../../lib/relatorioPDF.js'
import { baixarBlob, compartilharArquivo } from '../../lib/compartilhar.js'
import { METODOS } from '../pagamentos/metodos.js'
import { brl } from '../../lib/format.js'
import PageHeader from '../../components/PageHeader.jsx'

export default function RelatoriosPage() {
  const [data, setData] = useState(hojeStr())
  const [inicio, fim] = diaRange(data)
  const resumo = useLiveQuery(() => resumoPeriodo(inicio, fim), [inicio, fim])
  const nomeRestaurante = useLiveQuery(
    () => settingsRepo.get('restaurante.nome', 'Recanto Pérola'),
    [],
  )
  const [aviso, setAviso] = useState('')

  const r = resumo

  async function compartilhar() {
    const blob = gerarRelatorioPDF({
      dataStr: data,
      resumo: r,
      restaurante: { nome: nomeRestaurante },
    })
    const nome = nomeArquivoRelatorio(data)
    const ok = await compartilharArquivo(blob, nome, {
      title: 'Relatório Recanto Pérola',
      text: `Relatório do dia ${data}`,
    })
    if (!ok) {
      baixarBlob(blob, nome)
      setAviso('Seu navegador não permite compartilhar arquivos; o PDF foi baixado.')
    }
  }

  function baixar() {
    const blob = gerarRelatorioPDF({
      dataStr: data,
      resumo: r,
      restaurante: { nome: nomeRestaurante },
    })
    baixarBlob(blob, nomeArquivoRelatorio(data))
  }

  return (
    <div className="stack">
      <PageHeader title="Relatórios" subtitle="Vendas por dia" />

      <label className="field">
        <span className="field-label">Dia</span>
        <input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </label>

      {!r ? null : (
        <>
          <div className="card stack">
            <span className="muted">Vendas do dia</span>
            <strong className="amount caixa-valor">{brl(r.totalVendas)}</strong>
            <span className="muted">
              {r.qtdPedidos} pedido(s) · {r.totalItens} item(ns) · ticket {brl(r.ticketMedio)}
            </span>
          </div>

          <div className="card stack">
            <h2 className="section-title">Formas de pagamento</h2>
            {METODOS.map((m) => (
              <div className="row-between" key={m.id}>
                <span className="muted">
                  {m.emoji} {m.label}
                </span>
                <span className="amount">{brl(r.porMetodo[m.id] ?? 0)}</span>
              </div>
            ))}
          </div>

          <div className="card stack">
            <h2 className="section-title">Tipo de atendimento</h2>
            <div className="row-between">
              <span className="muted">🍽️ Mesa</span>
              <span className="amount">{brl(r.porTipo.mesa)}</span>
            </div>
            <div className="row-between">
              <span className="muted">🧾 Balcão</span>
              <span className="amount">{brl(r.porTipo.balcao)}</span>
            </div>
            <div className="row-between">
              <span className="muted">🛵 Delivery</span>
              <span className="amount">{brl(r.porTipo.delivery)}</span>
            </div>
          </div>

          <div className="card stack">
            <h2 className="section-title">Produtos vendidos</h2>
            {r.porProduto.map((p) => (
              <div className="row-between" key={p.nome}>
                <span className="muted">
                  {p.quantidade}× {p.nome}
                </span>
                <span className="amount">{brl(p.total)}</span>
              </div>
            ))}
            {r.porProduto.length === 0 && <p className="muted">Nenhum produto vendido.</p>}
          </div>

          {aviso && <p className="muted">{aviso}</p>}

          <div className="row">
            <button className="btn grow" onClick={compartilhar}>
              Compartilhar PDF
            </button>
            <button className="btn btn-secondary grow" onClick={baixar}>
              Baixar PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}
