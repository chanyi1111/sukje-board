import { describe, expect, it } from 'vitest'

import { fromBossDoc, toBossDoc } from '../bossAdapter'

describe('bossAdapter', () => {
  it('저장 문서 ↔ Boss 변환', () => {
    const createdAt = new Date('2026-11-18T08:00:00Z')
    const doc = toBossDoc({ name: '스우', difficulty: 'hard', order: 2 }, createdAt)
    expect(doc).toEqual({ name: '스우', difficulty: 'hard', order: 2, createdAt })
    expect(fromBossDoc('b1', { ...doc, createdAt: { toDate: () => createdAt } })).toEqual({
      id: 'b1',
      name: '스우',
      difficulty: 'hard',
      order: 2,
      createdAt,
    })
  })

  it('알 수 없는 난이도는 오류', () => {
    expect(() => fromBossDoc('b1', { name: '스우', difficulty: 'hell', order: 0 })).toThrow()
  })
})
