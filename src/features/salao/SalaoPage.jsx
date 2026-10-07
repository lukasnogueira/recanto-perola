import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db.js'
import * as pedidos from '../../data/pedidos.js'
import { brl } from '../../lib/format.js'
import Modal from '../../components/Modal.jsx'
import PageHeader from '../../components/PageHeader.jsx'

export default function SalaoPage() {
  const navigate = useNavigate()
  const mesas = useLiveQuery(() => db.mesas.filter((m) => !m.deleted && m.ativo).sortBy('numero'), [])
  const abertos = useLiveQuery(() => pedidos.pedidosAbertos(), [])
  const [mesaSelecionada, setMesaSelecionada] = useState(null)
  const [cliente, setCliente] = useState('')

  const lista = mesas ?? []
  const porMesa = new Map((abertos ?? []).filter((o) => o.tipo === 'mesa').map((o) => [o.tableId, o]))

  function abrirMesa(mesa) {
    const comanda = porMesa.get(mesa.id)
    if (comanda) return navigate(`/pedido/ordem/${comanda.id}`)
    setCliente('')
    setMesaSelecionada(mesa)
  }

  async function confirmarAbertura(e) {
    e.preventDefault()
    const comanda = await pedidos.abrirComandaMesa({
      tableId: mesaSelecionada.id,
      mesaNumero: mesaSelecionada.numero,
      mesaNome: mesaSelecionada.nome,
      clienteNome: cliente,
    })
    setMesaSelecionada(null)
    navigate(`/pedido/ordem/${comanda.id}`)
  }

  return (
    <div className="stack">
      <PageHeader title="Salão" subtitle="Toque numa mesa para abrir ou continuar a comanda" />

      <div className="mesa-grid">
        {lista.map((m) => {
          const comanda = porMesa.get(m.id)
          return (
            <button
              key={m.id}
              className={`mesa-card${comanda ? ' ocupada' : ''}`}
              onClick={() => abrirMesa(m)}
            >
              <span className="mesa-numero">#{m.numero}</span>
              <span className="mesa-nome">{m.nome}</span>
              {comanda ? (
                <>
                  <span className="mesa-cliente">{comanda.clienteNome || 'Sem nome'}</span>
                  <span className="amount">{brl(comanda.total)}</span>
                </>
              ) : (
                <span className="muted">Livre</span>
              )}
            </button>
          )
        })}
        {lista.length === 0 && <p className="muted">Nenhuma mesa cadastrada. Crie em Ajustes → Mesas.</p>}
      </div>

      <Modal
        open={!!mesaSelecionada}
        title={`Abrir ${mesaSelecionada?.nome ?? 'mesa'}`}
        onClose={() => setMesaSelecionada(null)}
        footer={
          <button className="btn btn-block" type="submit" form="form-abrir-mesa">
            Abrir comanda
          </button>
        }
      >
        {mesaSelecionada && (
          <form id="form-abrir-mesa" className="stack" onSubmit={confirmarAbertura}>
            <label className="field">
              <span className="field-label">Nome do cliente (opcional)</span>
              <input
                className="input"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Ex.: João"
                autoFocus
              />
            </label>
          </form>
        )}
      </Modal>
    </div>
  )
}
