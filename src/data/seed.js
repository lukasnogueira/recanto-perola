import { db } from './db.js'
import { categoriaId, produtoId, mesaId } from './catalogo.js'

const CATEGORIAS = [
  { nome: 'Espetos', ordem: 1 },
  { nome: 'Bebidas', ordem: 2 },
  { nome: 'Adicionais', ordem: 3 },
]

const PRODUTOS = [
  { cat: 'Espetos', nome: 'Espeto Bovino', preco: 35.99 },
  { cat: 'Espetos', nome: 'Linguiça Toscana', preco: 28.99 },
  { cat: 'Espetos', nome: 'Linguiça de frango', preco: 28.99 },
  { cat: 'Espetos', nome: 'Medalhão bovino', preco: 38.99 },
  { cat: 'Espetos', nome: 'Medalhão de frango', preco: 36.99 },
  { cat: 'Espetos', nome: 'Espeto Suíno', preco: 35.99 },
  { cat: 'Espetos', nome: 'Asinha de frango', preco: 28.99 },
  { cat: 'Bebidas', nome: 'Refrigerante 1LT', preco: 10.0 },
  { cat: 'Bebidas', nome: 'Refrigerante 2LT', preco: 15.0 },
  { cat: 'Bebidas', nome: 'Suco Natural 400ML', preco: 8.0 },
  { cat: 'Bebidas', nome: 'Água', preco: 3.0 },
  { cat: 'Bebidas', nome: 'Água com gás', preco: 4.0 },
  { cat: 'Adicionais', nome: 'Farofa', preco: 8.0 },
  { cat: 'Adicionais', nome: 'Vinagrete', preco: 8.0 },
  { cat: 'Adicionais', nome: 'Purê', preco: 8.0 },
  { cat: 'Adicionais', nome: 'Mandioca', preco: 8.0 },
  { cat: 'Adicionais', nome: 'Arroz', preco: 8.0 },
  { cat: 'Adicionais', nome: 'Batata Frita', preco: 8.0 },
]

// deviceId 'menu' (e não 'seed') para NÃO ser removido pela limpeza do catálogo
// de exemplo. IDs determinísticos → o mesmo item em qualquer aparelho.
function base(id, extra) {
  const now = Date.now()
  return { id, ativo: 1, createdAt: now, updatedAt: now, deleted: 0, deviceId: 'menu', ...extra }
}

export async function seedDefaults() {
  if ((await db.settings.count()) === 0) {
    await db.settings.bulkPut([
      { key: 'restaurante.nome', value: 'Recanto Pérola' },
      { key: 'restaurante.telefone', value: '(99) 98164-2207' },
      { key: 'restaurante.endereco', value: '' },
      { key: 'entrega.taxa', value: 0 },
    ])
  }

  if ((await db.categories.count()) === 0) {
    for (const c of CATEGORIAS) {
      await db.categories.put(base(categoriaId(c.nome), { nome: c.nome, ordem: c.ordem }))
    }
    for (const p of PRODUTOS) {
      await db.products.put(
        base(produtoId(p.nome), { categoryId: categoriaId(p.cat), nome: p.nome, preco: p.preco }),
      )
    }
  }

  if ((await db.mesas.count()) === 0) {
    for (let n = 1; n <= 8; n++) {
      await db.mesas.put(base(mesaId(n), { numero: n, nome: `Mesa ${n}`, area: 'Salão' }))
    }
  }
}
