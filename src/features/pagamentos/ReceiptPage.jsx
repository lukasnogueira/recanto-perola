import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db.js'
import { settingsRepo } from '../../data/repositories.js'
import { gerarReciboPDF, nomeArquivoRecibo } from '../../lib/recibo.js'
import { baixarBlob, compartilharArquivo } from '../../lib/compartilhar.js'
import { rotuloMetodo } from '../pagamentos/metodos.js'
import { brl, dataHora } from '../../lib/format.js'
import PageHeader from '../../components/PageHeader.jsx'

export default function ReceiptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const pedido = useLiveQuery(() => db.orders.get(id), [id])
  const itens =
    useLiveQuery(
      () => db.orderItems.where('orderId').equals(id).filter((i) => !i.deleted).toArray(),
      [id],
    ) ?? []
  const pagamentos =
    useLiveQuery(
      () => db.payments.where('orderId').equals(id).filter((p) => !p.deleted).toArray(),
      [id],
    ) ?? []
  const settings = useLiveQuery(() => settingsRepo.all(), []) ?? {}
  const [aviso, setAviso] = useState('')

  if (pedido === undefined) return null
  if (!pedido || pedido.deleted) {
    return (
      <div className="stack">
        <PageHeader title="Comprovante" />
        <div className="card">Pedido não encontrado.</div>
      </div>
    )
  }

  const restaurante = {
    nome: settings['restaurante.nome'] || 'Recanto Pérola',
    telefone: settings['restaurante.telefone'] || '',
    endereco: settings['restaurante.endereco'] || '',
  }
  const dados = { restaurante, pedido, itens, pagamentos }
  const totalPago = pagamentos.reduce((s, p) => s + p.valor, 0)
  const troco = Math.max(0, totalPago - pedido.total)

  async function compartilhar() {
    const blob = gerarReciboPDF(dados)
    const nome = nomeArquivoRecibo(pedido)
    const ok = await compartilharArquivo(blob, nome, {
      title: 'Comprovante Recanto Pérola',
      text: `Comprovante de ${restaurante.nome}`,
    })
    if (!ok) {
      baixarBlob(blob, nome)
      setAviso('Seu navegador não permite compartilhar arquivos; o PDF foi baixado.')
    }
  }

  function baixar() {
    const blob = gerarReciboPDF(dados)
    baixarBlob(blob, nomeArquivoRecibo(pedido))
  }

  return (
    <div className="stack">
      <PageHeader title="Comprovante" subtitle={dataHora(pedido.closedAt)} />

      <div className="recibo">
        <h2>{restaurante.nome}</h2>
        {restaurante.telefone && <p className="muted">{restaurante.telefone}</p>}
        {restaurante.endereco && <p className="muted">{restaurante.endereco}</p>}
        <p className="recibo-tipo">COMPROVANTE NÃO FISCAL</p>
        <hr />

        <p>
          <strong>{rotuloTipo(pedido.tipo)}</strong> — {tituloPedido(pedido)}
        </p>
        {pedido.tipo === 'delivery' && pedido.endereco && <p className="muted">📍 {pedido.endereco}</p>}
        <hr />

        {itens.map((item) => (
          <div key={item.id} className="recibo-linha">
            <span>
              {item.quantidade}× {item.nome}
              {item.observacao ? ` (${item.observacao})` : ''}
            </span>
            <span className="amount">{brl(item.preco * item.quantidade)}</span>
          </div>
        ))}
        <hr />

        <div className="recibo-linha">
          <span>Subtotal</span>
          <span className="amount">{brl(pedido.subtotal)}</span>
        </div>
        {!!pedido.desconto && (
          <div className="recibo-linha">
            <span>Desconto</span>
            <span className="amount">− {brl(pedido.desconto)}</span>
          </div>
        )}
        {pedido.tipo === 'delivery' && (
          <div className="recibo-linha">
            <span>Entrega</span>
            <span className="amount">{brl(pedido.taxaEntrega)}</span>
          </div>
        )}
        <div className="recibo-linha total">
          <span>TOTAL</span>
          <span className="amount">{brl(pedido.total)}</span>
        </div>
        <hr />

        {pagamentos.map((p) => (
          <div key={p.id} className="recibo-linha">
            <span>{rotuloMetodo(p.metodo)}</span>
            <span className="amount">{brl(p.valor)}</span>
          </div>
        ))}
        {troco > 0.001 && (
          <div className="recibo-linha total">
            <span>Troco</span>
            <span className="amount">{brl(troco)}</span>
          </div>
        )}

        <p className="recibo-rodape">Obrigado pela preferência!</p>
      </div>

      {aviso && <p className="muted">{aviso}</p>}

      <div className="stack">
        <button className="btn btn-block" onClick={compartilhar}>
          Compartilhar PDF
        </button>
        <button className="btn btn-secondary btn-block" onClick={baixar}>
          Baixar PDF
        </button>
        <button className="btn btn-ghost btn-block" onClick={() => navigate('/pedido')}>
          Novo pedido
        </button>
      </div>
    </div>
  )
}

function rotuloTipo(tipo) {
  return { mesa: 'Mesa', balcao: 'Balcão', delivery: 'Delivery' }[tipo] ?? tipo
}

function tituloPedido(pedido) {
  if (pedido.tipo === 'mesa') {
    return `${pedido.mesaNome || `Mesa ${pedido.mesaNumero}`}${pedido.clienteNome ? ` · ${pedido.clienteNome}` : ''}`
  }
  return pedido.clienteNome || '—'
}
