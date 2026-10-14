import { db } from './db.js'
import { mesaId } from './catalogo.js'

function base(id, extra) {
  const now = Date.now()
  return { id, ativo: 1, createdAt: now, updatedAt: now, deleted: 0, deviceId: 'seed', ...extra }
}

// Semeia apenas as configurações e as mesas. O catálogo (categorias/produtos)
// começa vazio — cada restaurante cadastra o seu (evita exemplos e duplicação).
export async function seedDefaults() {
  if ((await db.settings.count()) === 0) {
    await db.settings.bulkPut([
      { key: 'restaurante.nome', value: 'Recanto Pérola' },
      { key: 'restaurante.telefone', value: '' },
      { key: 'restaurante.endereco', value: '' },
      { key: 'entrega.taxa', value: 0 },
    ])
  }

  if ((await db.mesas.count()) === 0) {
    for (let n = 1; n <= 8; n++) {
      await db.mesas.put(base(mesaId(n), { numero: n, nome: `Mesa ${n}`, area: 'Salão' }))
    }
  }
}
