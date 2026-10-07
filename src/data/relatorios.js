import { db } from './db.js'
import { agruparPorProduto, totalQuantidade } from './itens.js'

const arred = (n) => Math.round((n || 0) * 100) / 100

export function diaRange(dataStr) {
  const [ano, mes, dia] = dataStr.split('-').map(Number)
  const inicio = new Date(ano, mes - 1, dia, 0, 0, 0, 0).getTime()
  const fim = new Date(ano, mes - 1, dia + 1, 0, 0, 0, 0).getTime()
  return [inicio, fim]
}

export function hojeStr() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export async function resumoPeriodo(inicio, fim) {
  const pedidos = await db.orders
    .filter((o) => !o.deleted && o.status === 'fechado' && o.closedAt >= inicio && o.closedAt < fim)
    .toArray()
  const ids = new Set(pedidos.map((p) => p.id))
  const itens = (await db.orderItems.filter((i) => !i.deleted).toArray()).filter((i) =>
    ids.has(i.orderId),
  )
  const pagamentos = (await db.payments.filter((p) => !p.deleted).toArray()).filter((p) =>
    ids.has(p.orderId),
  )

  const porMetodo = {}
  for (const p of pagamentos) porMetodo[p.metodo] = arred((porMetodo[p.metodo] || 0) + p.valor)

  const porTipo = { mesa: 0, balcao: 0, delivery: 0 }
  for (const o of pedidos) porTipo[o.tipo] = arred((porTipo[o.tipo] || 0) + (o.total || 0))

  const porProduto = agruparPorProduto(itens)

  const totalVendas = arred(pedidos.reduce((s, o) => s + (o.total || 0), 0))
  const qtdPedidos = pedidos.length
  const ticketMedio = qtdPedidos ? arred(totalVendas / qtdPedidos) : 0

  return {
    pedidos,
    itens,
    porMetodo,
    porTipo,
    porProduto,
    totalVendas,
    qtdPedidos,
    ticketMedio,
    totalItens: totalQuantidade(itens),
  }
}
