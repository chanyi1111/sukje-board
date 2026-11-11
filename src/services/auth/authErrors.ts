import { AuthError } from './AuthService'

/** Firebase 오류 코드 → 사용자에게 보여줄 한국어 메시지 */
const MESSAGES: Record<string, string> = {
  'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/user-not-found': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/wrong-password': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/email-already-in-use': '이미 가입된 이메일입니다.',
  'auth/weak-password': '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.',
  'auth/too-many-requests': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
}

export const DEFAULT_AUTH_ERROR_MESSAGE = '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.'

export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : undefined

  const message = (code && MESSAGES[code]) || DEFAULT_AUTH_ERROR_MESSAGE
  return new AuthError(message, code)
}
