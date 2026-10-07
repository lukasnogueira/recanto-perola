import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db.js'
import * as pedidos from './pedidos.js'
import * as pagamentos from './pagamentos.js'
import * as caixa from './caixa.js'

async function vender(preco, pago, metodo = 'dinheiro') {
  const pedido = await pedidos.abrirPedidoBalcao()
  await pedidos.adicionarItem(pedido.id, { id: 'p1', nome: 'Prato', preco })
  await pagamentos.registrarPagamento(pedido.id, { metodo, valor: pago })
  await pagamentos.fecharPedido(pedido.id)
  return pedido
}

describe('caixa', () => {
  beforeEach(async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
  })

  it('abre o caixa e reaproveita se já houver um aberto', async () => {
    const a = await caixa.abrirCaixa({ valorAbertura: 100, operador: { id: 'o1', nome: 'Lucas' } })
    const b = await caixa.abrirCaixa({ valorAbertura: 50 })
    expect(a.id).toBe(b.id)
    expect((await caixa.sessaoAberta()).id).toBe(a.id)
  })

  it('calcula esperado em dinheiro com vendas, troco, suprimentos e sangrias', async () => {
    const sessao = await caixa.abrirCaixa({ valorAbertura: 100 })
    await vender(50, 60) // venda 50, pago 60 em dinheiro => troco 10
    await caixa.registrarMovimento(sessao.id, { tipo: 'suprimento', valor: 20 })
    await caixa.registrarMovimento(sessao.id, { tipo: 'sangria', valor: 10 })

    const r = await caixa.resumoCaixa(sessao.id)
    expect(r.totalVendas).toBe(50)
    expect(r.porMetodo.dinheiro).toBe(60)
    expect(r.troco).toBe(10)
    expect(r.suprimentos).toBe(20)
    expect(r.sangrias).toBe(10)
    expect(r.esperadoDinheiro).toBe(160) // 100 + 60 + 20 - 10 - 10
    expect(r.qtdPedidos).toBe(1)
  })

  it('associa a venda ao caixa aberto ao fechar o pedido', async () => {
    const sessao = await caixa.abrirCaixa({ valorAbertura: 0 })
    const pedido = await vender(30, 30)
    const atual = await pedidos.pedido(pedido.id)
    expect(atual.cashSessionId).toBe(sessao.id)
  })

  it('fecha o caixa e calcula a diferença', async () => {
    const sessao = await caixa.abrirCaixa({ valorAbertura: 100 })
    await vender(50, 50)
    const fechamento = await caixa.fecharCaixa(sessao.id, { valorContado: 148 })

    expect(fechamento.diferenca).toBe(-2) // esperado 150, contado 148
    expect(await caixa.sessaoAberta()).toBeNull()
    const historico = await caixa.historicoCaixas()
    expect(historico).toHaveLength(1)
  })
})
