import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PaymentPage from './PaymentPage.jsx'
import { AuthProvider } from '../auth/AuthProvider.jsx'
import { db } from '../../data/db.js'
import * as pedidos from '../../data/pedidos.js'
import * as caixa from '../../data/caixa.js'

function renderPagamento(id) {
  return render(
    <MemoryRouter initialEntries={[`/pagamento/${id}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/pagamento/:id" element={<PaymentPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('PaymentPage — exige caixa aberto', () => {
  beforeEach(async () => {
    localStorage.clear()
    sessionStorage.clear()
    await Promise.all(db.tables.map((t) => t.clear()))
  })

  it('bloqueia o fechamento com caixa fechado e libera após abrir', async () => {
    const pedido = await pedidos.abrirPedidoBalcao()
    await pedidos.adicionarItem(pedido.id, { id: 'p1', nome: 'Espeto', preco: 30 })

    renderPagamento(pedido.id)

    expect((await screen.findAllByText(/Caixa fechado/i)).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Receber e fechar o pedido/i)).not.toBeInTheDocument()

    await caixa.abrirCaixa({ valorAbertura: 100 })

    expect(await screen.findByText(/Receber e fechar o pedido/i)).toBeInTheDocument()
  })
})
