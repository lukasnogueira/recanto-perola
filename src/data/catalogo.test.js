import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db.js'
import {
  slug,
  categoriaId,
  produtoId,
  mesaId,
  deduplicarCatalogo,
  limparCatalogo,
  removerCatalogoExemplo,
} from './catalogo.js'
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

  it('o seed cria o cardápio e mesas determinísticas', async () => {
    await seedDefaults()
    expect(await db.categories.count()).toBe(3)
    expect(await db.products.count()).toBe(18)
    const esp = await db.products.get('prod-espeto-bovino')
    expect(esp?.nome).toBe('Espeto Bovino')
    expect(esp?.preco).toBe(35.99)
    const mesa = await db.mesas.get('mesa-1')
    expect(mesa?.numero).toBe(1)
  })

  it('limparCatalogo marca produtos e categorias como excluídos', async () => {
    await db.categories.put({ id: 'c1', nome: 'X', ativo: 1, deleted: 0, updatedAt: 1 })
    await db.products.put({
      id: 'p1',
      categoryId: 'c1',
      nome: 'Y',
      preco: 5,
      ativo: 1,
      deleted: 0,
      updatedAt: 1,
    })

    const r = await limparCatalogo()

    expect(r).toEqual({ categorias: 1, produtos: 1 })
    expect((await db.categories.get('c1')).deleted).toBe(1)
    expect((await db.products.get('p1')).deleted).toBe(1)
  })

  it('removerCatalogoExemplo apaga só o catálogo vindo do seed', async () => {
    await db.products.put({
      id: 's1',
      categoryId: 'c',
      nome: 'Exemplo',
      preco: 1,
      ativo: 1,
      deleted: 0,
      updatedAt: 1,
      deviceId: 'seed',
    })
    await db.products.put({
      id: 'u1',
      categoryId: 'c',
      nome: 'Meu produto',
      preco: 1,
      ativo: 1,
      deleted: 0,
      updatedAt: 1,
      deviceId: 'devX',
    })

    await removerCatalogoExemplo()

    expect((await db.products.get('s1')).deleted).toBe(1)
    expect((await db.products.get('u1')).deleted).toBe(0)
  })

  it('semeia o cardápio depois de remover o catálogo de exemplo', async () => {
    // simula o catálogo de exemplo antigo (deviceId 'seed')
    await db.categories.put({
      id: 'cat-x',
      nome: 'Entradas',
      ativo: 1,
      deleted: 0,
      updatedAt: 1,
      deviceId: 'seed',
    })
    await db.products.put({
      id: 'prod-x',
      categoryId: 'cat-x',
      nome: 'Moqueca',
      preco: 1,
      ativo: 1,
      deleted: 0,
      updatedAt: 1,
      deviceId: 'seed',
    })

    await removerCatalogoExemplo()
    await seedDefaults()

    expect(await db.products.filter((p) => !p.deleted).count()).toBe(18)
  })

  it('não ressemeia o cardápio depois de limpar', async () => {
    await seedDefaults()
    await limparCatalogo()
    await seedDefaults()
    expect(await db.products.filter((p) => !p.deleted).count()).toBe(0)
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
