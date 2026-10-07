import { mesclarContrib } from '../itens.js'

// Resolução last-write-wins por updatedAt entre registros locais e remotos.
// Função pura (testável): diz o que gravar localmente e o que enviar ao servidor.
export function planejarSync(locais = [], remotos = []) {
  const localPorId = new Map(locais.map((r) => [r.id, r]))
  const remotoPorId = new Map(remotos.map((r) => [r.id, r]))

  const salvarLocal = remotos.filter((remoto) => {
    const local = localPorId.get(remoto.id)
    return !local || (remoto.updatedAt || 0) > (local.updatedAt || 0)
  })

  const enviar = locais.filter((local) => {
    const remoto = remotoPorId.get(local.id)
    return !remoto || (local.updatedAt || 0) > (remoto.updatedAt || 0)
  })

  return { salvarLocal, enviar }
}

// Mescla uma linha de pedido: PN-Counter nas quantidades + LWW nos metadados.
export function mesclarLinha(local, remoto) {
  if (!local) return remoto
  if (!remoto) return local
  const base = (remoto.updatedAt || 0) > (local.updatedAt || 0) ? remoto : local
  return { ...base, contrib: mesclarContrib(local.contrib, remoto.contrib) }
}

// Mescla toda a lista de itens (convergência garantida, sem perda de adições).
export function planejarItens(locais = [], remotos = []) {
  const localPorId = new Map(locais.map((r) => [r.id, r]))
  const remotoPorId = new Map(remotos.map((r) => [r.id, r]))
  const ids = new Set([...localPorId.keys(), ...remotoPorId.keys()])
  const mescladas = []
  for (const id of ids) {
    mescladas.push(mesclarLinha(localPorId.get(id), remotoPorId.get(id)))
  }
  return mescladas
}

export function contribIgual(a = {}, b = {}) {
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  for (const k of ka) {
    if ((a[k]?.inc || 0) !== (b[k]?.inc || 0)) return false
    if ((a[k]?.dec || 0) !== (b[k]?.dec || 0)) return false
  }
  return true
}

export function itemPrecisaEnviar(mesclado, remoto) {
  if (!remoto) return true
  if (remoto.deleted !== mesclado.deleted) return true
  if ((remoto.observacao || '') !== (mesclado.observacao || '')) return true
  if (remoto.nome !== mesclado.nome || remoto.preco !== mesclado.preco) return true
  return !contribIgual(remoto.contrib, mesclado.contrib)
}
