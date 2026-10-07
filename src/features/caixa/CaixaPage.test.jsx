import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CaixaPage from './CaixaPage.jsx'
import { AuthProvider } from '../auth/AuthProvider.jsx'
import { db } from '../../data/db.js'

describe('CaixaPage', () => {
  beforeEach(async () => {
    localStorage.clear()
    await Promise.all(db.tables.map((t) => t.clear()))
  })

  it('mostra a tela de abrir caixa quando não há sessão', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CaixaPage />
        </AuthProvider>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('button', { name: 'Abrir caixa' })).toBeInTheDocument()
  })
})
