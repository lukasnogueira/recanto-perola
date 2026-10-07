import { criarPDF } from './pdf.js'
import { brl } from './format.js'
import { rotuloMetodo } from '../features/pagamentos/metodos.js'

function dataBR(dataStr) {
  const [a, m, d] = dataStr.split('-')
  return `${d}/${m}/${a}`
}

export function nomeArquivoRelatorio(dataStr) {
  return `relatorio-${dataStr}.pdf`
}

export function gerarRelatorioPDF({ dataStr, resumo, restaurante }) {
  const direita = 520
  const linhas = []

  linhas.push({ texto: restaurante?.nome || 'Recanto Pérola', tamanho: 16, negrito: true })
  linhas.push({ texto: `Relatório do dia ${dataBR(dataStr)}`, tamanho: 11 })
  linhas.push({ regua: true })

  linhas.push({ texto: `Vendas do dia: ${brl(resumo.totalVendas)}`, tamanho: 13, negrito: true })
  linhas.push({ texto: `Pedidos: ${resumo.qtdPedidos}    Itens: ${resumo.totalItens}` })
  linhas.push({ texto: `Ticket médio: ${brl(resumo.ticketMedio)}` })
  linhas.push({ regua: true })

  linhas.push({ texto: 'POR FORMA DE PAGAMENTO', tamanho: 11, negrito: true })
  const metodos = Object.entries(resumo.porMetodo)
  if (metodos.length === 0) linhas.push({ texto: 'Sem pagamentos.' })
  for (const [metodo, valor] of metodos) {
    linhas.push({ texto: rotuloMetodo(metodo) })
    linhas.push({ texto: brl(valor), x: direita })
  }
  linhas.push({ regua: true })

  linhas.push({ texto: 'POR TIPO', tamanho: 11, negrito: true })
  linhas.push({ texto: 'Mesa' })
  linhas.push({ texto: brl(resumo.porTipo.mesa), x: direita })
  linhas.push({ texto: 'Balcão' })
  linhas.push({ texto: brl(resumo.porTipo.balcao), x: direita })
  linhas.push({ texto: 'Delivery' })
  linhas.push({ texto: brl(resumo.porTipo.delivery), x: direita })
  linhas.push({ regua: true })

  linhas.push({ texto: 'PRODUTOS VENDIDOS', tamanho: 11, negrito: true })
  if (resumo.porProduto.length === 0) linhas.push({ texto: 'Nenhum produto vendido.' })
  for (const p of resumo.porProduto) {
    linhas.push({ texto: `${p.quantidade}x ${p.nome}` })
    linhas.push({ texto: brl(p.total), x: direita })
  }
  linhas.push({ regua: true })
  linhas.push({ texto: 'Recanto Pérola', tamanho: 10 })

  return criarPDF(linhas)
}
