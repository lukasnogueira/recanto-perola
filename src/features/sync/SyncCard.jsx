import { useState } from 'react'
import { useSyncStatus } from './useSyncStatus.js'
import { sincronizar } from '../../data/sync/engine.js'
import { supabaseConfigurado } from '../../data/sync/supabase.js'
import { dataHora } from '../../lib/format.js'

export default function SyncCard() {
  const sync = useSyncStatus()
  const [resultado, setResultado] = useState(null)

  async function agora() {
    setResultado(null)
    setResultado(await sincronizar())
  }

  if (!supabaseConfigurado) {
    return (
      <div className="card stack">
        <h2 className="section-title">☁ Sincronização</h2>
        <p className="muted">
          Nuvem não configurada. O app funciona normalmente em um aparelho, offline.
        </p>
        <p className="muted">
          Para ativar entre vários aparelhos: crie um projeto no Supabase, rode o arquivo{' '}
          <code>supabase/migrations/0001_init.sql</code> e preencha o <code>.env</code>:
        </p>
        <pre className="code">{'VITE_SUPABASE_URL=...\nVITE_SUPABASE_ANON_KEY=...'}</pre>
      </div>
    )
  }

  return (
    <div className="card stack">
      <h2 className="section-title">☁ Sincronização</h2>
      <div className="row-between">
        <span className="muted">Última sincronização</span>
        <span>{sync.ultimaSync ? dataHora(sync.ultimaSync) : '—'}</span>
      </div>
      {sync.erro && <p className="form-erro">{sync.erro}</p>}
      {resultado?.ok && (
        <p className="muted">
          Enviados {resultado.enviados} · Baixados {resultado.baixados}
        </p>
      )}
      {resultado && !resultado.ok && resultado.motivo !== 'em andamento' && (
        <p className="muted">{resultado.motivo}</p>
      )}
      <button className="btn" onClick={agora} disabled={sync.sincronizando}>
        {sync.sincronizando ? 'Sincronizando…' : 'Sincronizar agora'}
      </button>
    </div>
  )
}
