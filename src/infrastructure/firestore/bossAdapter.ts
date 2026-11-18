import { isBossDifficulty, type Boss, type NewBoss } from '@/domain/boss/Boss'

/** [Adapter 패턴] Firestore 보스 문서 ↔ Boss 변환 */
export interface BossDoc {
  name: string
  difficulty: string
  order: number
  createdAt: Date
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

export function toBossDoc(input: NewBoss & { order: number }, createdAt: Date): BossDoc {
  return { name: input.name, difficulty: input.difficulty, order: input.order, createdAt }
}

export function fromBossDoc(id: string, data: Record<string, unknown>): Boss {
  const { name, difficulty, order, createdAt } = data
  if (typeof name !== 'string') throw new Error(`보스 데이터의 이름이 올바르지 않습니다: ${id}`)
  if (!isBossDifficulty(difficulty)) {
    throw new Error(`보스 데이터의 난이도가 올바르지 않습니다: ${id}`)
  }
  return {
    id,
    name,
    difficulty,
    order: typeof order === 'number' ? order : 0,
    createdAt: toDate(createdAt),
  }
}
