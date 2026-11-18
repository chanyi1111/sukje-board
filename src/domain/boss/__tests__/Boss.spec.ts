import { describe, expect, it } from 'vitest'

import {
  bossToTaskDefinition,
  canAddBoss,
  difficultyLabel,
  isBossDifficulty,
  isDuplicateBossName,
  MAX_BOSSES_PER_CHARACTER,
  validateBossName,
  type Boss,
} from '../Boss'

const boss = (id: string, name: string, order = 0): Boss => ({
  id,
  name,
  difficulty: 'hard',
  order,
  createdAt: new Date(0),
})

describe('Boss 규칙', () => {
  it('빈 이름·20자 초과는 거절', () => {
    expect(validateBossName('  ')).toBe('보스 이름을 입력해주세요.')
    expect(validateBossName('가'.repeat(21))).toBe('보스 이름은 20자 이하로 입력해주세요.')
    expect(validateBossName('스우')).toBeNull()
  })

  it('같은 보스 이름은 난이도와 관계없이 중복 (대소문자·공백 무시)', () => {
    const list = [boss('1', '스우'), boss('2', 'Lucid')]
    expect(isDuplicateBossName(list, ' 스우 ')).toBe(true)
    expect(isDuplicateBossName(list, 'lucid')).toBe(true)
    expect(isDuplicateBossName(list, '데미안')).toBe(false)
  })

  it('수정 시 자기 자신은 중복 검사에서 제외', () => {
    expect(isDuplicateBossName([boss('1', '스우')], '스우', '1')).toBe(false)
  })

  it(`캐릭터당 ${MAX_BOSSES_PER_CHARACTER}개까지만 추가 가능`, () => {
    const eleven = Array.from({ length: 11 }, (_, i) => boss(String(i), `보스${i}`))
    expect(canAddBoss(eleven)).toBe(true)
    expect(canAddBoss([...eleven, boss('x', '보스x')])).toBe(false)
  })

  it('난이도 값 검사와 라벨', () => {
    expect(isBossDifficulty('chaos')).toBe(true)
    expect(isBossDifficulty('hell')).toBe(false)
    expect(difficultyLabel('extreme')).toBe('익스트림')
  })

  it('보스 → 부모 초기화 규칙을 따르는 체크형 하위 숙제 정의', () => {
    const parent = {
      id: 'weekly-boss',
      name: '주간 보스',
      kind: 'group',
      reset: { type: 'weekly', dayOfWeek: 4, hour: 0 },
    } as const
    expect(bossToTaskDefinition(boss('abc', '스우'), parent)).toEqual({
      id: 'boss-abc',
      name: '하드 스우',
      kind: 'check',
      reset: parent.reset,
    })
  })
})
