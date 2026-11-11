import type { Character, NewCharacter } from './Character'

/**
 * [Repository 패턴] 캐릭터 데이터 저장소의 계약
 * 서비스·스토어는 이 인터페이스에만 의존하고, Firestore 인지 메모리인지 알지 못한다.
 */
export interface CharacterRepository {
  list(uid: string): Promise<Character[]>
  add(uid: string, input: NewCharacter): Promise<Character>
  rename(uid: string, id: string, name: string): Promise<void>
  remove(uid: string, id: string): Promise<void>
}
