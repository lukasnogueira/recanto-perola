import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db.js'
import { operadoresRepo } from '../../data/repositories.js'
import { hashPin, newSalt } from '../auth/pin.js'
import { PERFIS } from '../auth/permissions.js'
import Modal from '../../components/Modal.jsx'
import PageHeader from '../../components/PageHeader.jsx'

const VAZIO = { nome: '', role: 'garcom', ativo: 1 }

export default function OperadoresPage() {
  const operadores = useLiveQuery(() => db.operators.filter((o) => !o.deleted).toArray(), [])
  const [form, setForm] = useState(null)
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState('')
  const lista = operadores ?? []

  function abrir(op) {
    setForm(op ?? { ...VAZIO })
    setPin('')
    setErro('')
  }

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    const nome = form.nome.trim()
    if (nome.length < 2) return setErro('Informe o nome.')
    if (!form.id && pin.length !== 4) return setErro('Defina um PIN de 4 dígitos.')
    if (pin && pin.length !== 4) return setErro('O PIN precisa ter 4 dígitos.')

    const dados = { ...form, nome, ativo: form.ativo ? 1 : 0 }
    if (pin) {
      const salt = newSalt()
      dados.salt = salt
      dados.pinHash = await hashPin(pin, salt)
    }
    await operadoresRepo.save(dados)
    setForm(null)
  }

  async function remover(op) {
    const gerentes = lista.filter((o) => o.role === 'gerente')
    if (op.role === 'gerente' && gerentes.length <= 1) {
      alert('Não é possível excluir o único gerente.')
      return
    }
    if (confirm(`Excluir ${op.nome}?`)) await operadoresRepo.remove(op.id)
  }

  return (
    <div className="stack">
      <PageHeader title="Operadores" subtitle="Acesso por PIN e perfis" />

      <div className="row-between">
        <span className="muted">{lista.length} operador(es)</span>
        <button className="btn btn-sm" onClick={() => abrir(null)}>
          + Operador
        </button>
      </div>

      <div className="list">
        {lista.map((op) => (
          <div className="list-item" key={op.id}>
            <span className="list-item-emoji" aria-hidden="true">
              {PERFIS[op.role]?.emoji ?? '👤'}
            </span>
            <span className="grow">
              {op.nome}{' '}
              <span className="badge">{PERFIS[op.role]?.label ?? op.role}</span>{' '}
              {!op.ativo && <span className="badge">inativo</span>}
            </span>
            <button className="btn btn-sm btn-secondary" onClick={() => abrir(op)}>
              Editar
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => remover(op)} aria-label="Excluir operador">
              🗑
            </button>
          </div>
        ))}
      </div>

      <Modal
        open={!!form}
        title={form?.id ? 'Editar operador' : 'Novo operador'}
        onClose={() => setForm(null)}
        footer={
          <button className="btn btn-block" type="submit" form="form-operador">
            Salvar
          </button>
        }
      >
        {form && (
          <form id="form-operador" className="stack" onSubmit={salvar}>
            <label className="field">
              <span className="field-label">Nome</span>
              <input
                className="input"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                autoFocus
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Perfil</span>
              <select
                className="select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {Object.entries(PERFIS).map(([valor, p]) => (
                  <option key={valor} value={valor}>
                    {p.emoji} {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">{form.id ? 'Novo PIN (deixe vazio para manter)' : 'PIN (4 dígitos)'}</span>
              <input
                className="input pin-display"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder={form.id ? '••••' : '0000'}
              />
            </label>
            <label className="row">
              <input
                type="checkbox"
                checked={!!form.ativo}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked ? 1 : 0 })}
              />
              Ativo
            </label>
            {erro && <p className="form-erro">{erro}</p>}
          </form>
        )}
      </Modal>
    </div>
  )
}
