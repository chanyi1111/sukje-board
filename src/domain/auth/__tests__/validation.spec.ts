import { describe, expect, it } from 'vitest'

import {
  validateDisplayName,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from '../validation'

describe('validateEmail', () => {
  it('빈 값이면 입력 요청 메시지', () => {
    expect(validateEmail('   ')).toBe('이메일을 입력해주세요.')
  })
  it('형식이 틀리면 형식 오류 메시지', () => {
    expect(validateEmail('abc')).toBe('이메일 형식이 올바르지 않습니다.')
    expect(validateEmail('abc@')).toBe('이메일 형식이 올바르지 않습니다.')
  })
  it('올바른 이메일이면 null', () => {
    expect(validateEmail('user@example.com')).toBeNull()
    expect(validateEmail('  user@example.com  ')).toBeNull()
  })
})

describe('validatePassword', () => {
  it('빈 값이면 입력 요청 메시지', () => {
    expect(validatePassword('')).toBe('비밀번호를 입력해주세요.')
  })
  it('6자 미만이면 길이 오류', () => {
    expect(validatePassword('12345')).toBe('비밀번호는 6자 이상이어야 합니다.')
  })
  it('6자 이상이면 null', () => {
    expect(validatePassword('123456')).toBeNull()
  })
})

describe('validatePasswordConfirm', () => {
  it('비밀번호와 다르면 불일치 메시지', () => {
    expect(validatePasswordConfirm('123456', '1234567')).toBe('비밀번호가 일치하지 않습니다.')
  })
  it('같으면 null', () => {
    expect(validatePasswordConfirm('123456', '123456')).toBeNull()
  })
})

describe('validateDisplayName', () => {
  it('빈 값이면 입력 요청 메시지', () => {
    expect(validateDisplayName(' ')).toBe('닉네임을 입력해주세요.')
  })
  it('20자를 넘으면 길이 오류', () => {
    expect(validateDisplayName('가'.repeat(21))).toBe('닉네임은 20자 이하로 입력해주세요.')
  })
  it('정상 닉네임이면 null', () => {
    expect(validateDisplayName('메린이')).toBeNull()
  })
})
