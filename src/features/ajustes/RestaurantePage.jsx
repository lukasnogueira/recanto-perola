import { useEffect, useState } from 'react'
import { settingsRepo } from '../../data/repositories.js'
import PageHeader from '../../components/PageHeader.jsx'

export default function RestaurantePage() {
  const [form, setForm] = useState(null)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    ;(async () => {
      const s = await settingsRepo.all()
      setForm({
        nome: s['restaurante.nome'] ?? 'Recanto Pérola',
        telefone: s['restaurante.telefone'] ?? '',
        endereco: s['restaurante.endereco'] ?? '',
        taxaEntrega: String(s['entrega.taxa'] ?? 0),
      })
    })()
  }, [])

  async function salvar(e) {
    e.preventDefault()
    await settingsRepo.set('restaurante.nome', form.nome.trim() || 'Recanto Pérola')
    await settingsRepo.set('restaurante.telefone', form.telefone.trim())
    await settingsRepo.set('restaurante.endereco', form.endereco.trim())
    await settingsRepo.set('entrega.taxa', Number(String(form.taxaEntrega).replace(',', '.')) || 0)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  if (!form) return null

  return (
    <div className="stack">
      <PageHeader title="Restaurante" subtitle="Dados gerais e taxa de entrega" />

      <form className="stack" onSubmit={salvar}>
        <label className="field">
          <span className="field-label">Nome do restaurante</span>
          <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </label>
        <label className="field">
          <span className="field-label">Telefone</span>
          <input
            className="input"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </label>
        <label className="field">
          <span className="field-label">Endereço</span>
          <input
            className="input"
            value={form.endereco}
            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field-label">Taxa de entrega (R$)</span>
          <input
            className="input"
            inputMode="decimal"
            value={form.taxaEntrega}
            onChange={(e) => setForm({ ...form, taxaEntrega: e.target.value })}
          />
        </label>

        <button className="btn btn-block" type="submit">
          {salvo ? 'Salvo ✓' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}
