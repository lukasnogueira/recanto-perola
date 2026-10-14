import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { db } from '../../data/db.js'
import { operadoresRepo } from '../../data/repositories.js'
import { hashPin, newSalt } from './pin.js'

// Sessão guardada em sessionStorage: dura enquanto o app está aberto e é
// descartada ao fechar/reabrir — assim o PIN é pedido a cada abertura.
const SESSION_KEY = 'recanto:session'
const AuthContext = createContext(null)

function lerSessao() {
  try {
    return sessionStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}
function gravarSessao(id) {
  try {
    sessionStorage.setItem(SESSION_KEY, id)
  } catch {
    /* sem storage: sessão só em memória */
  }
}
function limparSessao() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }) {
  const [operador, setOperador] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    ;(async () => {
      const id = lerSessao()
      if (id) {
        const op = await db.operators.get(id)
        if (op && !op.deleted && op.ativo) {
          setOperador(op)
        } else {
          limparSessao()
        }
      }
      setCarregando(false)
    })()
  }, [])

  const entrarPorPin = useCallback(async (pin, operadorId = null) => {
    const operadores = operadorId
      ? [await db.operators.get(operadorId)].filter(Boolean)
      : await db.operators.filter((o) => !o.deleted && o.ativo).toArray()
    for (const op of operadores) {
      if (op && !op.deleted && op.ativo && (await hashPin(pin, op.salt)) === op.pinHash) {
        gravarSessao(op.id)
        setOperador(op)
        return { ok: true, operador: op }
      }
    }
    return { ok: false, erro: 'PIN incorreto. Tente novamente.' }
  }, [])

  const criarPrimeiroGerente = useCallback(async ({ nome, pin }) => {
    const salt = newSalt()
    const pinHash = await hashPin(pin, salt)
    const op = await operadoresRepo.save({
      nome: nome.trim(),
      role: 'gerente',
      ativo: 1,
      salt,
      pinHash,
    })
    gravarSessao(op.id)
    setOperador(op)
    return op
  }, [])

  const sair = useCallback(() => {
    limparSessao()
    setOperador(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ operador, carregando, entrarPorPin, criarPrimeiroGerente, sair, setOperador }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
