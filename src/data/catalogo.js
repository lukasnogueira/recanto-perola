import { db, DEVICE_ID } from './db.js'

const agora = () => Date.now()

export function slug(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// IDs determinísticos: o mesmo registro gera o mesmo id em qualquer aparelho,
// então a sincronização faz "upsert" em vez de criar duplicatas.
export const categoriaId = (nome) => `cat-${slug(nome)}`
export const produtoId = (nome) => `prod-${slug(nome)}`
export const mesaId = (numero) => `mesa-${numero}`

function agrupar(lista, chaveFn) {
  const mapa = new Map()
  for (const item of lista) {
    const chave = chaveFn(item)
    const grupo = mapa.get(chave) || []
    grupo.push(item)
    mapa.set(chave, grupo)
  }
  return mapa
}

// Canônico = menor id (ordem estável e igual em todos os aparelhos).
function canonico(grupo) {
  return [...grupo].sort((a, b) => String(a.id).localeCompare(String(b.id)))[0]
}

async function removerDuplicados(nomeTabela, chaveFn, aoRemover) {
  const lista = await db[nomeTabela].filter((r) => !r.deleted).toArray()
  const grupos = agrupar(lista, chaveFn)
  for (const grupo of grupos.values()) {
    if (grupo.length < 2) continue
    const principal = canonico(grupo)
    for (const dup of grupo) {
      if (dup.id === principal.id) continue
      if (aoRemover) await aoRemover(dup.id, principal.id)
      await db[nomeTabela].update(dup.id, {
        deleted: 1,
        updatedAt: agora(),
        deviceId: DEVICE_ID,
      })
    }
  }
}

export async function deduplicarCategorias() {
  await removerDuplicados('categories', (c) => slug(c.nome), async (duplicadoId, principalId) => {
    const produtos = await db.products.filter((p) => !p.deleted && p.categoryId === duplicadoId).toArray()
    for (const p of produtos) {
      await db.products.update(p.id, { categoryId: principalId, updatedAt: agora(), deviceId: DEVICE_ID })
    }
  })
}

export async function deduplicarProdutos() {
  await removerDuplicados('products', (p) => `${p.categoryId}|${slug(p.nome)}`)
}

export async function deduplicarMesas() {
  await removerDuplicados('mesas', (m) => String(m.numero), async (duplicadoId, principalId) => {
    const pedidos = await db.orders.filter((o) => !o.deleted && o.tableId === duplicadoId).toArray()
    for (const o of pedidos) {
      await db.orders.update(o.id, { tableId: principalId, updatedAt: agora(), deviceId: DEVICE_ID })
    }
  })
}

export async function deduplicarOperadores() {
  await removerDuplicados(
    'operators',
    (o) => `${slug(o.nome)}|${o.role}`,
    async (duplicadoId, principalId) => {
      const sessoes = await db.cashSessions.filter((s) => !s.deleted && s.operadorId === duplicadoId).toArray()
      for (const s of sessoes) {
        await db.cashSessions.update(s.id, { operadorId: principalId, updatedAt: agora(), deviceId: DEVICE_ID })
      }
    },
  )
}

export async function deduplicarCatalogo() {
  await deduplicarCategorias()
  await deduplicarProdutos()
  await deduplicarMesas()
  await deduplicarOperadores()
}
