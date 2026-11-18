import { describe, expect, it } from 'vitest'

import { fromCheckDoc, toCheckDoc } from '../checkAdapter'

describe('checkAdapter', () => {
  it('TaskCheck → 저장 문서', () => {
    const updatedAt = new Date('2026-11-18T06:00:00Z')
    expect(
      toCheckDoc({ taskId: 'pvp', periodKey: 'D2026-11-18', count: 1, value: null, updatedAt }),
    ).toEqual({ taskId: 'pvp', periodKey: 'D2026-11-18', count: 1, value: null, updatedAt })
  })

  it('Timestamp 를 Date 로, 빠진 값은 기본값으로', () => {
    const date = new Date('2026-11-18T06:00:00Z')
    const result = fromCheckDoc({
      taskId: 'theme-dungeon',
      periodKey: 'D2026-11-18',
      updatedAt: { toDate: () => date },
    })
    expect(result).toEqual({
      taskId: 'theme-dungeon',
      periodKey: 'D2026-11-18',
      count: 0,
      value: null,
      updatedAt: date,
    })
  })

  it('필수 값이 없으면 오류', () => {
    expect(() => fromCheckDoc({ periodKey: 'D2026-11-18' })).toThrow()
  })
})
