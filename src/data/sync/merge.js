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
