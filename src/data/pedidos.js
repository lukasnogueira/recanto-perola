import { db, DEVICE_ID } from './db.js'
import { uid } from '../lib/format.js'
import {
  idLinha,
  quantidadeLinha,
  linhasDoPedidoDe,
  mesclarContrib,
} from './itens.js'

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

export async function itensDoPedido(orderId) {
  const linhas = await db.orderItems
    .where('orderId')
    .equals(orderId)
    .filter((i) => !i.deleted)
    .toArray()
  // Mantemos no banco as linhas "zeradas" (necessárias ao PN-Counter), mas
  // devolvemos só as efetivas (quantidade > 0).
  return linhas.filter((l) => quantidadeLinha(l) > 0)
}

export async function linhasDoPedido(orderId) {
  return linhasDoPedidoDe(await itensDoPedido(orderId))
}

export function pedidosAbertos() {
  return db.orders
    .filter((o) => !o.deleted && o.status === 'aberto')
    .sortBy('createdAt')
}

export async function adicionarItem(orderId, produto, observacao = '') {
  const id = idLinha(orderId, produto.id, observacao)
  const linha = await db.orderItems.get(id)
  const contrib = { ...linha?.contrib }
  const meu = contrib[DEVICE_ID] || { inc: 0, dec: 0 }
  contrib[DEVICE_ID] = { inc: (meu.inc || 0) + 1, dec: meu.dec || 0 }
  const now = agora()
  await db.orderItems.put({
    id,
    orderId,
    productId: produto.id,
    nome: produto.nome,
    preco: produto.preco,
    observacao: linha?.observacao ?? observacao,
    contrib,
    createdAt: linha?.createdAt ?? now,
    updatedAt: now,
    deleted: 0,
    deviceId: DEVICE_ID,
  })
  await recalcular(orderId)
}

export async function alterarQuantidade(itemId, delta) {
  const linha = await db.orderItems.get(itemId)
  if (!linha) return
  const contrib = { ...linha.contrib }
  const meu = contrib[DEVICE_ID] || { inc: 0, dec: 0 }
  if (delta > 0) {
    meu.inc = (meu.inc || 0) + delta
  } else {
    const total = quantidadeLinha(linha)
    meu.dec = (meu.dec || 0) + Math.min(-delta, total)
  }
  contrib[DEVICE_ID] = meu
  await db.orderItems.put({ ...linha, contrib, updatedAt: agora(), deviceId: DEVICE_ID })
  await recalcular(linha.orderId)
}

export async function removerItem(itemId) {
  const linha = await db.orderItems.get(itemId)
  if (!linha) return
  const total = quantidadeLinha(linha)
  const contrib = { ...linha.contrib }
  const meu = contrib[DEVICE_ID] || { inc: 0, dec: 0 }
  meu.dec = (meu.dec || 0) + total
  contrib[DEVICE_ID] = meu
  await db.orderItems.put({ ...linha, contrib, updatedAt: agora(), deviceId: DEVICE_ID })
  await recalcular(linha.orderId)
}

export async function alterarObservacao(itemId, novaObservacao) {
  const linha = await db.orderItems.get(itemId)
  if (!linha) return
  const now = agora()
  const novoId = idLinha(linha.orderId, linha.productId, novaObservacao)
  if (novoId === linha.id) {
    await db.orderItems.put({ ...linha, observacao: novaObservacao, updatedAt: now, deviceId: DEVICE_ID })
    return
  }
  const meu = linha.contrib?.[DEVICE_ID] || { inc: 0, dec: 0 }
  const meuNeto = Math.max(0, (meu.inc || 0) - (meu.dec || 0))

  const contribVelho = { ...linha.contrib }
  const cv = contribVelho[DEVICE_ID] || { inc: 0, dec: 0 }
  contribVelho[DEVICE_ID] = { inc: cv.inc || 0, dec: (cv.dec || 0) + meuNeto }
  await db.orderItems.put({ ...linha, contrib: contribVelho, updatedAt: now, deviceId: DEVICE_ID })

  const destino = await db.orderItems.get(novoId)
  const contribNovo = { ...destino?.contrib }
  const cn = contribNovo[DEVICE_ID] || { inc: 0, dec: 0 }
  contribNovo[DEVICE_ID] = { inc: (cn.inc || 0) + meuNeto, dec: cn.dec || 0 }
  await db.orderItems.put({
    id: novoId,
    orderId: linha.orderId,
    productId: linha.productId,
    nome: linha.nome,
    preco: linha.preco,
    observacao: novaObservacao,
    contrib: contribNovo,
    createdAt: destino?.createdAt ?? now,
    updatedAt: now,
    deleted: 0,
    deviceId: DEVICE_ID,
  })
  await recalcular(linha.orderId)
}

