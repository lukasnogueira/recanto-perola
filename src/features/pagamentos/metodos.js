export const METODOS = [
  { id: 'dinheiro', label: 'Dinheiro', emoji: '💵' },
  { id: 'pix', label: 'PIX', emoji: '📱' },
  { id: 'debito', label: 'Débito', emoji: '💳' },
  { id: 'credito', label: 'Crédito', emoji: '💳' },
]

export function rotuloMetodo(id) {
  return METODOS.find((m) => m.id === id)?.label ?? id
}
