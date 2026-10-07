import { db, DEVICE_ID } from './db.js'
import { uid } from '../lib/format.js'

const agora = () => Date.now()
const arred = (n) => Math.round((n || 0) * 100) / 100

function metadados() {
  const now = agora()
  return { id: uid(), createdAt: now, updatedAt: now, deleted: 0, deviceId: DEVICE_ID }
}

export function sessaoAberta() {
  return db.cashSessions
    .where('status')
    .equals('aberto')
    .filter((s) => !s.deleted)
    .first()
    .then((sessao) => sessao ?? null)
}

export async function abrirCaixa({ valorAbertura = 0, operador }) {
  const existente = await sessaoAberta()
  if (existente) return existente
  const sessao = {
    status: 'aberto',
    valorAbertura: arred(Number(valorAbertura) || 0),
    operadorId: operador?.id ?? null,
    operadorNome: operador?.nome ?? '',
    openedAt: agora(),
    closedAt: null,
    ...metadados(),
  }
  await db.cashSessions.put(sessao)
  return sessao
}

export async function registrarMovimento(sessionId, { tipo, valor, observacao = '' }) {
  const movimento = {
    cashSessionId: sessionId,
    tipo, // 'sangria' | 'suprimento'
    valor: arred(Number(valor) || 0),
    observacao,
    ...metadados(),
  }
  await db.cashMovements.put(movimento)
  return movimento
}

export async function removerMovimento(id) {
  await db.cashMovements.update(id, { deleted: 1, updatedAt: agora(), deviceId: DEVICE_ID })
}

export function movimentosDaSessao(sessionId) {
  return db.cashMovements
    .where('cashSessionId')
    .equals(sessionId)
    .filter((m) => !m.deleted)
    .sortBy('createdAt')
}

async function pedidosDaSessao(sessionId) {
  return db.orders
    .filter((o) => !o.deleted && o.status === 'fechado' && o.cashSessionId === sessionId)
    .toArray()
}

export async function resumoCaixa(sessionId) {
  const sessao = await db.cashSessions.get(sessionId)
  const pedidos = sessionId ? await pedidosDaSessao(sessionId) : []
  const ids = new Set(pedidos.map((p) => p.id))
  const pagamentos = (await db.payments.filter((p) => !p.deleted).toArray()).filter((p) =>
    ids.has(p.orderId),
  )
  const movimentos = sessionId ? await movimentosDaSessao(sessionId) : []

  const porMetodo = { dinheiro: 0, pix: 0, debito: 0, credito: 0 }
  for (const p of pagamentos) {
    porMetodo[p.metodo] = arred((porMetodo[p.metodo] || 0) + p.valor)
  }

  const totalVendas = arred(pedidos.reduce((s, o) => s + (o.total || 0), 0))
  const troco = arred(
    pedidos.reduce((s, o) => {
      const pago = pagamentos.filter((p) => p.orderId === o.id).reduce((a, p) => a + p.valor, 0)
      return s + Math.max(0, pago - o.total)
    }, 0),
  )
  const suprimentos = arred(
    movimentos.filter((m) => m.tipo === 'suprimento').reduce((s, m) => s + m.valor, 0),
  )
  const sangrias = arred(
    movimentos.filter((m) => m.tipo === 'sangria').reduce((s, m) => s + m.valor, 0),
  )

  const esperadoDinheiro = arred(
    (sessao?.valorAbertura || 0) + porMetodo.dinheiro + suprimentos - sangrias - troco,
  )

  return {
    sessao,
    pedidos,
    movimentos,
    porMetodo,
    totalVendas,
    qtdPedidos: pedidos.length,
    troco,
    suprimentos,
    sangrias,
    esperadoDinheiro,
  }
}

export async function fecharCaixa(sessionId, { valorContado = 0, observacao = '' } = {}) {
  const resumo = await resumoCaixa(sessionId)
  const contado = arred(Number(valorContado) || 0)
  const fechamento = {
    status: 'fechado',
    closedAt: agora(),
    valorContado: contado,
    diferenca: arred(contado - resumo.esperadoDinheiro),
    observacao,
    resumoFechamento: {
      totalVendas: resumo.totalVendas,
      qtdPedidos: resumo.qtdPedidos,
      porMetodo: resumo.porMetodo,
      troco: resumo.troco,
      sangrias: resumo.sangrias,
      suprimentos: resumo.suprimentos,
      esperadoDinheiro: resumo.esperadoDinheiro,
    },
    updatedAt: agora(),
    deviceId: DEVICE_ID,
  }
  await db.cashSessions.update(sessionId, fechamento)
  return fechamento
}

export function historicoCaixas() {
  return db.cashSessions
    .filter((s) => !s.deleted && s.status === 'fechado')
    .toArray()
    .then((lista) => lista.sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0)))
}