export async function atualizarPedido(orderId, patch) {
  await db.orders.update(orderId, { ...patch, updatedAt: agora(), deviceId: DEVICE_ID })
  await recalcular(orderId)
}

export async function recalcular(orderId) {
  const linhas = linhasDoPedidoDe(await itensDoPedido(orderId))
  const subtotal = linhas.reduce((s, l) => s + l.subtotal, 0)
  const itemsCount = linhas.reduce((s, l) => s + l.quantidade, 0)
  const pedidoAtual = await db.orders.get(orderId)
  if (!pedidoAtual) return
  const desconto = pedidoAtual.desconto || 0
  const taxa = pedidoAtual.taxaEntrega || 0
  const total = Math.max(0, Math.round((subtotal - desconto + taxa) * 100) / 100)
  const subtotalR = Math.round(subtotal * 100) / 100
  if (
    pedidoAtual.subtotal === subtotalR &&
    pedidoAtual.total === total &&
    pedidoAtual.itemsCount === itemsCount
  ) {
    return
  }
  await db.orders.update(orderId, {
    subtotal: subtotalR,
    total,
    itemsCount,
    updatedAt: agora(),
    deviceId: DEVICE_ID,
  })
}

export async function cancelarPedido(orderId) {
  await db.orders.update(orderId, {
    status: 'cancelado',
    deleted: 1,
    updatedAt: agora(),
    deviceId: DEVICE_ID,
  })
}

// Recalcula o total de todos os pedidos a partir dos itens (só grava se mudou).
export async function recalcularTodos() {
  const pedidos = await db.orders.filter((o) => !o.deleted).toArray()
  for (const p of pedidos) await recalcular(p.id)
}

// Se dois aparelhos abriram comanda para a mesma mesa, junta em uma só.
export async function deduplicarComandas() {
  const abertos = await db.orders
    .filter((o) => !o.deleted && o.status === 'aberto' && o.tipo === 'mesa')
    .toArray()
  const porMesa = new Map()
  for (const o of abertos) {
    const lista = porMesa.get(o.tableId) || []
    lista.push(o)
    porMesa.set(o.tableId, lista)
  }
  for (const lista of porMesa.values()) {
    if (lista.length < 2) continue
    lista.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    const principal = lista[0]
    for (const duplicada of lista.slice(1)) {
      await moverItens(duplicada.id, principal.id)
      await db.orders.update(duplicada.id, {
        status: 'cancelado',
        deleted: 1,
        updatedAt: agora(),
        deviceId: DEVICE_ID,
      })
    }
    await recalcular(principal.id)
  }
}

async function moverItens(origemId, destinoId) {
  const itens = await db.orderItems
    .where('orderId')
    .equals(origemId)
    .filter((i) => !i.deleted)
    .toArray()
  for (const item of itens) {
    const novoId = idLinha(destinoId, item.productId, item.observacao)
    const destino = await db.orderItems.get(novoId)
    const contrib = mesclarContrib(destino?.contrib, item.contrib)
    await db.orderItems.put({
      id: novoId,
      orderId: destinoId,
      productId: item.productId,
      nome: item.nome,
      preco: item.preco,
      observacao: item.observacao || '',
      contrib,
      createdAt: Math.min(destino?.createdAt || Infinity, item.createdAt || Infinity) || agora(),
      updatedAt: agora(),
      deleted: 0,
      deviceId: DEVICE_ID,
    })
    await db.orderItems.update(item.id, { deleted: 1, updatedAt: agora(), deviceId: DEVICE_ID })
  }
}
