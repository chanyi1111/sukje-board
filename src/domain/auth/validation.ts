/**
 * 로그인·회원가입 입력값 검사 (화면, Firebase와 분리된 순수 함수)
 * - 문제가 없으면 null, 있으면 화면에 보여줄 메시지를 돌려준다.
 */

export const PASSWORD_MIN_LENGTH = 6 // Firebase Authentication 최소 길이
export const DISPLAY_NAME_MAX_LENGTH = 20

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | null {
  const value = email.trim()
  if (value === '') return '이메일을 입력해주세요.'
  if (!EMAIL_PATTERN.test(value)) return '이메일 형식이 올바르지 않습니다.'
  return null
}

export function validatePassword(password: string): string | null {
  if (password === '') return '비밀번호를 입력해주세요.'
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`
  }
  return null
}

export function validatePasswordConfirm(password: string, confirm: string): string | null {
  if (confirm === '') return '비밀번호 확인을 입력해주세요.'
  if (password !== confirm) return '비밀번호가 일치하지 않습니다.'
  return null
}

export function validateDisplayName(name: string): string | null {
  const value = name.trim()
  if (value === '') return '닉네임을 입력해주세요.'
  if (value.length > DISPLAY_NAME_MAX_LENGTH) {
    return `닉네임은 ${DISPLAY_NAME_MAX_LENGTH}자 이하로 입력해주세요.`
  }
  return null
}
