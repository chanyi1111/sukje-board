import { beforeEach, describe, expect, it } from 'vitest'

import type { Character } from '@/domain/character/Character'
import type { CheckRepository } from '@/domain/task/CheckRepository'
import type { TaskCheck } from '@/domain/task/TaskCheck'
import { TaskRuleError } from '@/domain/task/TaskProgress'
import { TaskService } from '../TaskService'

class InMemoryCheckRepository implements CheckRepository {
  saved: TaskCheck[] = []

  async listForPeriods(_uid: string, _characterId: string, periodKeys: string[]) {
    return this.saved.filter((c) => periodKeys.includes(c.periodKey))
  }
  async save(_uid: string, _characterId: string, check: TaskCheck) {
    this.saved = this.saved.filter(
      (c) => !(c.taskId === check.taskId && c.periodKey === check.periodKey),
    )
    this.saved.push(check)
  }
}

const kst = (s: string) => new Date(`${s}+09:00`)
const trickcal: Character = { id: 'c1', gameId: 'trickcal', name: '버터', createdAt: new Date(0) }

describe('TaskService', () => {
  let repo: InMemoryCheckRepository
  let now: Date
  let service: TaskService

  beforeEach(() => {
    repo = new InMemoryCheckRepository()
    now = kst('2026-11-19T10:00:00')
    service = new TaskService(repo, () => now)
  })

  it('게임 정의의 숙제 목록을 현재 주기 기준으로 만든다', async () => {
    const board = await service.loadBoard('u1', trickcal)
    const theme = board.find((i) => i.definition.id === 'theme-dungeon')
    expect(theme?.periodKey).toBe('D2026-11-19')
    expect(theme?.task.progress.count).toBe(0)
  })

  it('동작을 적용하면 저장하고 새 진행 값을 돌려준다', async () => {
    const board = await service.loadBoard('u1', trickcal)
    const theme = board.find((i) => i.definition.id === 'theme-dungeon')!
    const updated = await service.apply('u1', 'c1', theme, { type: 'increment' })

    expect(updated.task.progress.count).toBe(1)
    expect(repo.saved).toHaveLength(1)
    expect(repo.saved[0]).toMatchObject({ taskId: 'theme-dungeon', periodKey: 'D2026-11-19', count: 1 })
  })

  it('다음 날 04:00 이 지나면 새 주기로 보여 체크가 초기화된다', async () => {
    const board = await service.loadBoard('u1', trickcal)
    const pvp = board.find((i) => i.definition.id === 'pvp')!
    await service.apply('u1', 'c1', pvp, { type: 'toggle' })

    now = kst('2026-11-20T04:00:00')
    const nextDay = await service.loadBoard('u1', trickcal)
    expect(nextDay.find((i) => i.definition.id === 'pvp')?.task.isComplete()).toBe(false)
  })

  it('화면을 띄워둔 사이 초기화 시각이 지나면 저장하지 않고 거절한다', async () => {
    const board = await service.loadBoard('u1', trickcal)
    const pvp = board.find((i) => i.definition.id === 'pvp')!

    now = kst('2026-11-20T04:00:01')
    await expect(service.apply('u1', 'c1', pvp, { type: 'toggle' })).rejects.toBeInstanceOf(
      TaskRuleError,
    )
    expect(repo.saved).toHaveLength(0)
  })

  it('규칙 위반(최대치 초과)이면 저장하지 않는다', async () => {
    const board = await service.loadBoard('u1', trickcal)
    let theme = board.find((i) => i.definition.id === 'theme-dungeon')!
    theme = await service.apply('u1', 'c1', theme, { type: 'toggle' }) // 20회 채움

    await expect(service.apply('u1', 'c1', theme, { type: 'increment' })).rejects.toThrow(
      '이미 최대 횟수를 채웠습니다.',
    )
    expect(repo.saved).toHaveLength(1)
  })
})
