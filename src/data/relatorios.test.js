import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db.js'
import * as pedidos from './pedidos.js'
import * as pagamentos from './pagamentos.js'
import { resumoPeriodo, diaRange } from './relatorios.js'

async function venderFechado(itens, metodo = 'dinheiro') {
  const pedido = await pedidos.abrirPedidoBalcao()
  let total = 0
  for (const item of itens) {
    await pedidos.adicionarItem(pedido.id, item)
    total += item.preco
  }
  await pagamentos.registrarPagamento(pedido.id, { metodo, valor: total })
  await pagamentos.fecharPedido(pedido.id)
  return pedido
}

describe('relatórios', () => {
  beforeEach(async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
  })

  it('diaRange cobre o dia local inteiro', () => {
    const [inicio, fim] = diaRange('2026-10-06')
    expect(new Date(inicio).getDate()).toBe(6)
    expect(fim - inicio).toBe(24 * 60 * 60 * 1000)
  })

  it('agrupa vendas do dia por produto, método e tipo', async () => {
    const hoje = new Date()
    const hojeInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime()
    const [inicio, fim] = diaRange(
      `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(
        hoje.getDate(),
      ).padStart(2, '0')}`,
    )

    await venderFechado([{ id: 'p1', nome: 'Moqueca', preco: 80 }], 'pix')
    const p2 = await venderFechado([{ id: 'p1', nome: 'Moqueca', preco: 80 }], 'dinheiro')

    // joga um pedido para ontem
    await db.orders.update(p2.id, { closedAt: hojeInicio - 24 * 60 * 60 * 1000 })

    const r = await resumoPeriodo(inicio, fim)
    expect(r.totalVendas).toBe(80)
    expect(r.qtdPedidos).toBe(1)
    expect(r.porMetodo.pix).toBe(80)
    expect(r.porTipo.balcao).toBe(80)
    expect(r.porProduto).toHaveLength(1)
    expect(r.porProduto[0]).toMatchObject({ nome: 'Moqueca', quantidade: 1, total: 80 })
  })
})
