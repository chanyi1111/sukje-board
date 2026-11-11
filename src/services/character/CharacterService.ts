import {
  isDuplicateCharacterName,
  normalizeCharacterName,
  validateCharacterName,
  type Character,
  type NewCharacter,
} from '@/domain/character/Character'
import type { CharacterRepository } from '@/domain/character/CharacterRepository'

/** 입력값·서비스 규칙 위반 (저장 요청 전에 걸러짐) */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export const DUPLICATE_NAME_MESSAGE = '같은 게임에 같은 이름의 캐릭터가 이미 있습니다.'

/**
 * 캐릭터 처리 규칙 계층
 * 화면 → (이 서비스: 검사·규칙) → Repository(저장) 순서로 역할을 나눈다.
 */
export class CharacterService {
  constructor(private readonly repository: CharacterRepository) {}

  list(uid: string): Promise<Character[]> {
    return this.repository.list(uid)
  }

  async add(uid: string, existing: readonly Character[], input: NewCharacter): Promise<Character> {
    const name = normalizeCharacterName(input.name)
    this.assertValidName(existing, input.gameId, name)
    return this.repository.add(uid, { gameId: input.gameId, name })
  }

  async rename(
    uid: string,
    existing: readonly Character[],
    target: Character,
    newName: string,
  ): Promise<Character> {
    const name = normalizeCharacterName(newName)
    this.assertValidName(existing, target.gameId, name, target.id)
    await this.repository.rename(uid, target.id, name)
    return { ...target, name }
  }

  remove(uid: string, id: string): Promise<void> {
    return this.repository.remove(uid, id)
  }

  private assertValidName(
    existing: readonly Character[],
    gameId: Character['gameId'],
    name: string,
    excludeId?: string,
  ): void {
    const message = validateCharacterName(name)
    if (message) throw new ValidationError(message)
    if (isDuplicateCharacterName(existing, gameId, name, excludeId)) {
      throw new ValidationError(DUPLICATE_NAME_MESSAGE)
    }
  }
}
