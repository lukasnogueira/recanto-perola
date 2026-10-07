import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as pedidos from '../../data/pedidos.js'
import { settingsRepo } from '../../data/repositories.js'
import PageHeader from '../../components/PageHeader.jsx'

export default function DeliveryFormPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    ;(async () => {
      const taxa = await settingsRepo.get('entrega.taxa', 0)
      setForm({ clienteNome: '', clienteTelefone: '', endereco: '', taxaEntrega: String(taxa || '') })
    })()
  }, [])

  async function abrir(e) {
    e.preventDefault()
    if (form.clienteNome.trim().length < 2) return setErro('Informe o nome do cliente.')
    if (form.endereco.trim().length < 5) return setErro('Informe o endereço de entrega.')
    const p = await pedidos.abrirPedidoDelivery({
      clienteNome: form.clienteNome,
      clienteTelefone: form.clienteTelefone,
      endereco: form.endereco,
      taxaEntrega: Number(String(form.taxaEntrega).replace(',', '.')) || 0,
    })
    navigate(`/pedido/ordem/${p.id}`)
  }

  if (!form) return null

  return (
    <div className="stack">
      <PageHeader title="Delivery" subtitle="Dados da entrega" />

      <form className="stack" onSubmit={abrir}>
        <label className="field">
          <span className="field-label">Nome do cliente</span>
          <input
            className="input"
            value={form.clienteNome}
            onChange={(e) => setForm({ ...form, clienteNome: e.target.value })}
            autoFocus
          />
        </label>
        <label className="field">
          <span className="field-label">Telefone</span>
          <input
            className="input"
            inputMode="tel"
            value={form.clienteTelefone}
            onChange={(e) => setForm({ ...form, clienteTelefone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </label>
        <label className="field">
          <span className="field-label">Endereço</span>
          <textarea
            className="textarea"
            value={form.endereco}
            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            placeholder="Rua, número, bairro, referência"
          />
        </label>
        <label className="field">
          <span className="field-label">Taxa de entrega (R$)</span>
          <input
            className="input"
            inputMode="decimal"
            value={form.taxaEntrega}
            onChange={(e) => setForm({ ...form, taxaEntrega: e.target.value })}
            placeholder="0,00"
          />
        </label>

        {erro && <p className="form-erro">{erro}</p>}

        <button className="btn btn-block" type="submit">
          Abrir pedido
        </button>
      </form>
    </div>
  )
}
