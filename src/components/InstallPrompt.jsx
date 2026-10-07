import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [evento, setEvento] = useState(null)
  const [dispensado, setDispensado] = useState(false)

  useEffect(() => {
    function aoPoderInstalar(e) {
      e.preventDefault()
      setEvento(e)
    }
    function instalado() {
      setEvento(null)
    }
    window.addEventListener('beforeinstallprompt', aoPoderInstalar)
    window.addEventListener('appinstalled', instalado)
    return () => {
      window.removeEventListener('beforeinstallprompt', aoPoderInstalar)
      window.removeEventListener('appinstalled', instalado)
    }
  }, [])

  if (!evento || dispensado) return null

  async function instalar() {
    evento.prompt()
    await evento.userChoice
    setEvento(null)
    setDispensado(true)
  }

  return (
    <div className="install-bar">
      <span className="grow">📲 Instale o app na tela inicial</span>
      <button className="btn btn-sm" onClick={instalar}>
        Instalar
      </button>
      <button className="icon-btn install-close" aria-label="Dispensar" onClick={() => setDispensado(true)}>
        ✕
      </button>
    </div>
  )
}
