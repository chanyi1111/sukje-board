import { describe, expect, it } from 'vitest'

import { AuthError } from '../AuthService'
import { DEFAULT_AUTH_ERROR_MESSAGE, toAuthError } from '../authErrors'

describe('toAuthError', () => {
  it('Firebase 오류 코드를 한국어 메시지로 바꾼다', () => {
    const result = toAuthError({ code: 'auth/email-already-in-use' })
    expect(result).toBeInstanceOf(AuthError)
    expect(result.message).toBe('이미 가입된 이메일입니다.')
    expect(result.code).toBe('auth/email-already-in-use')
  })

  it('로그인 실패 코드는 이메일·비밀번호 중 무엇이 틀렸는지 구분하지 않는다', () => {
    expect(toAuthError({ code: 'auth/user-not-found' }).message).toBe(
      toAuthError({ code: 'auth/wrong-password' }).message,
    )
  })

  it('모르는 코드나 일반 오류는 기본 메시지', () => {
    expect(toAuthError({ code: 'auth/unknown' }).message).toBe(DEFAULT_AUTH_ERROR_MESSAGE)
    expect(toAuthError(new Error('boom')).message).toBe(DEFAULT_AUTH_ERROR_MESSAGE)
    expect(toAuthError(null).message).toBe(DEFAULT_AUTH_ERROR_MESSAGE)
  })

  it('이미 AuthError 면 그대로 돌려준다', () => {
    const original = new AuthError('원래 메시지')
    expect(toAuthError(original)).toBe(original)
  })
})
