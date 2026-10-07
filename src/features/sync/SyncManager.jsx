import { useEffect } from 'react'
import { sincronizar } from '../../data/sync/engine.js'
import { supabaseConfigurado } from '../../data/sync/supabase.js'

const INTERVALO_MS = 60000

export default function SyncManager() {
  useEffect(() => {
    if (!supabaseConfigurado) return
    sincronizar()
    const intervalo = setInterval(() => {
      if (navigator.onLine) sincronizar()
    }, INTERVALO_MS)
    const aoVoltar = () => sincronizar()
    window.addEventListener('online', aoVoltar)
    return () => {
      clearInterval(intervalo)
      window.removeEventListener('online', aoVoltar)
    }
  }, [])

  return null
}
