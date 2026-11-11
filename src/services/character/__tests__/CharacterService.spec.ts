import { beforeEach, describe, expect, it } from 'vitest'

import type { Character, NewCharacter } from '@/domain/character/Character'
import type { CharacterRepository } from '@/domain/character/CharacterRepository'
import { CharacterService, DUPLICATE_NAME_MESSAGE, ValidationError } from '../CharacterService'

/** Repository 인터페이스 덕분에 Firestore 없이 메모리 저장소로 테스트할 수 있다 */
class InMemoryCharacterRepository implements CharacterRepository {
  data: Character[] = []
  private seq = 0

  async list() {
    return [...this.data]
  }
  async add(_uid: string, input: NewCharacter) {
    const c: Character = { id: String(++this.seq), ...input, createdAt: new Date() }
    this.data.push(c)
    return c
  }
  async rename(_uid: string, id: string, name: string) {
    this.data = this.data.map((c) => (c.id === id ? { ...c, name } : c))
  }
  async remove(_uid: string, id: string) {
    this.data = this.data.filter((c) => c.id !== id)
  }
}

describe('CharacterService', () => {
  let repo: InMemoryCharacterRepository
  let service: CharacterService

  beforeEach(() => {
    repo = new InMemoryCharacterRepository()
    service = new CharacterService(repo)
  })

  it('이름 앞뒤 공백을 제거해서 저장한다', async () => {
    const c = await service.add('u1', [], { gameId: 'maplestory', name: '  Hero  ' })
    expect(c.name).toBe('Hero')
    expect(repo.data).toHaveLength(1)
  })

  it('빈 이름은 저장하지 않고 ValidationError', async () => {
    await expect(service.add('u1', [], { gameId: 'maplestory', name: ' ' })).rejects.toBeInstanceOf(
      ValidationError,
    )
    expect(repo.data).toHaveLength(0)
  })

  it('같은 게임의 중복 이름은 저장하지 않는다', async () => {
    const first = await service.add('u1', [], { gameId: 'maplestory', name: 'Hero' })
    await expect(
      service.add('u1', [first], { gameId: 'maplestory', name: 'hero' }),
    ).rejects.toThrow(DUPLICATE_NAME_MESSAGE)
    expect(repo.data).toHaveLength(1)
  })

  it('이름 수정 시 다른 캐릭터와 겹치면 거절, 자기 이름 유지는 허용', async () => {
    const a = await service.add('u1', [], { gameId: 'trickcal', name: '버터' })
    const b = await service.add('u1', [a], { gameId: 'trickcal', name: '에르핀' })

    await expect(service.rename('u1', [a, b], b, '버터')).rejects.toThrow(DUPLICATE_NAME_MESSAGE)
    await expect(service.rename('u1', [a, b], a, ' 버터 ')).resolves.toMatchObject({ name: '버터' })
  })

  it('삭제하면 저장소에서 사라진다', async () => {
    const a = await service.add('u1', [], { gameId: 'trickcal', name: '버터' })
    await service.remove('u1', a.id)
    expect(repo.data).toHaveLength(0)
  })
})
