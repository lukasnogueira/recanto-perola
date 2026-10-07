import { useOnlineStatus } from '../lib/useOnlineStatus.js'
import { useSyncStatus } from '../features/sync/useSyncStatus.js'

export default function AppHeader() {
  const online = useOnlineStatus()
  const sync = useSyncStatus()

  return (
    <header className="app-header">
      <div className="brand grow">
        <span className="brand-mark" aria-hidden="true">
          🦪
        </span>
        <span>Recanto Pérola</span>
      </div>

      {sync.configurado && (
        <span
          className={`badge ${
            sync.erro ? 'badge-danger' : sync.sincronizando ? 'badge-warning' : 'badge-primary'
          }`}
          title={sync.erro || 'Sincronização em nuvem'}
        >
          {sync.erro ? '☁ ✕' : sync.sincronizando ? '☁ …' : '☁'}
        </span>
      )}

      <span className={`badge ${online ? 'badge-success' : 'badge-warning'}`}>
        <span aria-hidden="true">●</span>
        {online ? 'Online' : 'Offline'}
      </span>
    </header>
  )
}
