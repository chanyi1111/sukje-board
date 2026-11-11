/** 지원하는 게임 */
export type GameId = 'maplestory' | 'trickcal'

/** 숙제 유형: 체크형 / 횟수형 / 값 기록형 */
export type TaskKind = 'check' | 'count' | 'value'

/** 요일: 0=일 ~ 6=토 (Date#getDay 와 동일) */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** 초기화 규칙: 매일 hour시 / 매주 dayOfWeek요일 hour시 (한국 시간 기준) */
export type ResetRule =
  | { type: 'daily'; hour: number }
  | { type: 'weekly'; dayOfWeek: DayOfWeek; hour: number }

export interface TaskDefinition {
  id: string
  name: string
  kind: TaskKind
  reset: ResetRule
  /** kind === 'count' 일 때 최대 횟수 */
  max?: number
}

export interface GameDefinition {
  id: GameId
  name: string
  tasks: readonly TaskDefinition[]
}
