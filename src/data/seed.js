import { db } from './db.js'
import { categoriaId, produtoId, mesaId } from './catalogo.js'

const CATEGORIAS = [
  { nome: 'Entradas', ordem: 1 },
  { nome: 'Pratos Principais', ordem: 2 },
  { nome: 'Bebidas', ordem: 3 },
  { nome: 'Sobremesas', ordem: 4 },
]

const PRODUTOS = [
  { cat: 'Entradas', nome: 'Bolinho de Bacalhau', preco: 32 },
  { cat: 'Entradas', nome: 'Camarão Empanado', preco: 58 },
  { cat: 'Pratos Principais', nome: 'Moqueca de Peixe', preco: 89 },
  { cat: 'Pratos Principais', nome: 'Arroz de Camarão', preco: 95 },
  { cat: 'Pratos Principais', nome: 'Filé à Parmegiana', preco: 72 },
  { cat: 'Bebidas', nome: 'Água Mineral', preco: 6 },
  { cat: 'Bebidas', nome: 'Refrigerante', preco: 8 },
  { cat: 'Bebidas', nome: 'Suco Natural', preco: 12 },
  { cat: 'Bebidas', nome: 'Cerveja', preco: 10 },
  { cat: 'Sobremesas', nome: 'Pudim', preco: 15 },
  { cat: 'Sobremesas', nome: 'Sorvete', preco: 14 },
]

// IDs determinísticos → cada aparelho gera exatamente os mesmos registros,
// então a sincronização faz upsert (não duplica).
function base(id, extra) {
  const now = Date.now()
  return { id, ativo: 1, createdAt: now, updatedAt: now, deleted: 0, deviceId: 'seed', ...extra }
}

export async function seedDefaults() {
  if ((await db.settings.count()) === 0) {
    await db.settings.bulkPut([
      { key: 'restaurante.nome', value: 'Recanto Pérola' },
      { key: 'restaurante.telefone', value: '' },
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
