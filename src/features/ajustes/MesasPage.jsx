import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db.js'
import { mesasRepo } from '../../data/repositories.js'
import Modal from '../../components/Modal.jsx'
import PageHeader from '../../components/PageHeader.jsx'

const VAZIA = { numero: '', nome: '', area: 'Salão', ativo: 1 }

export default function MesasPage() {
  const mesas = useLiveQuery(() => db.mesas.filter((t) => !t.deleted).sortBy('numero'), [])
  const [form, setForm] = useState(null)
  const lista = mesas ?? []

  async function salvar(e) {
    e.preventDefault()
    await mesasRepo.save({
      ...form,
      numero: Number(form.numero) || 0,
      ativo: form.ativo ? 1 : 0,
    })
    setForm(null)
  }

  const proximo = () => (lista.length ? Math.max(...lista.map((m) => m.numero || 0)) + 1 : 1)

  return (
    <div className="stack">
      <PageHeader title="Mesas" subtitle="Salão e áreas do restaurante" />

      <div className="row-between">
        <span className="muted">{lista.length} mesa(s)</span>
        <button className="btn btn-sm" onClick={() => setForm({ ...VAZIA, numero: proximo(), nome: `Mesa ${proximo()}` })}>
          + Mesa
        </button>
      </div>

      <div className="list">
        {lista.map((m) => (
          <div className="list-item" key={m.id}>
            <span className="badge badge-primary">#{m.numero}</span>
            <span className="grow">
              {m.nome} <span className="muted">· {m.area}</span>{' '}
              {!m.ativo && <span className="badge">inativa</span>}
            </span>
            <button className="btn btn-sm btn-secondary" onClick={() => setForm(m)}>
              Editar
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => confirm(`Excluir ${m.nome}?`) && mesasRepo.remove(m.id)}
              aria-label="Excluir mesa"
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      <Modal
        open={!!form}
        title={form?.id ? 'Editar mesa' : 'Nova mesa'}
        onClose={() => setForm(null)}
        footer={
          <button className="btn btn-block" type="submit" form="form-mesa">
            Salvar
          </button>
        }
      >
        {form && (
          <form id="form-mesa" className="stack" onSubmit={salvar}>
            <label className="field">
              <span className="field-label">Número</span>
              <input
                className="input"
                type="number"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Nome</span>
              <input
                className="input"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex.: Mesa 1"
              />
            </label>
            <label className="field">
              <span className="field-label">Área</span>
              <input
                className="input"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="Salão, Varanda, Área externa…"
              />
            </label>
            <label className="row">
              <input
                type="checkbox"
                checked={!!form.ativo}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked ? 1 : 0 })}
              />
              Ativa
            </label>
          </form>
        )}
      </Modal>
    </div>
  )
}
