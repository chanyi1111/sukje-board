import type { DayOfWeek, ResetRule } from '@/domain/game/types'

/**
 * [Strategy 패턴] 초기화 규칙
 * - "지금이 어느 주기인가"를 계산하는 방법을 규칙마다 별도 클래스로 분리한다.
 * - 숙제·화면·저장 코드는 ResetStrategy 인터페이스만 알고, 매일/매주 구분을 하지 않는다.
 * - 새 규칙(예: 매월)이 생기면 클래스 하나만 추가하면 된다.
 *
 * 모든 계산은 한국 시간(UTC+9, 서머타임 없음) 기준이다.
 */
export interface ResetStrategy {
  /** now 가 속한 주기의 고유 키 (예: D2026-11-18, W2026-11-19) — 체크 기록 저장 키로 사용 */
  periodKey(now: Date): string
  /** now 이후 처음 돌아오는 초기화 시각 */
  nextResetAt(now: Date): Date
  /** 화면 표시용 설명 (예: "매일 04:00") */
  readonly label: string
}

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const KST_OFFSET_MS = 9 * HOUR_MS
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * 한국 시간 기준으로 "초기화 시각을 0시로 당긴" 가상 시계의 값.
 * 예) 초기화가 04:00 이면 03:59 는 전날 23:59 로, 04:00 은 당일 00:00 으로 바뀐다.
 * 이렇게 하면 주기 경계를 '자정' 하나로 통일해서 계산할 수 있다.
 */
function shiftedMs(now: Date, resetHour: number): number {
  return now.getTime() + KST_OFFSET_MS - resetHour * HOUR_MS
}

/** 가상 시계에서의 '그날 0시' (UTC 필드 기준 계산) */
function startOfShiftedDay(ms: number): number {
  return Math.floor(ms / DAY_MS) * DAY_MS
}

/** 가상 시계 값 → 실제 시각 */
function toRealDate(shifted: number, resetHour: number): Date {
  return new Date(shifted - KST_OFFSET_MS + resetHour * HOUR_MS)
}

function isoDate(shifted: number): string {
  return new Date(shifted).toISOString().slice(0, 10)
}

export class DailyReset implements ResetStrategy {
  readonly label: string

  constructor(private readonly hour: number) {
    this.label = `매일 ${pad2(hour)}:00`
  }

  private periodStartShifted(now: Date): number {
    return startOfShiftedDay(shiftedMs(now, this.hour))
  }

  periodKey(now: Date): string {
    return `D${isoDate(this.periodStartShifted(now))}`
  }

  nextResetAt(now: Date): Date {
    return toRealDate(this.periodStartShifted(now) + DAY_MS, this.hour)
  }
}

export class WeeklyReset implements ResetStrategy {
  readonly label: string

  constructor(
    private readonly dayOfWeek: DayOfWeek,
    private readonly hour: number,
  ) {
    this.label = `매주 ${DAY_NAMES[dayOfWeek]}요일 ${pad2(hour)}:00`
  }

  private periodStartShifted(now: Date): number {
    const dayStart = startOfShiftedDay(shiftedMs(now, this.hour))
    const weekday = new Date(dayStart).getUTCDay()
    const daysSinceReset = (weekday - this.dayOfWeek + 7) % 7
    return dayStart - daysSinceReset * DAY_MS
  }

  periodKey(now: Date): string {
    return `W${isoDate(this.periodStartShifted(now))}`
  }

  nextResetAt(now: Date): Date {
    return toRealDate(this.periodStartShifted(now) + 7 * DAY_MS, this.hour)
  }
}

/** 게임 정의의 ResetRule 데이터 → 알맞은 Strategy 객체 */
export function createResetStrategy(rule: ResetRule): ResetStrategy {
  switch (rule.type) {
    case 'daily':
      return new DailyReset(rule.hour)
    case 'weekly':
      return new WeeklyReset(rule.dayOfWeek, rule.hour)
  }
}
