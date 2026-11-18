import type { TaskDefinition, TaskKind } from '@/domain/game/types'
import { TaskRuleError, type TaskAction, type TaskProgress } from './TaskProgress'
import { DoneState, InProgressState, LockedState, TodoState, type TaskState } from './TaskState'

/**
 * [Template Method 패턴] 숙제 공통 처리 흐름
 * apply() 가 "상태 검사 → 유형별 계산 → 유형별 범위 검사" 순서를 고정하고,
 * 하위 클래스(CheckTask / CountTask / ValueTask)는 계산·검사 단계만 구현한다.
 *
 * 숙제 객체는 불변으로 다룬다: apply() 는 자신을 바꾸지 않고 '다음 진행 값'만 돌려준다.
 * 저장에 성공한 뒤에만 새 진행 값으로 숙제 객체를 다시 만든다 (실패를 성공처럼 보이지 않기 위해).
 */
export abstract class Task {
  constructor(
    readonly definition: TaskDefinition,
    readonly progress: Readonly<TaskProgress>,
    readonly locked: boolean = false,
  ) {}

  get id(): string {
    return this.definition.id
  }
  get name(): string {
    return this.definition.name
  }
  get kind(): TaskKind {
    return this.definition.kind
  }

  /** 현재 진행 값으로 상태 결정 (State 전이) */
  get state(): TaskState {
    if (this.locked) return LockedState
    if (this.isComplete()) return DoneState
    if (this.isStarted()) return InProgressState
    return TodoState
  }

  /** 템플릿 메서드: 처리 순서는 모든 숙제 유형에서 같다 */
  apply(action: TaskAction): TaskProgress {
    const blocked = this.state.guard(action) // 1. 상태가 허용하는 동작인가
    if (blocked) throw new TaskRuleError(blocked)

    const next = this.compute(action) // 2. 유형별 계산 (hook)
    this.validate(next) // 3. 유형별 범위 검사 (hook)
    return next
  }

  protected abstract compute(action: TaskAction): TaskProgress
  protected abstract validate(next: TaskProgress): void

  abstract isComplete(): boolean
  abstract isStarted(): boolean
  /** 진행률 0 ~ 1 */
  abstract progressRatio(): number
  /** 화면 표시용 요약 (예: "3 / 20", "완료", "12,345") */
  abstract summary(): string

  protected unsupported(): never {
    throw new TaskRuleError('이 숙제에서는 지원하지 않는 동작입니다.')
  }
}

/** 체크형: 했다 / 안 했다 */
export class CheckTask extends Task {
  protected compute(action: TaskAction): TaskProgress {
    if (action.type !== 'toggle') return this.unsupported()
    return { count: this.progress.count >= 1 ? 0 : 1, value: null }
  }

  protected validate(next: TaskProgress): void {
    if (next.count !== 0 && next.count !== 1) throw new TaskRuleError('체크 값이 올바르지 않습니다.')
  }

  isComplete() {
    return this.progress.count >= 1
  }
  isStarted() {
    return this.isComplete()
  }
  progressRatio() {
    return this.isComplete() ? 1 : 0
  }
  summary() {
    return this.isComplete() ? '완료' : '미완료'
  }
}

/** 횟수형: 0 ~ max 회 */
export class CountTask extends Task {
  readonly max: number

  constructor(definition: TaskDefinition, progress: Readonly<TaskProgress>, locked = false) {
    super(definition, progress, locked)
    if (!definition.max || definition.max < 1) {
      throw new Error(`횟수형 숙제에는 1 이상의 max 가 필요합니다: ${definition.id}`)
    }
    this.max = definition.max
  }

  protected compute(action: TaskAction): TaskProgress {
    switch (action.type) {
      case 'increment':
        return { count: this.progress.count + 1, value: null }
      case 'decrement':
        return { count: this.progress.count - 1, value: null }
      case 'toggle': // 한 번에 완료 ↔ 0 회
        return { count: this.isComplete() ? 0 : this.max, value: null }
      default:
        return this.unsupported()
    }
  }

  protected validate(next: TaskProgress): void {
    if (!Number.isInteger(next.count) || next.count < 0) {
      throw new TaskRuleError('횟수는 0 미만이 될 수 없습니다.')
    }
    if (next.count > this.max) throw new TaskRuleError(`최대 ${this.max}회까지만 기록할 수 있습니다.`)
  }

  isComplete() {
    return this.progress.count >= this.max
  }
  isStarted() {
    return this.progress.count > 0
  }
  progressRatio() {
    return Math.min(this.progress.count / this.max, 1)
  }
  summary() {
    return `${this.progress.count} / ${this.max}`
  }
}

export const VALUE_MAX = 1_000_000_000

/** 값 기록형: 점수 등 0 이상의 숫자 */
export class ValueTask extends Task {
  protected compute(action: TaskAction): TaskProgress {
    if (action.type !== 'setValue') return this.unsupported()
    return { count: 0, value: action.value }
  }

  protected validate(next: TaskProgress): void {
    const { value } = next
    if (value === null || !Number.isFinite(value) || value < 0) {
      throw new TaskRuleError('0 이상의 숫자를 입력해주세요.')
    }
    if (value > VALUE_MAX) throw new TaskRuleError('입력할 수 있는 최대값을 넘었습니다.')
  }

  isComplete() {
    return this.progress.value !== null
  }
  isStarted() {
    return this.isComplete()
  }
  progressRatio() {
    return this.isComplete() ? 1 : 0
  }
  summary() {
    return this.progress.value === null ? '기록 없음' : this.progress.value.toLocaleString('ko-KR')
  }
}
