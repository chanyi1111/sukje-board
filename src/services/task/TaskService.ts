import type { Character } from '@/domain/character/Character'
import { getGame } from '@/domain/game/games'
import type { TaskDefinition } from '@/domain/game/types'
import { createResetStrategy, type ResetStrategy } from '@/domain/period/ResetStrategy'
import type { CheckRepository } from '@/domain/task/CheckRepository'
import type { Task } from '@/domain/task/Task'
import { TaskFactory } from '@/domain/task/TaskFactory'
import { EMPTY_PROGRESS, type TaskAction } from '@/domain/task/TaskProgress'

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

  /** 캐릭터의 게임 숙제 목록을 현재 주기 기준으로 불러온다 */
  async loadBoard(uid: string, character: Character): Promise<TaskItem[]> {
    const now = this.clock()
    const base = getGame(character.gameId).tasks.map((definition) => {
      const strategy = createResetStrategy(definition.reset)
      return {
        definition,
        strategy,
        periodKey: strategy.periodKey(now),
        nextResetAt: strategy.nextResetAt(now),
      }
    })

    // 지금 주기에 해당하는 기록만 조회 → 지난 주기 기록은 자연스럽게 '초기화'되어 보인다
    const periodKeys = [...new Set(base.map((b) => b.periodKey))]
    const checks = await this.repository.listForPeriods(uid, character.id, periodKeys)

    return base.map((b) => {
      const check = checks.find((c) => c.taskId === b.definition.id && c.periodKey === b.periodKey)
      const progress = check ? { count: check.count, value: check.value } : EMPTY_PROGRESS
      return { ...b, task: TaskFactory.create(b.definition, progress) }
    })
  }

  /**
   * 숙제에 동작을 적용하고 저장한다.
   * 화면을 띄워둔 사이 초기화 시각이 지났다면 잠긴(Locked) 숙제로 처리해 저장을 막는다.
   */
  async apply(
    uid: string,
    characterId: string,
    item: TaskItem,
    action: TaskAction,
  ): Promise<TaskItem> {
    const now = this.clock()
    const expired = item.strategy.periodKey(now) !== item.periodKey
    const task = expired
      ? TaskFactory.create(item.definition, item.task.progress, { locked: true })
      : item.task

    const next = task.apply(action) // 규칙 위반이면 TaskRuleError (저장하지 않음)

    await this.repository.save(uid, characterId, {
      taskId: item.definition.id,
      periodKey: item.periodKey,
      count: next.count,
      value: next.value,
      updatedAt: now,
    })

    // 저장 성공 후에만 새 진행 값으로 숙제 객체를 다시 만든다
    return { ...item, task: TaskFactory.create(item.definition, next) }
  }
}
