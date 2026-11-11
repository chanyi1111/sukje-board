import { describe, expect, it } from 'vitest'

import { fromCharacterDoc, toCharacterDoc } from '../characterAdapter'

describe('characterAdapter', () => {
  it('도메인 입력을 저장용 문서로 바꾼다', () => {
    const createdAt = new Date('2026-11-11T00:00:00Z')
    expect(toCharacterDoc({ gameId: 'trickcal', name: '버터' }, createdAt)).toEqual({
      gameId: 'trickcal',
      name: '버터',
      createdAt,
    })
  })

  it('Firestore Timestamp 를 Date 로 바꿔 Character 를 만든다', () => {
    const date = new Date('2026-11-11T05:00:00Z')
    const timestampLike = { toDate: () => date }
    const result = fromCharacterDoc('abc', {
      gameId: 'maplestory',
      name: 'Hero',
      createdAt: timestampLike,
    })
    expect(result).toEqual({ id: 'abc', gameId: 'maplestory', name: 'Hero', createdAt: date })
  })

  it('알 수 없는 게임이면 오류', () => {
    expect(() => fromCharacterDoc('x', { gameId: 'lol', name: 'a', createdAt: new Date() })).toThrow()
  })

  it('이름이 문자열이 아니면 오류', () => {
    expect(() =>
      fromCharacterDoc('x', { gameId: 'maplestory', name: 123, createdAt: new Date() }),
    ).toThrow()
  })
})
