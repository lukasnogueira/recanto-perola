// CRDT para as linhas de pedido.
//
// Cada linha tem id determinístico (pedido + produto + observação) e guarda um
// **PN-Counter** por aparelho: `contrib[deviceId] = { inc, dec }`. Isso resolve o
// conflito de dois operadores mexendo na mesma comanda: incrementos de
// aparelhos diferentes se somam e decrementos abatem, sem "perder" atualização.
// A mesclagem é elemento-a-elemento com `max`, que é comutativa, associativa e
// idempotente (convergência garantida), sem depender de relógio.

export function chaveObservacao(obs) {
  return (obs || '').trim().toLowerCase()
}

export function idLinha(orderId, productId, observacao) {
  return `${orderId}::${productId}::${chaveObservacao(observacao)}`
}

export function recomendacaoNova() {
  return { inc: 0, dec: 0 }
}

// Mescla dois mapas de contribuição (PN-Counter) por dispositivo.
export function mesclarContrib(a = {}, b = {}) {
  const saida = {}
  const dispositivos = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const dev of dispositivos) {
    saida[dev] = {
      inc: Math.max(a[dev]?.inc || 0, b[dev]?.inc || 0),
      dec: Math.max(a[dev]?.dec || 0, b[dev]?.dec || 0),
    }
  }
  return saida
}

export function quantidadeLinha(linha) {
  if (!linha) return 0
  if (linha.contrib) {
    let inc = 0
    let dec = 0
    for (const c of Object.values(linha.contrib)) {
      inc += c?.inc || 0
      dec += c?.dec || 0
    }
    return Math.max(0, inc - dec)
  }
  return linha.quantidade || 0
}

// Linhas efetivas (quantidade > 0) de um pedido, com subtotal.
export function linhasDoPedidoDe(itens = []) {
  const mapa = new Map()
  for (const item of itens) {
    const quantidade = quantidadeLinha(item)
    if (quantidade <= 0) continue
    const chave = `${item.productId}::${chaveObservacao(item.observacao)}`
    const existente = mapa.get(chave)
    if (existente) {
      existente.quantidade += quantidade
      if ((item.updatedAt || 0) > (existente.updatedAt || 0)) {
        existente.nome = item.nome
        existente.preco = item.preco
      }
    } else {
      mapa.set(chave, {
        id: item.id,
        productId: item.productId,
        nome: item.nome,
        preco: item.preco,
        observacao: item.observacao || '',
        quantidade,
        updatedAt: item.updatedAt || 0,
      })
    }
  }
  return [...mapa.values()].map((l) => ({ ...l, subtotal: l.preco * l.quantidade }))
}

export function totalQuantidade(itens = []) {
  return itens.reduce((s, i) => s + quantidadeLinha(i), 0)
}

// Agrupa por produto somando observações — usado em relatórios.
export function agruparPorProduto(itens = []) {
  const mapa = new Map()
  for (const item of itens) {
    const quantidade = quantidadeLinha(item)
    if (quantidade <= 0) continue
    const atual = mapa.get(item.productId) || { nome: item.nome, quantidade: 0, total: 0 }
    atual.quantidade += quantidade
    atual.total = Math.round((atual.total + item.preco * quantidade) * 100) / 100
    mapa.set(item.productId, atual)
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total)
}
