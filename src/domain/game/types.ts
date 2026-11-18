/** 지원하는 게임 */
export type GameId = 'maplestory' | 'trickcal'

/**
 * 숙제 유형
 * - check: 체크형 / count: 횟수형 / value: 값 기록형
 * - group: 묶음형 — 하위 숙제들(예: 사용자가 등록한 주간 보스)의 진행률을 합산
 */
export type TaskKind = 'check' | 'count' | 'value' | 'group'

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
