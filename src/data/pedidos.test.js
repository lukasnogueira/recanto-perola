import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db.js'
import * as pedidos from './pedidos.js'

const PROD_A = { id: 'p1', nome: 'Moqueca', preco: 80 }
const PROD_B = { id: 'p2', nome: 'Suco', preco: 10 }

describe('pedidos', () => {
  beforeEach(async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
  })

  it('reutiliza a comanda aberta da mesma mesa', async () => {
    const a = await pedidos.abrirComandaMesa({ tableId: 'm1', mesaNumero: 1, mesaNome: 'Mesa 1' })
    const b = await pedidos.abrirComandaMesa({ tableId: 'm1', mesaNumero: 1, mesaNome: 'Mesa 1' })
    expect(a.id).toBe(b.id)
  })

  it('soma itens e calcula subtotal/total', async () => {
    const comanda = await pedidos.abrirComandaMesa({ tableId: 'm1', mesaNumero: 1, mesaNome: 'Mesa 1' })
    await pedidos.adicionarItem(comanda.id, PROD_A)
    await pedidos.adicionarItem(comanda.id, PROD_A)
    await pedidos.adicionarItem(comanda.id, PROD_B)

    const atual = await pedidos.pedido(comanda.id)
    expect(atual.itemsCount).toBe(3)
    expect(atual.subtotal).toBe(170)
    expect(atual.total).toBe(170)
  })

  it('aplica desconto e taxa de entrega no total', async () => {
    const pedido = await pedidos.abrirPedidoDelivery({
      clienteNome: 'Ana',
      endereco: 'Rua X, 10',
      taxaEntrega: 7,
    })
    await pedidos.adicionarItem(pedido.id, PROD_A)
    await pedidos.atualizarPedido(pedido.id, { desconto: 10 })

    const atual = await pedidos.pedido(pedido.id)
    expect(atual.subtotal).toBe(80)
    expect(atual.total).toBe(77) // 80 - 10 + 7
  })

  it('remove o item ao zerar a quantidade', async () => {
    const comanda = await pedidos.abrirPedidoBalcao()
    await pedidos.adicionarItem(comanda.id, PROD_B)
    const [item] = await pedidos.itensDoPedido(comanda.id)
    await pedidos.alterarQuantidade(item.id, -1)

    const itens = await pedidos.itensDoPedido(comanda.id)
    const atual = await pedidos.pedido(comanda.id)
    expect(itens).toHaveLength(0)
    expect(atual.total).toBe(0)
  })

  it('lista apenas pedidos abertos', async () => {
    const a = await pedidos.abrirPedidoBalcao()
    const b = await pedidos.abrirPedidoBalcao()
    await pedidos.cancelarPedido(b.id)

    const abertos = await pedidos.pedidosAbertos()
    expect(abertos.map((o) => o.id)).toEqual([a.id])
  })
})
