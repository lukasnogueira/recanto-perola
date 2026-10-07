import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db.js'
import * as pedidos from './pedidos.js'
import * as pagamentos from './pagamentos.js'

describe('pagamentos', () => {
  beforeEach(async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
  })

  it('soma pagamentos e calcula troco', async () => {
    const pedido = await pedidos.abrirPedidoBalcao()
    await pedidos.adicionarItem(pedido.id, { id: 'p1', nome: 'Prato', preco: 50 })
    await pagamentos.registrarPagamento(pedido.id, { metodo: 'dinheiro', valor: 60 })

    const pago = await pagamentos.totalPago(pedido.id)
    const atual = await pedidos.pedido(pedido.id)
    expect(pago).toBe(60)
    expect(pago - atual.total).toBe(10) // troco
  })

  it('permite pagamento dividido entre métodos', async () => {
    const pedido = await pedidos.abrirPedidoBalcao()
    await pedidos.adicionarItem(pedido.id, { id: 'p1', nome: 'Prato', preco: 100 })
    await pagamentos.registrarPagamento(pedido.id, { metodo: 'pix', valor: 40 })
    await pagamentos.registrarPagamento(pedido.id, { metodo: 'credito', valor: 60 })

    const lista = await pagamentos.pagamentosDoPedido(pedido.id)
    expect(lista).toHaveLength(2)
    expect(await pagamentos.totalPago(pedido.id)).toBe(100)
  })

  it('fecha o pedido e sai da lista de abertos', async () => {
    const pedido = await pedidos.abrirPedidoBalcao()
    await pagamentos.fecharPedido(pedido.id)

    const atual = await pedidos.pedido(pedido.id)
    expect(atual.status).toBe('fechado')
    expect(atual.closedAt).toBeTruthy()
    expect(await pedidos.pedidosAbertos()).toHaveLength(0)
  })
})
