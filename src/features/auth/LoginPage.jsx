import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db.js'
import { supabaseConfigurado } from '../../data/sync/supabase.js'
import { puxarOperadores } from '../../data/sync/engine.js'
import { PERFIS } from './permissions.js'
import { useAuth } from './AuthProvider.jsx'

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

export default function LoginPage() {
  const operadores = useLiveQuery(
    () => db.operators.filter((o) => !o.deleted && o.ativo).toArray(),
    [],
  )
  const { operador, entrarPorPin, criarPrimeiroGerente } = useAuth()
  const [selecionado, setSelecionado] = useState(null)
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [nome, setNome] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [verificacao, setVerificacao] = useState(supabaseConfigurado ? 'checando' : 'pronto')

  // Confirma na nuvem se já existe operador antes de permitir criar o "primeiro".
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

  const lista = operadores ?? []

  if (verificacao === 'checando' || operadores === undefined) {
    return (
      <div className="login">
        <Brand />
        <p className="muted">Verificando…</p>
      </div>
    )
  }

  if (verificacao === 'sem-conexao' && lista.length === 0) {
    return (
      <div className="login">
        <Brand subtitulo="Sem conexão com a nuvem" />
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

  async function autenticar(pinCompleto, operadorId) {
    setEntrando(true)
    const res = await entrarPorPin(pinCompleto, operadorId)
    if (!res.ok) {
      setErro(res.erro)
      setPin('')
      setEntrando(false)
    }
  }

  function teclar(t, operadorId) {
    if (entrando) return
    if (t === '⌫') return setPin((p) => p.slice(0, -1))
    if (t === '' || pin.length >= 4) return
    setErro('')
    const novo = pin + t
    setPin(novo)
    if (novo.length === 4) autenticar(novo, operadorId)
  }

  async function salvarPrimeiroAcesso(e) {
    e.preventDefault()
    if (nome.trim().length < 2) return setErro('Informe o nome do gerente.')
    if (pin.length !== 4) return setErro('O PIN precisa ter 4 dígitos.')
    setEntrando(true)
    await criarPrimeiroGerente({ nome, pin })
  }

  // Primeiro acesso: nenhum operador local nem na nuvem.
  if (lista.length === 0) {
    return (
      <div className="login">
        <Brand subtitulo="Primeiro acesso — crie o gerente" />
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
          <label className="field">
            <span className="field-label">PIN de 4 dígitos</span>
            <input
              className="input pin-display"
              value={'•'.repeat(pin.length)}
              readOnly
              inputMode="none"
              aria-label="PIN"
            />
          </label>
          <PinPad onPress={(t) => teclarPrimeiro(t)} />
          {erro && <p className="form-erro">{erro}</p>}
          <button className="btn btn-block" type="submit" disabled={entrando}>
            {entrando ? 'Criando…' : 'Criar e entrar'}
          </button>
        </form>
      </div>
    )
  }

  function teclarPrimeiro(t) {
    if (entrando) return
    if (t === '⌫') return setPin((p) => p.slice(0, -1))
    if (t === '' || pin.length >= 4) return
    setErro('')
    setPin((p) => p + t)
  }

  const escolhido =
    lista.find((o) => o.id === selecionado) || (lista.length === 1 ? lista[0] : null)

  // Passo 2: PIN do operador escolhido.
  if (escolhido) {
    const perfil = PERFIS[escolhido.role] ?? { label: escolhido.role, emoji: '👤' }
    return (
      <div className="login">
        <Brand subtitulo="Digite seu PIN" />
        <div className="login-user">
          <span className="avatar" aria-hidden="true">
            {perfil.emoji}
          </span>
          <strong>{escolhido.nome}</strong>
          <span className="muted">{perfil.label}</span>
        </div>
        <div className="pin-dots" aria-label="Dígitos do PIN">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`pin-dot${pin.length > i ? ' filled' : ''}`} />
          ))}
        </div>
        <p className="form-erro">{erro || '\u00a0'}</p>
        <PinPad onPress={(t) => teclar(t, escolhido.id)} disabled={entrando} />
        {lista.length > 1 && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setSelecionado(null)
              setPin('')
              setErro('')
            }}
          >
            Trocar operador
          </button>
        )}
      </div>
    )
  }

  // Passo 1: escolher o operador.
  return (
    <div className="login">
      <Brand subtitulo="Quem está entrando?" />
      <div className="login-users">
        {lista.map((op) => {
          const perfil = PERFIS[op.role] ?? { label: op.role, emoji: '👤' }
          return (
            <button
              key={op.id}
              className="login-user-item"
              onClick={() => {
                setSelecionado(op.id)
                setPin('')
                setErro('')
              }}
            >
              <span className="avatar" aria-hidden="true">
                {perfil.emoji}
              </span>
              <span className="grow" style={{ textAlign: 'left' }}>
                <strong>{op.nome}</strong>
                <span className="muted comanda-sub">{perfil.label}</span>
              </span>
              <span aria-hidden="true">›</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Brand({ subtitulo }) {
  return (
    <div className="login-brand">
      <span className="brand-mark" aria-hidden="true">
        🦪
      </span>
      <h1>Recanto Pérola</h1>
      {subtitulo && <p className="muted">{subtitulo}</p>}
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
