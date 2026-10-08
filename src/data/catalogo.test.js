import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db.js'
import { slug, categoriaId, produtoId, mesaId, deduplicarCatalogo } from './catalogo.js'
import { seedDefaults } from './seed.js'

describe('catálogo — IDs determinísticos e dedup', () => {
  beforeEach(async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
  })

  it('slug/ids são estáveis', () => {
    expect(slug('Pratos Principais')).toBe('pratos-principais')
    expect(slug('Água Mineral')).toBe('agua-mineral')
    expect(categoriaId('Entradas')).toBe('cat-entradas')
    expect(produtoId('Moqueca de Peixe')).toBe('prod-moqueca-de-peixe')
    expect(mesaId(3)).toBe('mesa-3')
  })

  it('o seed usa ids determinísticos (mesmo em qualquer aparelho)', async () => {
    await seedDefaults()
    const cat = await db.categories.get('cat-entradas')
    const prod = await db.products.get('prod-moqueca-de-peixe')
    const mesa = await db.mesas.get('mesa-1')
    expect(cat?.nome).toBe('Entradas')
    expect(prod?.nome).toBe('Moqueca de Peixe')
    expect(mesa?.numero).toBe(1)
  })

  it('junta categorias duplicadas e remapeia produtos', async () => {
    await db.categories.bulkPut([
      { id: 'aaa', nome: 'Entradas', ativo: 1, deleted: 0, updatedAt: 1 },
      { id: 'bbb', nome: 'Entradas', ativo: 1, deleted: 0, updatedAt: 1 },
    ])
    await db.products.put({
      id: 'p1',
      categoryId: 'bbb',
      nome: 'Bolinho',
      preco: 10,
      ativo: 1,
      deleted: 0,
      updatedAt: 1,
    })

    await deduplicarCatalogo()

    const ativas = (await db.categories.toArray()).filter((c) => !c.deleted)
    expect(ativas).toHaveLength(1)
    expect(ativas[0].id).toBe('aaa') // menor id vence
    const prod = await db.products.get('p1')
    expect(prod.categoryId).toBe('aaa')
  })

  it('junta mesas duplicadas e remapeia pedidos', async () => {
    await db.mesas.bulkPut([
      { id: 'm-z', numero: 5, nome: 'Mesa 5', ativo: 1, deleted: 0, updatedAt: 1 },
      { id: 'm-a', numero: 5, nome: 'Mesa 5', ativo: 1, deleted: 0, updatedAt: 1 },
    ])
    await db.orders.put({ id: 'o1', tipo: 'mesa', tableId: 'm-z', status: 'aberto', deleted: 0, updatedAt: 1 })

    await deduplicarCatalogo()

    const ativas = (await db.mesas.toArray()).filter((m) => !m.deleted)
    expect(ativas).toHaveLength(1)
    expect(ativas[0].id).toBe('m-a')
    expect((await db.orders.get('o1')).tableId).toBe('m-a')
  })
})
