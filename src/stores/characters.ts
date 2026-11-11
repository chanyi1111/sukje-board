import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

import type { Character, NewCharacter } from '@/domain/character/Character'
import type { CharacterRepository } from '@/domain/character/CharacterRepository'
import { GAMES } from '@/domain/game/games'
import { FirestoreCharacterRepository } from '@/infrastructure/firestore/FirestoreCharacterRepository'
import { DataError } from '@/infrastructure/firestore/firestoreErrors'
import { CharacterService } from '@/services/character/CharacterService'
import { useAuthStore } from './auth'

let service: CharacterService | null = null
function getService(): CharacterService {
  if (service === null) service = new CharacterService(new FirestoreCharacterRepository())
  return service
}

/** 테스트에서 메모리 저장소를 끼워 넣기 위한 함수 */
export function setCharacterRepository(repository: CharacterRepository): void {
  service = new CharacterService(repository)
}

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export const useCharacterStore = defineStore('characters', () => {
  const auth = useAuthStore()

  const items = ref<Character[]>([])
  const status = ref<LoadStatus>('idle')
  const loadError = ref('')

  /** 게임별로 묶은 캐릭터 목록 (게임 정의 순서 유지) */
  const groupedByGame = computed(() =>
    GAMES.map((game) => ({
      game,
      characters: items.value.filter((c) => c.gameId === game.id),
    })),
  )

  function requireUid(): string {
    const uid = auth.user?.uid
    if (!uid) throw new DataError('로그인이 필요합니다.', 'unauthenticated')
    return uid
  }

  async function load() {
    status.value = 'loading'
    loadError.value = ''
    try {
      items.value = await getService().list(requireUid())
      status.value = 'ready'
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : '목록을 불러오지 못했습니다.'
      status.value = 'error'
    }
  }

  // 아래 동작들은 저장에 성공한 뒤에만 화면 목록을 바꾼다 (실패를 성공처럼 보이지 않기 위해)
  async function add(input: NewCharacter) {
    const created = await getService().add(requireUid(), items.value, input)
    items.value = [...items.value, created]
  }

  async function rename(id: string, newName: string) {
    const target = items.value.find((c) => c.id === id)
    if (!target) throw new DataError('이미 삭제되었거나 존재하지 않는 캐릭터입니다.', 'not-found')
    const updated = await getService().rename(requireUid(), items.value, target, newName)
    items.value = items.value.map((c) => (c.id === id ? updated : c))
  }

  async function remove(id: string) {
    await getService().remove(requireUid(), id)
    items.value = items.value.filter((c) => c.id !== id)
  }

  function reset() {
    items.value = []
    status.value = 'idle'
    loadError.value = ''
  }

  // 로그아웃하거나 다른 계정으로 바뀌면 이전 사용자의 목록을 비운다
  watch(
    () => auth.user?.uid,
    (uid, prevUid) => {
      if (uid !== prevUid) reset()
    },
  )

  return { items, status, loadError, groupedByGame, load, add, rename, remove, reset }
})
