import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db.js'
import { supabaseConfigurado } from '../../data/sync/supabase.js'
import { puxarOperadores } from '../../data/sync/engine.js'
import { useAuth } from './AuthProvider.jsx'

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

export default function LoginPage() {
  const total = useLiveQuery(() => db.operators.filter((o) => !o.deleted).count(), [])
  const { operador, entrarPorPin, criarPrimeiroGerente } = useAuth()
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [nome, setNome] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [verificacao, setVerificacao] = useState(supabaseConfigurado ? 'checando' : 'pronto')

  // Antes de permitir "criar o primeiro gerente", confirma na nuvem se já
  // existe algum operador (senão qualquer aparelho poderia criar um gerente).
  useEffect(() => {
    if (!supabaseConfigurado) return
    let ativo = true
    setVerificacao('checando')
    ;(async () => {
      try {
        await puxarOperadores()
        if (ativo) setVerificacao('pronto')
      } catch {
        if (ativo) setVerificacao('sem-conexao')
      }
    })()
    return () => {
      ativo = false
    }
  }, [tentativa])

  if (operador) return <Navigate to="/" replace />

  if (verificacao === 'checando' || total === undefined) {
    return (
      <div className="login">
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">
            🦪
          </span>
          <h1>Recanto Pérola</h1>
          <p className="muted">Verificando…</p>
        </div>
      </div>
    )
  }

  const totalLocal = total

  if (verificacao === 'sem-conexao' && totalLocal === 0) {
    return (
      <div className="login">
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">
            🦪
          </span>
          <h1>Recanto Pérola</h1>
          <p className="muted">Sem conexão com a nuvem</p>
        </div>
        <p className="form-erro">
          Conecte-se à internet para entrar. Não é possível criar um novo gerente sem verificar a
          nuvem.
        </p>
        <button className="btn btn-block" onClick={() => setTentativa((t) => t + 1)}>
          Tentar novamente
        </button>
      </div>
    )
  }

  async function autenticar(pinCompleto) {
    setEntrando(true)
    const res = await entrarPorPin(pinCompleto)
    if (!res.ok) {
      setErro(res.erro)
      setPin('')
      setEntrando(false)
    }
  }

  function teclar(t) {
    if (entrando) return
    if (t === '⌫') return setPin((p) => p.slice(0, -1))
    if (t === '' || pin.length >= 4) return
    setErro('')
    setPin((p) => p + t)
  }

  function teclarLogin(t) {
    if (entrando) return
    if (t === '⌫') return setPin((p) => p.slice(0, -1))
    if (t === '' || pin.length >= 4) return
    setErro('')
    const novo = pin + t
    setPin(novo)
    if (novo.length === 4) autenticar(novo)
  }

  async function salvarPrimeiroAcesso(e) {
    e.preventDefault()
    if (nome.trim().length < 2) return setErro('Informe o nome do gerente.')
    if (pin.length !== 4) return setErro('O PIN precisa ter 4 dígitos.')
    setEntrando(true)
    await criarPrimeiroGerente({ nome, pin })
  }

  if (totalLocal === 0) {
    return (
      <div className="login">
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">
            🦪
          </span>
          <h1>Recanto Pérola</h1>
          <p className="muted">Primeiro acesso — crie o gerente</p>
        </div>

        <form className="stack" onSubmit={salvarPrimeiroAcesso}>
          <label className="field">
            <span className="field-label">Nome do gerente</span>
            <input
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Lucas"
              autoFocus
            />
          </label>

          <div className="field">
            <span className="field-label">PIN de 4 dígitos</span>
            <input
              className="input pin-display"
              value={'•'.repeat(pin.length)}
              readOnly
              inputMode="none"
              aria-label="PIN"
            />
          </div>

          <PinPad onPress={teclar} />

          {erro && <p className="form-erro">{erro}</p>}

          <button className="btn btn-block" type="submit" disabled={entrando}>
            {entrando ? 'Criando…' : 'Criar e entrar'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="login">
      <div className="login-brand">
        <span className="brand-mark" aria-hidden="true">
          🦪
        </span>
        <h1>Recanto Pérola</h1>
        <p className="muted">Digite seu PIN para entrar</p>
      </div>

      <div className="pin-dots" aria-label="Dígitos do PIN">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`pin-dot${pin.length > i ? ' filled' : ''}`} />
        ))}
      </div>

      <p className="form-erro">{erro || '\u00a0'}</p>

      <PinPad onPress={teclarLogin} disabled={entrando} />
    </div>
  )
}

function PinPad({ onPress, disabled }) {
  return (
    <div className="pin-pad">
      {TECLAS.map((t, i) => (
        <button
          key={i}
          type="button"
          className={`pin-key${t === '' ? ' pin-key-empty' : ''}`}
          onClick={() => t !== '' && onPress(t)}
          disabled={disabled || t === ''}
          aria-label={t === '⌫' ? 'Apagar' : t}
        >
          {t}
        </button>
      ))}
    </div>
  )
}
