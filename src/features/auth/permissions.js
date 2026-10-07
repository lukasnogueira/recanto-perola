export const PERFIS = {
  gerente: { label: 'Gerente', emoji: '👑' },
  caixa: { label: 'Caixa', emoji: '💰' },
  garcom: { label: 'Garçom', emoji: '🍽️' },
}

const PERMISSOES = {
  gerente: ['*'],
  caixa: ['salao', 'pedidos', 'caixa', 'relatorios', 'fechamento'],
  garcom: ['salao', 'pedidos', 'fechamento'],
}

export function pode(operador, recurso) {
  if (!operador) return false
  const permitidos = PERMISSOES[operador.role] ?? []
  return permitidos.includes('*') || permitidos.includes(recurso)
}
