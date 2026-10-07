import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db.js'
import { categoriasRepo, produtosRepo } from '../../data/repositories.js'
import { brl } from '../../lib/format.js'
import Modal from '../../components/Modal.jsx'
import PageHeader from '../../components/PageHeader.jsx'

const CAT_VAZIA = { nome: '', ordem: 0, ativo: 1 }
const PROD_VAZIO = { nome: '', preco: '', categoryId: '', ativo: 1 }

export default function ProdutosPage() {
  const categorias = useLiveQuery(() => db.categories.filter((c) => !c.deleted).sortBy('ordem'), [])
  const produtos = useLiveQuery(() => db.products.filter((p) => !p.deleted).toArray(), [])

  const [catForm, setCatForm] = useState(null)
  const [prodForm, setProdForm] = useState(null)

  const listaCats = categorias ?? []
  const listaProds = produtos ?? []

  async function salvarCategoria(e) {
    e.preventDefault()
    await categoriasRepo.save({
      ...catForm,
      ordem: Number(catForm.ordem) || 0,
      ativo: catForm.ativo ? 1 : 0,
    })
    setCatForm(null)
  }

  async function salvarProduto(e) {
    e.preventDefault()
    await produtosRepo.save({
      ...prodForm,
      preco: Number(String(prodForm.preco).replace(',', '.')) || 0,
      ativo: prodForm.ativo ? 1 : 0,
    })
    setProdForm(null)
  }

  async function removerCategoria(id) {
    if (!confirm('Excluir esta categoria? Os produtos dela ficam sem categoria.')) return
    await categoriasRepo.remove(id)
  }

  return (
    <div className="stack">
      <PageHeader title="Produtos" subtitle="Categorias e itens do cardápio" />

      <section className="stack">
        <div className="row-between">
          <h2 className="section-title">Categorias</h2>
          <button className="btn btn-sm" onClick={() => setCatForm({ ...CAT_VAZIA, ordem: listaCats.length + 1 })}>
            + Categoria
          </button>
        </div>
        <div className="list">
          {listaCats.map((c) => (
            <div className="list-item" key={c.id}>
              <span className="grow">
                {c.nome} {!c.ativo && <span className="badge">inativa</span>}
              </span>
              <button className="btn btn-sm btn-secondary" onClick={() => setCatForm(c)}>
                Editar
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => removerCategoria(c.id)} aria-label="Excluir categoria">
                🗑
              </button>
            </div>
          ))}
          {listaCats.length === 0 && <p className="muted">Nenhuma categoria ainda.</p>}
        </div>
      </section>

      <section className="stack">
        <div className="row-between">
          <h2 className="section-title">Itens</h2>
          <button
            className="btn btn-sm"
            onClick={() => setProdForm({ ...PROD_VAZIO, categoryId: listaCats[0]?.id ?? '' })}
            disabled={listaCats.length === 0}
          >
            + Item
          </button>
        </div>
        <div className="list">
          {listaCats.map((c) => {
            const itens = listaProds.filter((p) => p.categoryId === c.id)
            if (itens.length === 0) return null
            return (
              <div key={c.id} className="stack" style={{ gap: 8 }}>
                <span className="field-label">{c.nome}</span>
                {itens.map((p) => (
                  <div className="list-item" key={p.id}>
                    <span className="grow">
                      {p.nome} {!p.ativo && <span className="badge">inativo</span>}
                    </span>
                    <span className="amount">{brl(p.preco)}</span>
                    <button className="btn btn-sm btn-secondary" onClick={() => setProdForm(p)}>
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => confirm(`Excluir ${p.nome}?`) && produtosRepo.remove(p.id)}
                      aria-label="Excluir item"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
          {listaProds.length === 0 && <p className="muted">Nenhum item cadastrado.</p>}
        </div>
      </section>

      <Modal
        open={!!catForm}
        title={catForm?.id ? 'Editar categoria' : 'Nova categoria'}
        onClose={() => setCatForm(null)}
        footer={
          <button className="btn btn-block" type="submit" form="form-categoria">
            Salvar
          </button>
        }
      >
        {catForm && (
          <form id="form-categoria" className="stack" onSubmit={salvarCategoria}>
            <label className="field">
              <span className="field-label">Nome</span>
              <input
                className="input"
                value={catForm.nome}
                onChange={(e) => setCatForm({ ...catForm, nome: e.target.value })}
                autoFocus
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Ordem de exibição</span>
              <input
                className="input"
                type="number"
                value={catForm.ordem}
                onChange={(e) => setCatForm({ ...catForm, ordem: e.target.value })}
              />
            </label>
            <label className="row">
              <input
                type="checkbox"
                checked={!!catForm.ativo}
                onChange={(e) => setCatForm({ ...catForm, ativo: e.target.checked ? 1 : 0 })}
              />
              Ativa
            </label>
          </form>
        )}
      </Modal>

      <Modal
        open={!!prodForm}
        title={prodForm?.id ? 'Editar item' : 'Novo item'}
        onClose={() => setProdForm(null)}
        footer={
          <button className="btn btn-block" type="submit" form="form-produto">
            Salvar
          </button>
        }
      >
        {prodForm && (
          <form id="form-produto" className="stack" onSubmit={salvarProduto}>
            <label className="field">
              <span className="field-label">Nome</span>
              <input
                className="input"
                value={prodForm.nome}
                onChange={(e) => setProdForm({ ...prodForm, nome: e.target.value })}
                autoFocus
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Preço (R$)</span>
              <input
                className="input"
                inputMode="decimal"
                value={prodForm.preco}
                onChange={(e) => setProdForm({ ...prodForm, preco: e.target.value })}
                placeholder="0,00"
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Categoria</span>
              <select
                className="select"
                value={prodForm.categoryId}
                onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                required
              >
                {listaCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="row">
              <input
                type="checkbox"
                checked={!!prodForm.ativo}
                onChange={(e) => setProdForm({ ...prodForm, ativo: e.target.checked ? 1 : 0 })}
              />
              Ativo
            </label>
          </form>
        )}
      </Modal>
    </div>
  )
}
