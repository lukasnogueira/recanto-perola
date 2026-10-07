import { describe, it, expect } from 'vitest'
import { planejarSync } from './merge.js'

const reg = (id, updatedAt, extra = {}) => ({ id, updatedAt, ...extra })

describe('planejarSync (last-write-wins)', () => {
  it('baixa registros que só existem no servidor', () => {
    const { salvarLocal, enviar } = planejarSync([], [reg('a', 10)])
    expect(salvarLocal).toHaveLength(1)
    expect(enviar).toHaveLength(0)
  })

  it('envia registros que só existem localmente', () => {
    const { salvarLocal, enviar } = planejarSync([reg('a', 10)], [])
    expect(salvarLocal).toHaveLength(0)
    expect(enviar).toHaveLength(1)
  })

  it('vence o mais recente (updatedAt maior)', () => {
    const { salvarLocal, enviar } = planejarSync([reg('a', 20)], [reg('a', 10)])
    expect(enviar.map((r) => r.id)).toEqual(['a'])
    expect(salvarLocal).toHaveLength(0)

    const caso2 = planejarSync([reg('a', 5)], [reg('a', 30)])
    expect(caso2.salvarLocal.map((r) => r.id)).toEqual(['a'])
    expect(caso2.enviar).toHaveLength(0)
  })

  it('não faz nada quando os updatedAt são iguais', () => {
    const { salvarLocal, enviar } = planejarSync([reg('a', 10)], [reg('a', 10)])
    expect(salvarLocal).toHaveLength(0)
    expect(enviar).toHaveLength(0)
  })

  it('respeita exclusão suave como qualquer outra mudança', () => {
    const local = [reg('a', 50, { deleted: 1 })]
    const remoto = [reg('a', 10, { deleted: 0 })]
    const { enviar } = planejarSync(local, remoto)
    expect(enviar[0].deleted).toBe(1)
  })
})
