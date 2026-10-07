import { criarPDF } from './pdf.js'
import { brl, dataHora } from './format.js'
import { rotuloMetodo } from '../features/pagamentos/metodos.js'

function tituloPedido(pedido) {
  if (pedido.tipo === 'mesa') {
    return `${pedido.mesaNome || `Mesa ${pedido.mesaNumero}`}${pedido.clienteNome ? ` - ${pedido.clienteNome}` : ''}`
  }
  if (pedido.tipo === 'delivery') return `Delivery - ${pedido.clienteNome || ''}`.trim()
  return `Balcão${pedido.clienteNome ? ` - ${pedido.clienteNome}` : ''}`
}

function rotuloTipo(tipo) {
  return { mesa: 'Mesa', balcao: 'Balcão', delivery: 'Delivery' }[tipo] ?? tipo
}

export function linhasRecibo({ restaurante = {}, pedido, itens = [], pagamentos = [] }) {
  const largura = 595
  const linhas = []
  const direita = largura - 40

  const nome = restaurante.nome || 'Recanto Pérola'
  linhas.push({ texto: nome, tamanho: 18, negrito: true, x: 40 })
  if (restaurante.telefone) linhas.push({ texto: `Telefone: ${restaurante.telefone}`, tamanho: 10 })
  if (restaurante.endereco) linhas.push({ texto: restaurante.endereco, tamanho: 10 })
  linhas.push({ texto: 'COMPROVANTE NÃO FISCAL', tamanho: 10, negrito: true })
  linhas.push({ regua: true })

  linhas.push({ texto: `Tipo: ${rotuloTipo(pedido.tipo)}`, tamanho: 11 })
  linhas.push({ texto: tituloPedido(pedido), tamanho: 11, negrito: true })
  linhas.push({ texto: `Data: ${dataHora(pedido.closedAt || Date.now())}`, tamanho: 10 })
  if (pedido.tipo === 'delivery') {
    if (pedido.clienteTelefone) linhas.push({ texto: `Telefone: ${pedido.clienteTelefone}`, tamanho: 10 })
    if (pedido.endereco) linhas.push({ texto: `Endereço: ${pedido.endereco}`, tamanho: 10 })
  }
  linhas.push({ regua: true })

  linhas.push({ texto: 'ITENS', tamanho: 11, negrito: true })
  for (const item of itens) {
    linhas.push({ texto: `${item.quantidade}x ${item.nome}`, tamanho: 11 })
    linhas.push({ texto: brl(item.preco * item.quantidade), tamanho: 10, x: direita })
    if (item.observacao) linhas.push({ texto: `   obs: ${item.observacao}`, tamanho: 9 })
  }
  linhas.push({ regua: true })

  linhas.push({ texto: `Subtotal: ${brl(pedido.subtotal)}`, tamanho: 11 })
  if (pedido.desconto) linhas.push({ texto: `Desconto: -${brl(pedido.desconto)}`, tamanho: 11 })
  if (pedido.tipo === 'delivery') linhas.push({ texto: `Taxa de entrega: ${brl(pedido.taxaEntrega)}`, tamanho: 11 })
  linhas.push({ texto: `TOTAL: ${brl(pedido.total)}`, tamanho: 15, negrito: true })
  linhas.push({ regua: true })

  linhas.push({ texto: 'PAGAMENTOS', tamanho: 11, negrito: true })
  for (const p of pagamentos) {
    linhas.push({ texto: `${rotuloMetodo(p.metodo)}: ${brl(p.valor)}`, tamanho: 11 })
  }
  const totalPago = pagamentos.reduce((s, p) => s + p.valor, 0)
  const troco = Math.max(0, totalPago - pedido.total)
  if (troco > 0.001) linhas.push({ texto: `Troco: ${brl(troco)}`, tamanho: 11, negrito: true })

  linhas.push({ regua: true })
  linhas.push({ texto: 'Obrigado pela preferência!', tamanho: 11, negrito: true })
  linhas.push({ texto: 'Recanto Pérola', tamanho: 10 })

  return linhas
}

export function gerarReciboPDF(dados) {
  return criarPDF(linhasRecibo(dados))
}

export function nomeArquivoRecibo(pedido) {
  const base = (pedido.mesaNome || pedido.clienteNome || pedido.tipo || 'recibo').toString()
  const limpo = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()
  return `recibo-${limpo || 'recanto'}.pdf`
}
