export function brl(value) {
  return (Number(value) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function numero(value, casas = 0) {
  return (Number(value) || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })
}

export function dataHora(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function apenasData(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function apenasHora(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function hoje() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function uid() {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') {
    try {
      return c.randomUUID()
    } catch {
      // contexto não-seguro
    }
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
