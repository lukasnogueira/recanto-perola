import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './features/auth/AuthProvider.jsx'
import { seedDefaults } from './data/seed.js'

describe('renderização inicial', () => {
  beforeAll(async () => {
    localStorage.clear()
    await seedDefaults()
  })

  it('mostra a tela de primeiro acesso quando não há operadores', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>,
    )
    expect(await screen.findByText(/primeiro acesso/i)).toBeInTheDocument()
  })

  it('gera mesas e categorias no seed', async () => {
    const { db } = await import('./data/db.js')
    const mesas = await db.mesas.filter((t) => !t.deleted).count()
    const cats = await db.categories.count()
    expect(mesas).toBeGreaterThan(0)
    expect(cats).toBeGreaterThan(0)
  })
})
