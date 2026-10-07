import { useNavigate } from 'react-router-dom'
import * as pedidos from '../../data/pedidos.js'
import PageHeader from '../../components/PageHeader.jsx'

export default function PedidoPage() {
  const navigate = useNavigate()

  async function novoBalcao() {
    const p = await pedidos.abrirPedidoBalcao()
    navigate(`/pedido/ordem/${p.id}`)
  }

  return (
    <div className="stack">
      <PageHeader title="Novo pedido" subtitle="Escolha o tipo de atendimento" />

      <div className="stack">
        <button className="origem-card" onClick={() => navigate('/salao')}>
          <span className="origem-emoji" aria-hidden="true">
            🍽️
          </span>
          <span className="grow">
            <strong>Mesa</strong>
            <span className="muted">Abrir ou continuar uma comanda do salão</span>
          </span>
          <span aria-hidden="true">›</span>
        </button>

        <button className="origem-card" onClick={novoBalcao}>
          <span className="origem-emoji" aria-hidden="true">
            🧾
          </span>
          <span className="grow">
            <strong>Balcão</strong>
            <span className="muted">Venda rápida no balcão</span>
          </span>
          <span aria-hidden="true">›</span>
        </button>

        <button className="origem-card" onClick={() => navigate('/pedido/delivery')}>
          <span className="origem-emoji" aria-hidden="true">
            🛵
          </span>
          <span className="grow">
            <strong>Delivery</strong>
            <span className="muted">Entrega com endereço e taxa</span>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  )
}
