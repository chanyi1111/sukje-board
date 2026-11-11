import { describe, expect, it } from 'vitest'

import { DataError, DEFAULT_DATA_ERROR_MESSAGE, toDataError } from '../firestoreErrors'

describe('toDataError', () => {
  it('권한 거부 코드를 안내 메시지로 바꾼다', () => {
    const error = toDataError({ code: 'permission-denied' })
    expect(error).toBeInstanceOf(DataError)
    expect(error.message).toBe('이 데이터에 접근할 권한이 없습니다.')
  })

  it('firestore/ 접두사가 붙은 코드도 처리한다', () => {
    expect(toDataError({ code: 'firestore/unavailable' }).code).toBe('unavailable')
  })

  it('모르는 오류는 기본 메시지', () => {
    expect(toDataError(new Error('boom')).message).toBe(DEFAULT_DATA_ERROR_MESSAGE)
  })
})
