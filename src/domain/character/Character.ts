import type { GameId } from '@/domain/game/types'

export interface Character {
  id: string
  gameId: GameId
  name: string
  createdAt: Date
}

export interface NewCharacter {
  gameId: GameId
  name: string
}

export const CHARACTER_NAME_MAX_LENGTH = 20

export function normalizeCharacterName(name: string): string {
  return name.trim()
}

/** 문제가 없으면 null, 있으면 화면에 보여줄 메시지 */
export function validateCharacterName(name: string): string | null {
  const value = normalizeCharacterName(name)
  if (value === '') return '캐릭터 이름을 입력해주세요.'
  if (value.length > CHARACTER_NAME_MAX_LENGTH) {
    return `캐릭터 이름은 ${CHARACTER_NAME_MAX_LENGTH}자 이하로 입력해주세요.`
  }
  return null
}

/**
 * 서비스 규칙: 같은 게임 안에서 같은 이름(대소문자·앞뒤 공백 무시)의 캐릭터는 하나만 둔다.
 * excludeId: 이름 수정 시 자기 자신은 비교에서 제외
 */
export function isDuplicateCharacterName(
  characters: readonly Character[],
  gameId: GameId,
  name: string,
  excludeId?: string,
): boolean {
  const target = normalizeCharacterName(name).toLowerCase()
  return characters.some(
    (c) => c.gameId === gameId && c.id !== excludeId && c.name.toLowerCase() === target,
  )
}
