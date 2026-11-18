import { bossToTaskDefinition, type Boss } from '@/domain/boss/Boss'
import type { Character } from '@/domain/character/Character'
import { getGame } from '@/domain/game/games'
import type { TaskDefinition } from '@/domain/game/types'
import { createResetStrategy, type ResetStrategy } from '@/domain/period/ResetStrategy'
import type { CheckRepository } from '@/domain/task/CheckRepository'
import type { TaskCheck } from '@/domain/task/TaskCheck'
import { GroupTask, type Task } from '@/domain/task/Task'
import { TaskFactory } from '@/domain/task/TaskFactory'
import {
  EMPTY_PROGRESS,
  TaskRuleError,
  type TaskAction,
  type TaskProgress,
} from '@/domain/task/TaskProgress'

/** 화면에 보여줄 숙제 한 줄: 숙제 객체 + 어느 주기의 기록인지 */
export interface TaskItem {
  definition: TaskDefinition
  task: Task
  strategy: ResetStrategy
  periodKey: string
  nextResetAt: Date
}

export type Clock = () => Date

/**
 * 숙제 보드 처리 계층
 * 화면 → (이 서비스: 주기 계산·규칙 적용) → CheckRepository(저장)
 */
export class TaskService {
  constructor(
    private readonly repository: CheckRepository,
    private readonly clock: Clock = () => new Date(),
  ) {}

  /**
   * 캐릭터의 게임 숙제 목록을 현재 주기 기준으로 불러온다.
   * bosses: 묶음(group) 숙제의 하위 숙제가 될 사용자 등록 보스 목록
   */
  async loadBoard(
    uid: string,
    character: Character,
    bosses: readonly Boss[] = [],
  ): Promise<TaskItem[]> {
    const now = this.clock()
    const base = getGame(character.gameId).tasks.map((definition) => {
      const strategy = createResetStrategy(definition.reset)
      return {
        definition,
        strategy,
        periodKey: strategy.periodKey(now),
        nextResetAt: strategy.nextResetAt(now),
        childDefinitions:
          definition.kind === 'group' ? bosses.map((b) => bossToTaskDefinition(b, definition)) : [],
      }
    })

    // 지금 주기에 해당하는 기록만 조회 → 지난 주기 기록은 자연스럽게 '초기화'되어 보인다
    const periodKeys = [...new Set(base.map((b) => b.periodKey))]
    const checks = await this.repository.listForPeriods(uid, character.id, periodKeys)
    const progressOf = (taskId: string, periodKey: string): TaskProgress => {
      const check = checks.find((c) => c.taskId === taskId && c.periodKey === periodKey)
      return check ? { count: check.count, value: check.value } : EMPTY_PROGRESS
    }

    return base.map(({ childDefinitions, ...b }) => {
      const children = childDefinitions.map((d) => TaskFactory.create(d, progressOf(d.id, b.periodKey)))
      const task = TaskFactory.create(b.definition, progressOf(b.definition.id, b.periodKey), {
        children,
      })
      return { ...b, task }
    })
  }

  /**
   * 숙제(또는 묶음 숙제의 하위 숙제 childId)에 동작을 적용하고 저장한다.
   * 화면을 띄워둔 사이 초기화 시각이 지났다면 잠긴(Locked) 숙제로 처리해 저장을 막는다.
   */
  async apply(
    uid: string,
    characterId: string,
    item: TaskItem,
    action: TaskAction,
    childId?: string,
  ): Promise<TaskItem> {
    const now = this.clock()
    const expired = item.strategy.periodKey(now) !== item.periodKey

    if (childId === undefined) {
      const updated = await this.applyAndSave(uid, characterId, item.task, item.periodKey, action, expired, now)
      return { ...item, task: updated }
    }

    if (!(item.task instanceof GroupTask)) {
      throw new TaskRuleError('하위 숙제가 없는 숙제입니다.')
    }
    const child = item.task.findChild(childId)
    if (!child) throw new TaskRuleError('숙제를 찾을 수 없습니다. 새로고침해주세요.')

    const updatedChild = await this.applyAndSave(uid, characterId, child, item.periodKey, action, expired, now)
    return { ...item, task: item.task.withChild(updatedChild) }
  }

  private async applyAndSave(
    uid: string,
    characterId: string,
    task: Task,
    periodKey: string,
    action: TaskAction,
    expired: boolean,
    now: Date,
  ): Promise<Task> {
    const target = expired
      ? TaskFactory.create(task.definition, task.progress, { locked: true })
      : task

    const next = target.apply(action) // 규칙 위반이면 TaskRuleError (저장하지 않음)

    const check: TaskCheck = {
      taskId: task.id,
      periodKey,
      count: next.count,
      value: next.value,
      updatedAt: now,
    }
    await this.repository.save(uid, characterId, check)

    // 저장 성공 후에만 새 진행 값으로 숙제 객체를 다시 만든다
    return TaskFactory.create(task.definition, next)
  }
}
