import { describe, expect, it } from 'vitest'

import { GAMES, getGame, isGameId } from '../games'

describe('게임 정의 데이터', () => {
  it('게임 id 가 중복되지 않는다', () => {
    const ids = GAMES.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('게임마다 숙제 id 가 중복되지 않는다', () => {
    for (const game of GAMES) {
      const ids = game.tasks.map((t) => t.id)
      expect(new Set(ids).size, game.id).toBe(ids.length)
    }
  })

  it('횟수형 숙제는 1 이상의 최대 횟수를 가진다', () => {
    for (const game of GAMES) {
      for (const task of game.tasks.filter((t) => t.kind === 'count')) {
        expect(task.max, `${game.id}/${task.id}`).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('초기화 시각은 0~23시 범위다', () => {
    for (const game of GAMES) {
      for (const task of game.tasks) {
        expect(task.reset.hour).toBeGreaterThanOrEqual(0)
        expect(task.reset.hour).toBeLessThanOrEqual(23)
      }
    }
  })

  it('트릭컬 일일 숙제는 매일 04:00 에 초기화된다', () => {
    const theme = getGame('trickcal').tasks.find((t) => t.id === 'theme-dungeon')
    expect(theme?.reset).toEqual({ type: 'daily', hour: 4 })
    expect(theme?.max).toBe(20)
  })

  it('isGameId 는 지원하는 게임만 true', () => {
    expect(isGameId('maplestory')).toBe(true)
    expect(isGameId('trickcal')).toBe(true)
    expect(isGameId('lol')).toBe(false)
    expect(isGameId(undefined)).toBe(false)
  })
})
