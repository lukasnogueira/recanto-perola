import { describe, it, expect } from 'vitest'
import { sha256, hashPin, newSalt } from './pin.js'

describe('pin/sha256', () => {
  it('gera o hash SHA-256 correto de "abc"', () => {
    expect(sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('hashPin é determinístico e sensível ao salt', async () => {
    const salt = 'abc123'
    const a = await hashPin('1234', salt)
    const b = await hashPin('1234', salt)
    const c = await hashPin('1234', 'outro')
    expect(a).toBe(b)
    expect(a).not.toBe(c)
    expect(a).toHaveLength(64)
  })

  it('newSalt gera salts diferentes', () => {
    expect(newSalt()).not.toBe(newSalt())
  })
})
