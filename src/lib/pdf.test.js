import { describe, it, expect } from 'vitest'
import { criarPDF } from './pdf.js'
import { linhasRecibo, gerarReciboPDF } from './recibo.js'

describe('pdf', () => {
  it('gera um Blob application/pdf não vazio', async () => {
    const blob = criarPDF([{ texto: 'Olá, ção ações', negrito: true }, { regua: true }, { texto: 'linha' }])
    expect(blob.type).toBe('application/pdf')
    expect(blob.size).toBeGreaterThan(100)
    const texto = await blob.text()
    expect(texto.startsWith('%PDF-1.4')).toBe(true)
    expect(texto).toContain('%%EOF')
  })

  it('monta o recibo com total e pagamentos', () => {
    const pedido = {
      tipo: 'mesa',
      mesaNome: 'Mesa 3',
      clienteNome: 'João',
      subtotal: 100,
      desconto: 0,
      taxaEntrega: 0,
      total: 100,
      closedAt: Date.now(),
    }
    const linhas = linhasRecibo({
      restaurante: { nome: 'Recanto Pérola' },
      pedido,
      itens: [{ quantidade: 2, nome: 'Moqueca', preco: 50 }],
      pagamentos: [{ metodo: 'dinheiro', valor: 100 }],
    })
    const texto = linhas.map((l) => l.texto || '').join(' ')
    expect(texto).toContain('Mesa 3')
    expect(texto).toContain('TOTAL')
    expect(texto).toContain('Dinheiro')

    const blob = gerarReciboPDF({ restaurante: {}, pedido, itens: [], pagamentos: [] })
    expect(blob.size).toBeGreaterThan(100)
  })
})
