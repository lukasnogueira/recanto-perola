import Dexie from 'dexie'

// Banco local (IndexedDB). Mesmas tabelas que existirão no Supabase (Fase 8),
// com campos de sincronização: updatedAt, deleted (soft delete) e deviceId.
// Obs.: não usamos o nome "tables" porque é reservado pelo Dexie (db.tables).
export const db = new Dexie('recantoPerola')

db.version(1).stores({
  operators: 'id, role, ativo, updatedAt',
  categories: 'id, ordem, ativo, updatedAt',
  products: 'id, categoryId, nome, ativo, updatedAt',
  tables: 'id, numero, status, updatedAt',
  orders: 'id, tipo, status, tableId, cashSessionId, createdAt, updatedAt',
  orderItems: 'id, orderId, productId, updatedAt',
  payments: 'id, orderId, metodo, createdAt, updatedAt',
  cashSessions: 'id, status, openedAt, closedAt, updatedAt',
  cashMovements: 'id, cashSessionId, tipo, createdAt, updatedAt',
  settings: 'key',
})

// v2: renomeia "tables" -> "mesas" (evita conflito com db.tables do Dexie).
db.version(2).stores({
  tables: null,
  mesas: 'id, numero, status, updatedAt',
})

export const DEVICE_ID = getDeviceId()

function uuid() {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') {
    try {
      return c.randomUUID()
    } catch {
      // contexto não-seguro (http fora de localhost)
    }
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function getDeviceId() {
  const key = 'recanto:deviceId'
  try {
    let id = localStorage.getItem(key)
    if (!id) {
      id = uuid()
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return uuid()
  }
}
