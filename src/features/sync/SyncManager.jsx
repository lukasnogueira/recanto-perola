import { useEffect } from 'react'
import { sincronizar } from '../../data/sync/engine.js'
import { obterCliente, garantirSessao, supabaseConfigurado } from '../../data/sync/supabase.js'

const INTERVALO_MS = 60000
const TABELAS_REALTIME = [
  'orders',
  'orderItems',
  'payments',
  'cashSessions',
  'cashMovements',
  'mesas',
]

export default function SyncManager() {
  useEffect(() => {
    if (!supabaseConfigurado) return

    sincronizar()

    const intervalo = setInterval(() => {
      if (navigator.onLine) sincronizar()
    }, INTERVALO_MS)
    const aoVoltar = () => sincronizar()
    window.addEventListener('online', aoVoltar)

    const supabase = obterCliente()
    let canal = null
    let timer = null
    let ativo = true

    const agendar = () => {
      clearTimeout(timer)
      timer = setTimeout(() => sincronizar(), 1000)
    }

    ;(async () => {
      try {
        await garantirSessao(supabase)
        if (!ativo) return
        canal = supabase.channel('recanto-sync')
        for (const tabela of TABELAS_REALTIME) {
          canal.on('postgres_changes', { event: '*', schema: 'public', table: tabela }, agendar)
        }
        canal.subscribe()
      } catch {
        // Realtime indisponível: segue com o sync periódico.
      }
    })()

    return () => {
      ativo = false
      clearTimeout(timer)
      clearInterval(intervalo)
      window.removeEventListener('online', aoVoltar)
      if (canal) supabase.removeChannel(canal)
    }
  }, [])

  return null
}
