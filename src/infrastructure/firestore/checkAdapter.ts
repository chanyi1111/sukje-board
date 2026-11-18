import type { TaskCheck } from '@/domain/task/TaskCheck'

/**
 * [Adapter 패턴] Firestore 체크 문서 ↔ TaskCheck 변환
 * 저장소에서 읽은 값의 타입을 검증하고, Timestamp 를 Date 로 바꾼다.
 */
export interface CheckDoc {
  taskId: string
  periodKey: string
  count: number
  value: number | null
  updatedAt: Date
}

interface TimestampLike {
  toDate(): Date
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Partial<TimestampLike>).toDate === 'function'
  ) {
    return (value as TimestampLike).toDate()
  }
  return new Date(0)
}

export function toCheckDoc(check: TaskCheck): CheckDoc {
  return {
    taskId: check.taskId,
    periodKey: check.periodKey,
    count: check.count,
    value: check.value,
    updatedAt: check.updatedAt,
  }
}

export function fromCheckDoc(data: Record<string, unknown>): TaskCheck {
  const { taskId, periodKey, count, value, updatedAt } = data
  if (typeof taskId !== 'string' || typeof periodKey !== 'string') {
    throw new Error('숙제 기록 데이터가 올바르지 않습니다.')
  }
  return {
    taskId,
    periodKey,
    count: typeof count === 'number' ? count : 0,
    value: typeof value === 'number' ? value : null,
    updatedAt: toDate(updatedAt),
  }
}
