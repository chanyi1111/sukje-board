import type { Character, NewCharacter } from '@/domain/character/Character'
import { isGameId } from '@/domain/game/games'

/**
 * [Adapter 패턴] Firestore 문서 ↔ 도메인 모델(Character) 변환
 * - Firestore 는 날짜를 Timestamp 로 돌려주고 필드 타입을 보장하지 않는다.
 * - 앱 내부는 항상 검증된 Character(Date, GameId)만 다루도록 이 경계에서 변환한다.
 */

/** Firestore 에 저장되는 문서 형태 (Date 는 저장 시 Timestamp 로 자동 변환됨) */
export interface CharacterDoc {
  gameId: string
  name: string
  createdAt: Date
}

interface TimestampLike {
  toDate(): Date
}

function isTimestampLike(value: unknown): value is TimestampLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Partial<TimestampLike>).toDate === 'function'
  )
}

export function toCharacterDoc(input: NewCharacter, createdAt: Date): CharacterDoc {
  return { gameId: input.gameId, name: input.name, createdAt }
}

export function fromCharacterDoc(id: string, data: Record<string, unknown>): Character {
  const { gameId, name, createdAt } = data

  if (!isGameId(gameId)) throw new Error(`캐릭터 데이터의 게임 정보가 올바르지 않습니다: ${id}`)
  if (typeof name !== 'string') throw new Error(`캐릭터 데이터의 이름이 올바르지 않습니다: ${id}`)

  let created: Date
  if (createdAt instanceof Date) created = createdAt
  else if (isTimestampLike(createdAt)) created = createdAt.toDate()
  else created = new Date(0)

  return { id, gameId, name, createdAt: created }
}
