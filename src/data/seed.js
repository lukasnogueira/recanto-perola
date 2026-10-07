import { db } from './db.js'
import { uid } from '../lib/format.js'

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

function base(extra) {
  const now = Date.now()
  return { id: uid(), ativo: 1, createdAt: now, updatedAt: now, deleted: 0, deviceId: 'seed', ...extra }
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
    const catMap = {}
    for (const c of CATEGORIAS) {
      const rec = base({ nome: c.nome, ordem: c.ordem })
      await db.categories.put(rec)
      catMap[c.nome] = rec.id
    }
    for (const p of PRODUTOS) {
      await db.products.put(base({ categoryId: catMap[p.cat], nome: p.nome, preco: p.preco }))
    }
  }

  if ((await db.mesas.count()) === 0) {
    for (let n = 1; n <= 8; n++) {
      await db.mesas.put(base({ numero: n, nome: `Mesa ${n}`, area: 'Salão' }))
    }
  }
}
