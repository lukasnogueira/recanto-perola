import { db } from '../db.js'
import { obterCliente, garantirSessao, supabaseConfigurado } from './supabase.js'
import { planejarSync } from './merge.js'

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

async function sincronizarTabelaId(supabase, nome) {
  const { data: remotos, error } = await supabase.from(nome).select('*')
  if (error) throw error
  const locais = await db[nome].toArray()
  const { salvarLocal, enviar } = planejarSync(locais, remotos || [])
  if (salvarLocal.length) await db[nome].bulkPut(salvarLocal)
  if (enviar.length) {
    const { error: erroEnvio } = await supabase.from(nome).upsert(enviar)
    if (erroEnvio) throw erroEnvio
  }
  return { baixados: salvarLocal.length, enviados: enviar.length }
}

async function sincronizarSettings(supabase) {
  const { data: remotos, error } = await supabase.from('settings').select('*')
  if (error) throw error
  const locais = await db.settings.toArray()
  const localPorChave = new Map(locais.map((r) => [r.key, r]))
  const remotoPorChave = new Map((remotos || []).map((r) => [r.key, r]))

  const salvarLocal = (remotos || []).filter((r) => {
    const l = localPorChave.get(r.key)
    return !l || (r.updatedAt || 0) > (l.updatedAt || 0)
  })
  const enviar = locais.filter((l) => {
    const r = remotoPorChave.get(l.key)
    return !r || (l.updatedAt || 0) > (r.updatedAt || 0)
  })

  if (salvarLocal.length) await db.settings.bulkPut(salvarLocal)
  if (enviar.length) {
    const { error: erroEnvio } = await supabase.from('settings').upsert(enviar)
    if (erroEnvio) throw erroEnvio
  }
  return { baixados: salvarLocal.length, enviados: enviar.length }
}

export async function sincronizar() {
  if (!supabaseConfigurado) return { ok: false, motivo: 'não configurado' }
  if (estado.sincronizando) return { ok: false, motivo: 'em andamento' }

  notificar({ sincronizando: true, erro: null })
  try {
    const supabase = obterCliente()
    await garantirSessao(supabase)

    let baixados = 0
    let enviados = 0
    const detalhe = {}
    for (const nome of TABELAS_ID) {
      const r = await sincronizarTabelaId(supabase, nome)
      baixados += r.baixados
      enviados += r.enviados
      detalhe[nome] = r
    }
    const rs = await sincronizarSettings(supabase)
    baixados += rs.baixados
    enviados += rs.enviados
    detalhe.settings = rs

    notificar({ sincronizando: false, ultimaSync: Date.now(), erro: null })
    return { ok: true, baixados, enviados, detalhe }
  } catch (erro) {
    const message = erro?.message || String(erro)
    notificar({ sincronizando: false, erro: message })
    return { ok: false, erro: message }
  }
}
