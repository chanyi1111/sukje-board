import { describe, expect, it } from 'vitest'

import type { TaskDefinition } from '@/domain/game/types'
import { GroupTask } from '../Task'
import { TaskFactory } from '../TaskFactory'
import { TaskRuleError } from '../TaskProgress'

const weekly = { type: 'weekly', dayOfWeek: 4, hour: 0 } as const
const groupDef: TaskDefinition = { id: 'weekly-boss', name: '주간 보스', kind: 'group', reset: weekly }
const child = (id: string, done: boolean) =>
  TaskFactory.create(
    { id, name: id, kind: 'check', reset: weekly },
    { count: done ? 1 : 0, value: null },
  )

describe('GroupTask (Composite)', () => {
  it('Factory 가 group 유형으로 GroupTask 를 만든다', () => {
    expect(TaskFactory.create(groupDef, undefined, { children: [] })).toBeInstanceOf(GroupTask)
  })

  it('진행률 = 완료한 하위 숙제 수 / 전체', () => {
    const group = TaskFactory.create(groupDef, undefined, {
      children: [child('a', true), child('b', true), child('c', false)],
    })
    expect(group.summary()).toBe('2 / 3')
    expect(group.progressRatio()).toBeCloseTo(2 / 3)
    expect(group.state.name).toBe('in-progress')
  })

  it('하위 숙제를 모두 완료하면 묶음도 완료', () => {
    const group = TaskFactory.create(groupDef, undefined, {
      children: [child('a', true), child('b', true)],
    })
    expect(group.isComplete()).toBe(true)
    expect(group.state.name).toBe('done')
  })

  it('하위 숙제가 없으면 미완료(0 / 0)', () => {
    const group = TaskFactory.create(groupDef, undefined, { children: [] })
    expect(group.isComplete()).toBe(false)
    expect(group.summary()).toBe('0 / 0')
    expect(group.state.name).toBe('todo')
  })

  it('withChild 는 자식 하나만 바꾼 새 묶음을 돌려준다 (원본 불변)', () => {
    const group = new GroupTask(groupDef, [child('a', false), child('b', false)])
    const updated = group.withChild(child('a', true))
    expect(updated.summary()).toBe('1 / 2')
    expect(group.summary()).toBe('0 / 2')
  })

  it('묶음 자체에는 동작을 적용할 수 없다', () => {
    const group = new GroupTask(groupDef, [child('a', false)])
    expect(() => group.apply({ type: 'toggle' })).toThrow(TaskRuleError)
  })
})
