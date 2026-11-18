import { describe, expect, it } from 'vitest'

import { createResetStrategy, DailyReset, WeeklyReset } from '../ResetStrategy'

/** 한국 시간 문자열로 Date 만들기 */
const kst = (s: string) => new Date(`${s}+09:00`)

describe('DailyReset (트릭컬: 매일 04:00)', () => {
  const daily = new DailyReset(4)

  it('03:59 는 전날 주기, 04:00 부터 새 주기', () => {
    expect(daily.periodKey(kst('2026-11-19T03:59:59'))).toBe('D2026-11-18')
    expect(daily.periodKey(kst('2026-11-19T04:00:00'))).toBe('D2026-11-19')
  })

  it('같은 주기 안에서는 키가 같다 (04:00 ~ 다음날 03:59)', () => {
    expect(daily.periodKey(kst('2026-11-19T04:00:00'))).toBe(
      daily.periodKey(kst('2026-11-20T03:59:00')),
    )
  })

  it('월·연 경계도 올바르게 계산한다', () => {
    expect(daily.periodKey(kst('2027-01-01T03:00:00'))).toBe('D2026-12-31')
    expect(daily.periodKey(kst('2027-01-01T05:00:00'))).toBe('D2027-01-01')
  })

  it('다음 초기화 시각', () => {
    expect(daily.nextResetAt(kst('2026-11-19T03:59:00'))).toEqual(kst('2026-11-19T04:00:00'))
    expect(daily.nextResetAt(kst('2026-11-19T04:00:00'))).toEqual(kst('2026-11-20T04:00:00'))
  })

  it('라벨', () => {
    expect(daily.label).toBe('매일 04:00')
  })
})

describe('WeeklyReset (메이플: 매주 목요일 00:00)', () => {
  const weekly = new WeeklyReset(4, 0)

  it('수요일 23:59 는 지난주, 목요일 00:00 부터 새 주기', () => {
    expect(weekly.periodKey(kst('2026-11-18T23:59:59'))).toBe('W2026-11-12')
    expect(weekly.periodKey(kst('2026-11-19T00:00:00'))).toBe('W2026-11-19')
  })

  it('목요일 ~ 다음 수요일은 같은 주기', () => {
    expect(weekly.periodKey(kst('2026-11-19T12:00:00'))).toBe('W2026-11-19')
    expect(weekly.periodKey(kst('2026-11-25T23:00:00'))).toBe('W2026-11-19')
  })

  it('다음 초기화 시각은 다음 목요일 00:00', () => {
    expect(weekly.nextResetAt(kst('2026-11-18T10:00:00'))).toEqual(kst('2026-11-19T00:00:00'))
    expect(weekly.nextResetAt(kst('2026-11-19T00:00:00'))).toEqual(kst('2026-11-26T00:00:00'))
  })

  it('라벨', () => {
    expect(weekly.label).toBe('매주 목요일 00:00')
  })
})

describe('WeeklyReset (트릭컬 주간퀘: 매주 월요일 04:00)', () => {
  const weekly = new WeeklyReset(1, 4)

  it('월요일 03:59 는 지난주, 04:00 부터 새 주기', () => {
    expect(weekly.periodKey(kst('2026-11-23T03:59:00'))).toBe('W2026-11-16')
    expect(weekly.periodKey(kst('2026-11-23T04:00:00'))).toBe('W2026-11-23')
  })
})

describe('createResetStrategy', () => {
  it('규칙 데이터에 맞는 Strategy 를 만든다', () => {
    expect(createResetStrategy({ type: 'daily', hour: 4 })).toBeInstanceOf(DailyReset)
    expect(createResetStrategy({ type: 'weekly', dayOfWeek: 4, hour: 0 })).toBeInstanceOf(
      WeeklyReset,
    )
  })
})
