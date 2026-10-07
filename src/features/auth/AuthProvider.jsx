import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { db } from '../../data/db.js'
import { operadoresRepo } from '../../data/repositories.js'
import { hashPin, newSalt } from './pin.js'

const SESSION_KEY = 'recanto:session'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [operador, setOperador] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    ;(async () => {
      const id = localStorage.getItem(SESSION_KEY)
      if (id) {
        const op = await db.operators.get(id)
        if (op && !op.deleted && op.ativo) {
          setOperador(op)
        } else {
          localStorage.removeItem(SESSION_KEY)
        }
      }
      setCarregando(false)
    })()
  }, [])

  const entrarPorPin = useCallback(async (pin) => {
    const operadores = await db.operators.filter((o) => !o.deleted && o.ativo).toArray()
    for (const op of operadores) {
      if ((await hashPin(pin, op.salt)) === op.pinHash) {
        localStorage.setItem(SESSION_KEY, op.id)
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
    localStorage.setItem(SESSION_KEY, op.id)
    setOperador(op)
    return op
  }, [])

  const sair = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
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
