import { db, DEVICE_ID } from './db.js'
import { uid } from '../lib/format.js'

const agora = () => Date.now()

export function pagamentosDoPedido(orderId) {
  return db.payments
    .where('orderId')
    .equals(orderId)
    .filter((p) => !p.deleted)
    .toArray()
}

export async function registrarPagamento(orderId, { metodo, valor }) {
  const pagamento = {
    id: uid(),
    orderId,
    metodo,
    valor: Math.round((Number(valor) || 0) * 100) / 100,
    createdAt: agora(),
    updatedAt: agora(),
    deleted: 0,
    deviceId: DEVICE_ID,
  }
  await db.payments.put(pagamento)
  return pagamento
}

export async function removerPagamento(id) {
  await db.payments.update(id, { deleted: 1, updatedAt: agora(), deviceId: DEVICE_ID })
}

export function totalPago(orderId) {
  return pagamentosDoPedido(orderId).then((lista) => lista.reduce((s, p) => s + p.valor, 0))
}

export async function fecharPedido(orderId, { cashSessionId } = {}) {
  let sessaoId = cashSessionId
  if (sessaoId === undefined) {
    const aberta = await db.cashSessions
      .where('status')
      .equals('aberto')
      .filter((s) => !s.deleted)
      .first()
    sessaoId = aberta?.id ?? null
  }
  await db.orders.update(orderId, {
    status: 'fechado',
    closedAt: agora(),
    cashSessionId: sessaoId,
    updatedAt: agora(),
    deviceId: DEVICE_ID,
  })
}
