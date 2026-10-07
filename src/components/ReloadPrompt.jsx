import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

export default function ReloadPrompt() {
  const [offlineReady, setOfflineReady] = useState(false)
  const [needRefresh, setNeedRefresh] = useState(false)
  const [updateSW, setUpdateSW] = useState(null)

  useEffect(() => {
    if (!import.meta.env.PROD) return
    const update = registerSW({
      immediate: true,
      onOfflineReady() {
        setOfflineReady(true)
      },
      onNeedRefresh() {
        setNeedRefresh(true)
      },
    })
    setUpdateSW(() => update)
  }, [])

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="pwa-toast">
      <span className="grow">
        {needRefresh ? 'Nova versão disponível.' : 'Pronto para uso offline !'}
      </span>
      {needRefresh && (
        <button className="btn btn-sm" onClick={() => updateSW?.(true)}>
          Atualizar
        </button>
      )}
      <button
        className="btn btn-sm btn-ghost"
        aria-label="Fechar"
        onClick={() => {
          setOfflineReady(false)
          setNeedRefresh(false)
        }}
      >
        ✕
      </button>
    </div>
  )
}
