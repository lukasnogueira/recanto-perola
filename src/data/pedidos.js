import { db, DEVICE_ID } from './db.js'
import { uid } from '../lib/format.js'

const agora = () => Date.now()

function metadados() {
  const now = agora()
  return { id: uid(), createdAt: now, updatedAt: now, deleted: 0, deviceId: DEVICE_ID }
}

async function criarPedido(dados) {
  const pedido = {
    tipo: 'balcao',
    status: 'aberto',
    taxaEntrega: 0,
    desconto: 0,
    observacao: '',
    subtotal: 0,
    total: 0,
    itemsCount: 0,
    closedAt: null,
    cashSessionId: null,
    ...dados,
    ...metadados(),
  }
  await db.orders.put(pedido)
  return pedido
}

export async function abrirComandaMesa({ tableId, mesaNumero, mesaNome, clienteNome }) {
  const existente = await db.orders
    .where('tableId')
    .equals(tableId)
    .filter((o) => !o.deleted && o.status === 'aberto')
    .first()
  if (existente) return existente
  return criarPedido({
    tipo: 'mesa',
    tableId,
    mesaNumero,
    mesaNome,
    clienteNome: (clienteNome || '').trim(),
  })
}

export function abrirPedidoBalcao(dados = {}) {
  return criarPedido({ tipo: 'balcao', clienteNome: (dados.clienteNome || '').trim(), ...dados })
}

export function abrirPedidoDelivery(dados) {
  return criarPedido({
    tipo: 'delivery',
    clienteNome: (dados.clienteNome || '').trim(),
    clienteTelefone: (dados.clienteTelefone || '').trim(),
    endereco: (dados.endereco || '').trim(),
    taxaEntrega: Number(dados.taxaEntrega) || 0,
  })
}

export function pedido(id) {
  return db.orders.get(id)
}

export function itensDoPedido(orderId) {
  return db.orderItems
    .where('orderId')
    .equals(orderId)
    .filter((i) => !i.deleted)
    .toArray()
}

export function pedidosAbertos() {
  return db.orders
    .filter((o) => !o.deleted && o.status === 'aberto')
    .sortBy('createdAt')
}

export async function adicionarItem(orderId, produto, observacao = '') {
  const existente = await db.orderItems
    .where('orderId')
    .equals(orderId)
    .filter((i) => !i.deleted && i.productId === produto.id && (i.observacao || '') === observacao)
    .first()

  if (existente) {
    await db.orderItems.update(existente.id, {
      quantidade: existente.quantidade + 1,
      updatedAt: agora(),
      deviceId: DEVICE_ID,
    })
  } else {
    await db.orderItems.put({
      orderId,
      productId: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      quantidade: 1,
      observacao,
      ...metadados(),
    })
  }
  await recalcular(orderId)
}

export async function alterarQuantidade(itemId, delta) {
  const item = await db.orderItems.get(itemId)
  if (!item) return
  const quantidade = item.quantidade + delta
  await db.orderItems.update(itemId, {
    quantidade,
    deleted: quantidade <= 0 ? 1 : 0,
    updatedAt: agora(),
    deviceId: DEVICE_ID,
  })
  await recalcular(item.orderId)
}

export async function atualizarItem(itemId, patch) {
  const item = await db.orderItems.get(itemId)
  if (!item) return
  await db.orderItems.update(itemId, { ...patch, updatedAt: agora(), deviceId: DEVICE_ID })
  await recalcular(item.orderId)
}

export async function removerItem(itemId) {
  const item = await db.orderItems.get(itemId)
  if (!item) return
  await db.orderItems.update(itemId, { deleted: 1, updatedAt: agora(), deviceId: DEVICE_ID })
  await recalcular(item.orderId)
}

export async function atualizarPedido(orderId, patch) {
  await db.orders.update(orderId, { ...patch, updatedAt: agora(), deviceId: DEVICE_ID })
  await recalcular(orderId)
}

export async function recalcular(orderId) {
  const itens = await itensDoPedido(orderId)
  const subtotal = itens.reduce((s, i) => s + i.preco * i.quantidade, 0)
  const itemsCount = itens.reduce((s, i) => s + i.quantidade, 0)
  const pedidoAtual = await db.orders.get(orderId)
  const desconto = pedidoAtual?.desconto || 0
  const taxa = pedidoAtual?.taxaEntrega || 0
  const total = Math.max(0, subtotal - desconto + taxa)
  await db.orders.update(orderId, { subtotal, total, itemsCount, updatedAt: agora(), deviceId: DEVICE_ID })
  return { subtotal, desconto, taxa, total, itemsCount }
}

export async function cancelarPedido(orderId) {
  await db.orders.update(orderId, {
    status: 'cancelado',
    deleted: 1,
    updatedAt: agora(),
    deviceId: DEVICE_ID,
  })
}
