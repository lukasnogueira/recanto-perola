import { db, DEVICE_ID } from './db.js'
import { uid } from '../lib/format.js'

function meta(record) {
  const now = Date.now()
  return {
    ...record,
    id: record.id ?? uid(),
    createdAt: record.createdAt ?? now,
    updatedAt: now,
    deleted: 0,
    deviceId: DEVICE_ID,
  }
}

export function createRepo(table) {
  return {
    live() {
      return db[table].filter((r) => !r.deleted).toArray()
    },
    all() {
      return db[table].toArray()
    },
    get(id) {
      return db[table].get(id)
    },
    async save(data) {
      const record = meta(data)
      await db[table].put(record)
      return record
    },
    async remove(id) {
      await db[table].update(id, { deleted: 1, updatedAt: Date.now(), deviceId: DEVICE_ID })
    },
  }
}

export const categoriasRepo = createRepo('categories')
export const produtosRepo = createRepo('products')
export const mesasRepo = createRepo('mesas')
export const operadoresRepo = createRepo('operators')
export const pedidosRepo = createRepo('orders')
export const itensRepo = createRepo('orderItems')
export const pagamentosRepo = createRepo('payments')
export const sessoesCaixaRepo = createRepo('cashSessions')
export const movimentosCaixaRepo = createRepo('cashMovements')

export const settingsRepo = {
  async get(key, fallback = null) {
    const row = await db.settings.get(key)
    return row ? row.value : fallback
  },
  async set(key, value) {
    await db.settings.put({ key, value, updatedAt: Date.now(), deviceId: DEVICE_ID })
    return value
  },
  async all() {
    const rows = await db.settings.toArray()
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  },
}
