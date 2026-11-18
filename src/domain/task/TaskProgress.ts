/**
 * 한 주기 동안의 숙제 진행 값
 * - 체크형: count 0(미완료) / 1(완료)
 * - 횟수형: count 0 ~ max
 * - 값 기록형: value (기록 전 null)
 */
export interface TaskProgress {
  count: number
  value: number | null
}

export const EMPTY_PROGRESS: Readonly<TaskProgress> = Object.freeze({ count: 0, value: null })

/** 사용자가 숙제에 하는 동작 */
export type TaskAction =
  | { type: 'toggle' }
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setValue'; value: number }

/** 숙제 규칙 위반 (저장 요청 전에 걸러짐) */
export class TaskRuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TaskRuleError'
  }
}
