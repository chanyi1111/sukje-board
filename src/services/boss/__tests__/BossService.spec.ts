import { beforeEach, describe, expect, it } from 'vitest'

import { BossRuleError, type Boss, type NewBoss } from '@/domain/boss/Boss'
import type { BossRepository } from '@/domain/boss/BossRepository'
import { BOSS_LIMIT_MESSAGE, BossService, DUPLICATE_BOSS_MESSAGE } from '../BossService'

class InMemoryBossRepository implements BossRepository {
  data: Boss[] = []
  private seq = 0

  async list() {
    return [...this.data].sort((a, b) => a.order - b.order)
  }
  async add(_uid: string, _cid: string, input: NewBoss & { order: number }) {
    const boss: Boss = { id: String(++this.seq), ...input, createdAt: new Date() }
    this.data.push(boss)
    return boss
  }
  async update(_uid: string, _cid: string, id: string, changes: NewBoss) {
    this.data = this.data.map((b) => (b.id === id ? { ...b, ...changes } : b))
  }
  async remove(_uid: string, _cid: string, id: string) {
    this.data = this.data.filter((b) => b.id !== id)
  }
  async swapOrder(_uid: string, _cid: string, a: Boss, b: Boss) {
    this.data = this.data.map((x) =>
      x.id === a.id ? { ...x, order: b.order } : x.id === b.id ? { ...x, order: a.order } : x,
    )
  }
}

describe('BossService', () => {
  let repo: InMemoryBossRepository
  let service: BossService
  const add = (name: string, difficulty: NewBoss['difficulty'] = 'hard') =>
    service.add('u1', 'c1', repo.data, { name, difficulty })

  beforeEach(() => {
    repo = new InMemoryBossRepository()
    service = new BossService(repo)
  })

  it('추가할 때마다 맨 뒤 순서를 받는다', async () => {
    await add('스우')
    await add('데미안')
    expect((await repo.list()).map((b) => [b.name, b.order])).toEqual([
      ['스우', 0],
      ['데미안', 1],
    ])
  })

  it('같은 보스를 다른 난이도로 또 등록하면 거절', async () => {
    await add('스우', 'hard')
    await expect(add('스우', 'extreme')).rejects.toThrow(DUPLICATE_BOSS_MESSAGE)
    expect(repo.data).toHaveLength(1)
  })

  it('13번째 보스는 저장하지 않고 거절', async () => {
    for (let i = 0; i < 12; i++) await add(`보스${i}`)
    await expect(add('보스12')).rejects.toThrow(BOSS_LIMIT_MESSAGE)
    expect(repo.data).toHaveLength(12)
  })

  it('수정: 이름·난이도 변경, 다른 보스와 이름이 겹치면 거절', async () => {
    const a = await add('스우')
    await add('데미안')
    await service.update('u1', 'c1', repo.data, a, { name: '스우', difficulty: 'extreme' })
    expect(repo.data[0]?.difficulty).toBe('extreme')
    await expect(
      service.update('u1', 'c1', repo.data, a, { name: '데미안', difficulty: 'hard' }),
    ).rejects.toBeInstanceOf(BossRuleError)
  })

  it('위/아래 이동은 두 보스의 순서를 맞바꾼다, 맨 위에서 위로는 무시', async () => {
    await add('A')
    const b = await add('B')
    expect(await service.move('u1', 'c1', repo.data, b.id, 'up')).toBe(true)
    expect((await repo.list()).map((x) => x.name)).toEqual(['B', 'A'])
    expect(await service.move('u1', 'c1', repo.data, b.id, 'up')).toBe(false)
  })
})
