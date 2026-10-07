import { db } from '../db.js'
import { recalcularTodos, deduplicarComandas } from '../pedidos.js'
import { obterCliente, garantirSessao, supabaseConfigurado } from './supabase.js'
import { planejarSync, planejarItens, itemPrecisaEnviar } from './merge.js'

const TABELAS_ID = [
  'operators',
  'categories',
  'products',
  'mesas',
  'orders',
  'orderItems',
  'payments',
  'cashSessions',
  'cashMovements',
]

let estado = {
  configurado: supabaseConfigurado,
  sincronizando: false,
  ultimaSync: null,
  erro: null,
}
const ouvintes = new Set()

function notificar(patch) {
  estado = { ...estado, ...patch }
  ouvintes.forEach((cb) => cb(estado))
}

export function assinarSync(cb) {
  ouvintes.add(cb)
  cb(estado)
  return () => ouvintes.delete(cb)
}

export function estadoSync() {
  return estado
}

// Puxa apenas os operadores — usado na tela de login para saber se já existe
// um gerente na nuvem (evita que qualquer aparelho crie o "primeiro" gerente).
export async function puxarOperadores() {
  if (!supabaseConfigurado) return { ok: false, motivo: 'não configurado' }
  const supabase = obterCliente()
  await garantirSessao(supabase)
  const { data, error } = await supabase.from('operators').select('*')
  if (error) throw error
  const locais = await db.operators.toArray()
  const { salvarLocal } = planejarSync(locais, data || [])
  if (salvarLocal.length) await db.operators.bulkPut(salvarLocal)
  return { ok: true, totalNuvem: (data || []).length }
}

function mergeSettings(locais, remotos) {
  const localPorChave = new Map(locais.map((r) => [r.key, r]))
  const remotoPorChave = new Map(remotos.map((r) => [r.key, r]))
  const salvarLocal = remotos.filter((r) => {
    const l = localPorChave.get(r.key)
    return !l || (r.updatedAt || 0) > (l.updatedAt || 0)
  })
  const enviar = locais.filter((l) => {
    const r = remotoPorChave.get(l.key)
    return !r || (l.updatedAt || 0) > (r.updatedAt || 0)
  })
  return { salvarLocal, enviar }
}

export async function sincronizar() {
  if (!supabaseConfigurado) return { ok: false, motivo: 'não configurado' }
  if (estado.sincronizando) return { ok: false, motivo: 'em andamento' }

  notificar({ sincronizando: true, erro: null })
  try {
    const supabase = obterCliente()
    await garantirSessao(supabase)

    // 1) Baixa tudo (dataset pequeno — síncrono completo).
    const remotos = {}
    for (const nome of TABELAS_ID) {
      const { data, error } = await supabase.from(nome).select('*')
      if (error) throw error
      remotos[nome] = data || []
    }
    const { data: settRemote, error: settErr } = await supabase.from('settings').select('*')
    if (settErr) throw settErr
    remotos.settings = settRemote || []

    // 2) Mescla remoto -> local.
    for (const nome of TABELAS_ID) {
      const locais = await db[nome].toArray()
      if (nome === 'orderItems') {
        const mescladas = planejarItens(locais, remotos[nome])
        if (mescladas.length) await db[nome].bulkPut(mescladas)
      } else {
        const { salvarLocal } = planejarSync(locais, remotos[nome])
        if (salvarLocal.length) await db[nome].bulkPut(salvarLocal)
      }
    }
    {
      const locais = await db.settings.toArray()
      const { salvarLocal } = mergeSettings(locais, remotos.settings)
      if (salvarLocal.length) await db.settings.bulkPut(salvarLocal)
    }

    // 3) Manutenção CRDT: totais derivados + junta comandas duplicadas.
    await recalcularTodos()
    await deduplicarComandas()
    await recalcularTodos()

    // 4) Envia local -> remoto.
    let enviados = 0
    let baixados = 0
    for (const nome of TABELAS_ID) {
      const locais = await db[nome].toArray()
      const remotoPorId = new Map(remotos[nome].map((r) => [r.id, r]))
      let enviar
      if (nome === 'orderItems') {
        enviar = locais.filter((l) => itemPrecisaEnviar(l, remotoPorId.get(l.id)))
      } else {
        enviar = locais.filter((l) => {
          const r = remotoPorId.get(l.id)
          return !r || (l.updatedAt || 0) > (r.updatedAt || 0)
        })
      }
      if (enviar.length) {
        const { error } = await supabase.from(nome).upsert(enviar)
        if (error) throw error
        enviados += enviar.length
      }
      baixados += remotos[nome].length
    }
    {
      const locais = await db.settings.toArray()
      const { enviar } = mergeSettings(locais, remotos.settings)
      if (enviar.length) {
        const { error } = await supabase.from('settings').upsert(enviar)
        if (error) throw error
        enviados += enviar.length
      }
    }

    notificar({ sincronizando: false, ultimaSync: Date.now(), erro: null })
    return { ok: true, enviados, baixados }
  } catch (erro) {
    const message = erro?.message || String(erro)
    notificar({ sincronizando: false, erro: message })
    return { ok: false, erro: message }
  }
}
