import { describe, expect, it } from 'vitest'

import type { TaskDefinition } from '@/domain/game/types'
import { CheckTask, CountTask, ValueTask } from '../Task'
import { TaskFactory } from '../TaskFactory'
import { TaskRuleError } from '../TaskProgress'

const daily = { type: 'daily', hour: 4 } as const
const checkDef: TaskDefinition = { id: 'pvp', name: 'PvP', kind: 'check', reset: daily }
const countDef: TaskDefinition = { id: 'theme', name: '테마던전', kind: 'count', max: 3, reset: daily }
const valueDef: TaskDefinition = { id: 'score', name: '수로', kind: 'value', reset: daily }

describe('TaskFactory', () => {
  it('숙제 유형에 맞는 객체를 만든다', () => {
    expect(TaskFactory.create(checkDef)).toBeInstanceOf(CheckTask)
    expect(TaskFactory.create(countDef)).toBeInstanceOf(CountTask)
    expect(TaskFactory.create(valueDef)).toBeInstanceOf(ValueTask)
  })

  it('진행 값이 없으면 미완료 상태로 시작한다', () => {
    expect(TaskFactory.create(countDef).state.name).toBe('todo')
  })
})

describe('CheckTask', () => {
  it('toggle 로 완료 ↔ 미완료', () => {
    const task = TaskFactory.create(checkDef)
    const done = task.apply({ type: 'toggle' })
    expect(done.count).toBe(1)
    expect(TaskFactory.create(checkDef, done).apply({ type: 'toggle' }).count).toBe(0)
  })

  it('지원하지 않는 동작은 거절', () => {
    expect(() => TaskFactory.create(checkDef).apply({ type: 'increment' })).toThrow(TaskRuleError)
  })
})

describe('CountTask', () => {
  it('+1 / -1 과 상태 전이: todo → in-progress → done', () => {
    let task = TaskFactory.create(countDef)
    expect(task.state.name).toBe('todo')

    task = TaskFactory.create(countDef, task.apply({ type: 'increment' }))
    expect(task.state.name).toBe('in-progress')
    expect(task.summary()).toBe('1 / 3')

    task = TaskFactory.create(countDef, { count: 3, value: null })
    expect(task.state.name).toBe('done')
    expect(task.progressRatio()).toBe(1)
  })

  it('0 에서 -1 은 거절 (미완료 상태가 막음)', () => {
    expect(() => TaskFactory.create(countDef).apply({ type: 'decrement' })).toThrow(
      '아직 진행한 횟수가 없습니다.',
    )
  })

  it('최대치에서 +1 은 거절 (완료 상태가 막음)', () => {
    const full = TaskFactory.create(countDef, { count: 3, value: null })
    expect(() => full.apply({ type: 'increment' })).toThrow('이미 최대 횟수를 채웠습니다.')
  })

  it('toggle 은 한 번에 최대치 ↔ 0', () => {
    expect(TaskFactory.create(countDef).apply({ type: 'toggle' }).count).toBe(3)
    expect(
      TaskFactory.create(countDef, { count: 3, value: null }).apply({ type: 'toggle' }).count,
    ).toBe(0)
  })

  it('apply 는 원래 숙제 객체를 바꾸지 않는다', () => {
    const task = TaskFactory.create(countDef)
    task.apply({ type: 'increment' })
    expect(task.progress.count).toBe(0)
  })

  it('max 가 없는 횟수형 정의는 생성 오류', () => {
    expect(() => TaskFactory.create({ ...countDef, max: undefined })).toThrow()
  })
})

describe('ValueTask', () => {
  it('0 이상의 값을 기록한다', () => {
    const next = TaskFactory.create(valueDef).apply({ type: 'setValue', value: 12345 })
    expect(next.value).toBe(12345)
    expect(TaskFactory.create(valueDef, next).summary()).toBe('12,345')
  })

  it('음수는 거절', () => {
    expect(() => TaskFactory.create(valueDef).apply({ type: 'setValue', value: -1 })).toThrow(
      TaskRuleError,
    )
  })
})

describe('LockedState (지난 주기)', () => {
  it('잠긴 숙제는 어떤 동작도 거절한다', () => {
    const locked = TaskFactory.create(checkDef, undefined, { locked: true })
    expect(locked.state.name).toBe('locked')
    expect(() => locked.apply({ type: 'toggle' })).toThrow(TaskRuleError)
  })
})
