import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../data/sync/supabase.js', () => ({
  supabaseConfigurado: false,
  obterCliente: () => null,
  garantirSessao: async () => null,
}))

import App from '../../App.jsx'
import { AuthProvider } from './AuthProvider.jsx'
import { db } from '../../data/db.js'
import { seedDefaults } from '../../data/seed.js'

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function digitaPin(pin) {
  for (const d of pin) {
    fireEvent.click(screen.getByRole('button', { name: d }))
  }
}

describe('fluxo de acesso', () => {
  beforeEach(async () => {
    localStorage.clear()
    await Promise.all(db.tables.map((t) => t.clear()))
    await seedDefaults()
  })

  it('cria o gerente no primeiro acesso e entra no app', async () => {
    renderApp()
    fireEvent.change(await screen.findByLabelText(/nome do gerente/i), {
      target: { value: 'Lucas' },
    })
    await digitaPin('1234')
    fireEvent.click(screen.getByRole('button', { name: /criar e entrar/i }))

    expect(await screen.findByRole('heading', { name: 'Início' })).toBeInTheDocument()
  })

  it('faz login com o PIN cadastrado', async () => {
    const { sha256 } = await import('./pin.js')
    await db.operators.put({
      id: 'op1',
      nome: 'Lucas',
      role: 'gerente',
      ativo: 1,
      salt: 's',
      pinHash: sha256('s:1234'),
      deleted: 0,
      updatedAt: Date.now(),
    })

    renderApp()
    await screen.findByText(/Digite seu PIN/i)
    await digitaPin('1234')

    expect(await screen.findByRole('heading', { name: 'Início' })).toBeInTheDocument()
  })

  it('mostra erro com PIN incorreto e não entra', async () => {
    const { sha256 } = await import('./pin.js')
    await db.operators.put({
      id: 'op1',
      nome: 'Lucas',
      role: 'gerente',
      ativo: 1,
      salt: 's',
      pinHash: sha256('s:1234'),
      deleted: 0,
      updatedAt: Date.now(),
    })

    renderApp()
    await screen.findByText(/Digite seu PIN/i)
    await digitaPin('0000')

    expect(await screen.findByText(/pin incorreto/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Início' })).not.toBeInTheDocument()
  })
})
