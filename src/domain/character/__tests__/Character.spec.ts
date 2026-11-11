import { describe, expect, it } from 'vitest'

import { isDuplicateCharacterName, validateCharacterName, type Character } from '../Character'

const make = (id: string, gameId: Character['gameId'], name: string): Character => ({
  id,
  gameId,
  name,
  createdAt: new Date(0),
})

describe('validateCharacterName', () => {
  it('빈 이름은 거절', () => {
    expect(validateCharacterName('   ')).toBe('캐릭터 이름을 입력해주세요.')
  })
  it('20자 초과는 거절', () => {
    expect(validateCharacterName('a'.repeat(21))).toBe('캐릭터 이름은 20자 이하로 입력해주세요.')
  })
  it('앞뒤 공백을 제외하고 20자 이하면 통과', () => {
    expect(validateCharacterName(`  ${'a'.repeat(20)}  `)).toBeNull()
  })
})

describe('isDuplicateCharacterName', () => {
  const list = [make('1', 'maplestory', 'Hero'), make('2', 'trickcal', '버터')]

  it('같은 게임에 같은 이름이 있으면 중복 (대소문자·공백 무시)', () => {
    expect(isDuplicateCharacterName(list, 'maplestory', ' hero ')).toBe(true)
  })
  it('다른 게임의 같은 이름은 중복이 아니다', () => {
    expect(isDuplicateCharacterName(list, 'trickcal', 'Hero')).toBe(false)
  })
  it('이름 수정 시 자기 자신은 제외한다', () => {
    expect(isDuplicateCharacterName(list, 'maplestory', 'Hero', '1')).toBe(false)
  })
})
