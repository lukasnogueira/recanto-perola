import { describe, it, expect } from 'vitest'
import { mesclarContrib, quantidadeLinha } from '../itens.js'
import { planejarItens, mesclarLinha, contribIgual } from './merge.js'

const linha = (id, contrib, extra = {}) => ({
  id,
  orderId: 'o1',
  productId: 'p1',
  nome: 'Moqueca',
  preco: 80,
  observacao: '',
  contrib,
  updatedAt: 1,
  deleted: 0,
  ...extra,
})

describe('CRDT dos itens (PN-Counter)', () => {
  it('mescla contribuições de aparelhos somando incrementos', () => {
    const a = linha('l1', { devA: { inc: 2, dec: 0 } })
    const b = linha('l1', { devB: { inc: 1, dec: 0 } })
    const [mesclada] = planejarItens([a], [b])
    expect(quantidadeLinha(mesclada)).toBe(3)
  })

  it('não perde atualização quando dois aparelhos adicionam ao mesmo item', () => {
    // cenário do problema: 2 operadores, mesma comanda, mesmo produto
    const dispositivoA = [linha('l1', { devA: { inc: 1, dec: 0 } })]
    const dispositivoB = [linha('l1', { devB: { inc: 1, dec: 0 } })]
    const r1 = planejarItens(dispositivoA, dispositivoB)
    const r2 = planejarItens(dispositivoB, dispositivoA) // ordem inversa
    expect(quantidadeLinha(r1[0])).toBe(2)
    expect(quantidadeLinha(r2[0])).toBe(2) // convergência
  })

  it('abate decrementos sem ficar negativo', () => {
    const a = linha('l1', { devA: { inc: 3, dec: 0 } })
    const b = linha('l1', { devA: { inc: 3, dec: 0 }, devB: { inc: 0, dec: 5 } })
    const [mesclada] = planejarItens([a], [b])
    expect(quantidadeLinha(mesclada)).toBe(0)
  })

  it('é idempotente e comutativa', () => {
    const a = linha('l1', { devA: { inc: 2, dec: 1 } })
    const b = linha('l1', { devB: { inc: 1, dec: 0 } })
    const uma = mesclarLinha(a, b)
    const duas = mesclarLinha(uma, b) // aplicar de novo
    const inverso = mesclarLinha(b, a)
    expect(contribIgual(uma.contrib, duas.contrib)).toBe(true)
    expect(contribIgual(uma.contrib, inverso.contrib)).toBe(true)
    expect(quantidadeLinha(uma)).toBe(2)
  })

  it('soma contribuições de aparelhos diferentes no mesmo item', () => {
    const c = mesclarContrib({ a: { inc: 1, dec: 0 } }, { a: { inc: 2, dec: 0 }, b: { inc: 4, dec: 1 } })
    expect(c.a).toEqual({ inc: 2, dec: 0 })
    expect(c.b).toEqual({ inc: 4, dec: 1 })
  })

  it('mantém linhas separadas por observação', () => {
    const normal = linha('l1', { devA: { inc: 1, dec: 0 } })
    const semCebola = linha('l2', { devA: { inc: 1, dec: 0 } }, { observacao: 'sem cebola' })
    const mescladas = planejarItens([normal], [semCebola])
    expect(mescladas).toHaveLength(2)
  })
})
