/** 데이터 저장·조회 실패를 화면용 메시지로 바꾼 오류 */
export class DataError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'DataError'
  }
}

const MESSAGES: Record<string, string> = {
  'permission-denied': '이 데이터에 접근할 권한이 없습니다.',
  unauthenticated: '로그인이 필요합니다. 다시 로그인해주세요.',
  unavailable: '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.',
  'deadline-exceeded': '응답이 너무 늦습니다. 잠시 후 다시 시도해주세요.',
  'not-found': '이미 삭제되었거나 존재하지 않는 데이터입니다.',
}

export const DEFAULT_DATA_ERROR_MESSAGE = '데이터 처리 중 오류가 발생했습니다. 다시 시도해주세요.'

export function toDataError(error: unknown): DataError {
  if (error instanceof DataError) return error

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code).replace(/^firestore\//, '')
      : undefined

  return new DataError((code && MESSAGES[code]) || DEFAULT_DATA_ERROR_MESSAGE, code)
}
