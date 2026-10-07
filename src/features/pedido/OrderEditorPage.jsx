import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db.js'
import * as pedidos from '../../data/pedidos.js'
import { linhasDoPedidoDe } from '../../data/itens.js'
import { brl } from '../../lib/format.js'
import Modal from '../../components/Modal.jsx'
import PageHeader from '../../components/PageHeader.jsx'

export default function OrderEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const pedido = useLiveQuery(() => db.orders.get(id), [id])
  const itens = useLiveQuery(
    () => db.orderItems.where('orderId').equals(id).filter((i) => !i.deleted).toArray(),
    [id],
  )
  const categorias = useLiveQuery(
    () => db.categories.filter((c) => !c.deleted && c.ativo).sortBy('ordem'),
    [],
  )
  const produtos = useLiveQuery(() => db.products.filter((p) => !p.deleted && p.ativo).toArray(), [])

  const [catAtiva, setCatAtiva] = useState(null)
  const [busca, setBusca] = useState('')
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)

  if (pedido === undefined) return null
  if (!pedido || pedido.deleted) {
    return (
      <div className="stack">
        <PageHeader title="Comanda" />
        <div className="card">Esta comanda não está mais aberta.</div>
      </div>
    )
  }

  const listaCats = categorias ?? []
  const listaProds = produtos ?? []
  const linhas = linhasDoPedidoDe(itens ?? [])
  const categoriaAtual = catAtiva ?? listaCats[0]?.id
  const termo = busca.trim().toLowerCase()
  const produtosVisiveis = listaProds.filter((p) => {
    if (termo) return p.nome.toLowerCase().includes(termo)
    return p.categoryId === categoriaAtual
  })

  function adicionar(produto) {
    pedidos.adicionarItem(id, produto)
  }

  return (
    <div className="stack">
      <PageHeader
        title={tituloPedido(pedido)}
        subtitle={subtituloPedido(pedido)}
        action={
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              if (confirm('Cancelar e excluir esta comanda?')) {
                pedidos.cancelarPedido(id)
                navigate('/')
              }
            }}
            aria-label="Cancelar comanda"
          >
            🗑
          </button>
        }
      />

      <input
        className="input"
        placeholder="🔎 Buscar produto…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {!termo && (
        <div className="chips">
          {listaCats.map((c) => (
            <button
              key={c.id}
              className={`chip${categoriaAtual === c.id ? ' active' : ''}`}
              onClick={() => setCatAtiva(c.id)}
            >
              {c.nome}
            </button>
          ))}
        </div>
      )}

      <div className="produto-grid">
        {produtosVisiveis.map((p) => {
          const qtd = linhas
            .filter((l) => l.productId === p.id)
            .reduce((s, l) => s + l.quantidade, 0)
          return (
            <button key={p.id} className="produto-card" onClick={() => adicionar(p)}>
              {qtd > 0 && <span className="produto-qtd">{qtd}</span>}
              <span className="produto-nome">{p.nome}</span>
              <span className="amount">{brl(p.preco)}</span>
            </button>
          )
        })}
        {produtosVisiveis.length === 0 && <p className="muted">Nenhum produto encontrado.</p>}
      </div>

      <div className="cart-bar">
        <div className="grow">
          <div className="muted">{pedido.itemsCount || 0} item(ns)</div>
          <strong className="amount">{brl(pedido.total)}</strong>
        </div>
        <button className="btn" onClick={() => setCarrinhoAberto(true)} disabled={!linhas.length}>
          Ver pedido
        </button>
      </div>

      <Modal
        open={carrinhoAberto}
        title="Pedido"
        onClose={() => setCarrinhoAberto(false)}
        footer={
          <button
            className="btn btn-block"
            onClick={() => {
              setCarrinhoAberto(false)
              navigate(`/ordem/${id}`)
            }}
          >
            Revisar e fechar
          </button>
        }
      >
        <div className="stack">
          {pedido.tipo === 'mesa' && (
            <label className="field">
              <span className="field-label">Cliente / comanda</span>
              <input
                className="input"
                value={pedido.clienteNome || ''}
                onChange={(e) => pedidos.atualizarPedido(id, { clienteNome: e.target.value })}
                placeholder="Nome do cliente"
              />
            </label>
          )}

          <div className="stack">
            {linhas.map((linha) => (
              <div className="cart-item" key={linha.id}>
                <div className="row-between">
                  <strong className="grow">{linha.nome}</strong>
                  <span className="amount">{brl(linha.subtotal)}</span>
                </div>
                <div className="row-between">
                  <ItemObservacao linha={linha} />
                  <div className="stepper">
                    <button onClick={() => pedidos.alterarQuantidade(linha.id, -1)} aria-label="Diminuir">
                      −
                    </button>
                    <span>{linha.quantidade}</span>
                    <button onClick={() => pedidos.alterarQuantidade(linha.id, 1)} aria-label="Aumentar">
                      +
                    </button>
                  </div>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => pedidos.removerItem(linha.id)}
                    aria-label="Remover item"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
            {linhas.length === 0 && <p className="muted">Nenhum item no pedido.</p>}
          </div>

          <label className="field">
            <span className="field-label">Observação geral</span>
            <textarea
              className="textarea"
              value={pedido.observacao || ''}
              onChange={(e) => pedidos.atualizarPedido(id, { observacao: e.target.value })}
              placeholder="Ex.: servir tudo junto"
            />
          </label>

          <div className="row">
            <label className="field grow">
              <span className="field-label">Desconto (R$)</span>
              <input
                className="input"
                inputMode="decimal"
                value={pedido.desconto || ''}
                onChange={(e) =>
                  pedidos.atualizarPedido(id, {
                    desconto: Number(String(e.target.value).replace(',', '.')) || 0,
                  })
                }
                placeholder="0,00"
              />
            </label>
            {pedido.tipo === 'delivery' && (
              <label className="field grow">
                <span className="field-label">Taxa de entrega (R$)</span>
                <input
                  className="input"
                  inputMode="decimal"
                  value={pedido.taxaEntrega || ''}
                  onChange={(e) =>
                    pedidos.atualizarPedido(id, {
                      taxaEntrega: Number(String(e.target.value).replace(',', '.')) || 0,
                    })
                  }
                  placeholder="0,00"
                />
              </label>
            )}
          </div>

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
      </Modal>
    </div>
  )
}

function ItemObservacao({ linha }) {
  const [valor, setValor] = useState(linha.observacao || '')

  useEffect(() => {
    setValor(linha.observacao || '')
  }, [linha.id, linha.observacao])

  return (
    <input
      className="input input-obs"
      placeholder="Observação (ex.: sem cebola)"
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      onBlur={() => {
        if (valor !== (linha.observacao || '')) pedidos.alterarObservacao(linha.id, valor)
      }}
    />
  )
}

function tituloPedido(pedido) {
  if (pedido.tipo === 'mesa') {
    const nome = pedido.clienteNome ? ` · ${pedido.clienteNome}` : ''
    return `${pedido.mesaNome || `Mesa ${pedido.mesaNumero}`}${nome}`
  }
  if (pedido.tipo === 'delivery') return `Delivery${pedido.clienteNome ? ` · ${pedido.clienteNome}` : ''}`
  return `Balcão${pedido.clienteNome ? ` · ${pedido.clienteNome}` : ''}`
}

function subtituloPedido(pedido) {
  if (pedido.tipo === 'delivery') return pedido.endereco || 'Entrega'
  if (pedido.tipo === 'mesa') return pedido.mesaNome || 'Salão'
  return 'Venda no balcão'
}
