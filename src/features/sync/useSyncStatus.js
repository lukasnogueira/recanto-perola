import { useEffect, useState } from 'react'
import { assinarSync, estadoSync } from '../../data/sync/engine.js'

export function useSyncStatus() {
  const [estado, setEstado] = useState(estadoSync)
  useEffect(() => assinarSync(setEstado), [])
  return estado
}
