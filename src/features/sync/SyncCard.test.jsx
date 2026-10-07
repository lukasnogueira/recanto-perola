import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../data/sync/supabase.js', () => ({
  supabaseConfigurado: false,
  obterCliente: () => null,
  garantirSessao: async () => null,
}))

import SyncCard from './SyncCard.jsx'

describe('SyncCard', () => {
  it('mostra instruções quando a nuvem não está configurada', () => {
    render(
      <MemoryRouter>
        <SyncCard />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Nuvem não configurada/i)).toBeInTheDocument()
    expect(screen.getByText(/VITE_SUPABASE_URL/)).toBeInTheDocument()
  })
})
