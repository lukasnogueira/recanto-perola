import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const estado = vi.hoisted(() => ({ modo: 'vazio' }))

vi.mock('../../data/sync/supabase.js', () => ({
  supabaseConfigurado: true,
  obterCliente: () => ({}),
  garantirSessao: async () => null,
}))

vi.mock('../../data/sync/engine.js', () => ({
  puxarOperadores: vi.fn(async () => {
    if (estado.modo === 'offline') throw new Error('offline')
    const { db } = await import('../../data/db.js')
    if (estado.modo === 'com-operador') {
      await db.operators.put({
        id: 'cloud-op',
        nome: 'Gerente da nuvem',
        role: 'gerente',
        ativo: 1,
        salt: 's',
        pinHash: 'x',
        deleted: 0,
        updatedAt: 1,
      })
    }
    return { ok: true }
  }),
}))

import LoginPage from './LoginPage.jsx'
import { AuthProvider } from './AuthProvider.jsx'
import { db } from '../../data/db.js'

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Login — verificação na nuvem', () => {
  beforeEach(async () => {
    localStorage.clear()
    await Promise.all(db.tables.map((t) => t.clear()))
  })

  it('permite criar o primeiro gerente só quando a nuvem está vazia', async () => {
    estado.modo = 'vazio'
    renderLogin()
    expect(await screen.findByText(/Primeiro acesso/i)).toBeInTheDocument()
  })

  it('não deixa criar gerente quando já existe operador na nuvem', async () => {
    estado.modo = 'com-operador'
    renderLogin()
    expect(await screen.findByText(/Digite seu PIN/i)).toBeInTheDocument()
    expect(screen.queryByText(/Primeiro acesso/i)).not.toBeInTheDocument()
  })

  it('bloqueia o primeiro acesso quando está sem conexão', async () => {
    estado.modo = 'offline'
    renderLogin()
    expect(await screen.findByText(/Sem conexão com a nuvem/i)).toBeInTheDocument()
    expect(screen.queryByText(/Primeiro acesso/i)).not.toBeInTheDocument()
  })
})
