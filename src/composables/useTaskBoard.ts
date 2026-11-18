import { computed, ref, shallowRef } from 'vue'

import type { Boss, NewBoss } from '@/domain/boss/Boss'
import type { Character } from '@/domain/character/Character'
import { getGame } from '@/domain/game/games'
import type { TaskAction } from '@/domain/task/TaskProgress'
import { FirestoreBossRepository } from '@/infrastructure/firestore/FirestoreBossRepository'
import { FirestoreCheckRepository } from '@/infrastructure/firestore/FirestoreCheckRepository'
import { BossService } from '@/services/boss/BossService'
import { TaskService, type TaskItem } from '@/services/task/TaskService'
import { useAuthStore } from '@/stores/auth'

let taskService: TaskService | null = null
let bossService: BossService | null = null

function getTaskService(): TaskService {
  if (taskService === null) taskService = new TaskService(new FirestoreCheckRepository())
  return taskService
}
function getBossService(): BossService {
  if (bossService === null) bossService = new BossService(new FirestoreBossRepository())
  return bossService
}

/** 테스트에서 다른 서비스를 끼워 넣기 위한 함수 */
export function setTaskBoardServices(services: { task?: TaskService; boss?: BossService }): void {
  if (services.task) taskService = services.task
  if (services.boss) bossService = services.boss
}

/** 캐릭터 한 명의 숙제 보드 상태 */
export function useTaskBoard() {
  const auth = useAuthStore()

  // shallowRef: Task 는 클래스 인스턴스라 ref() 로 깊게 감싸면 protected 멤버가 타입에서 사라지고
  // 불필요한 Proxy 가 생긴다. 숙제 객체는 불변으로 다루고 배열을 통째로 교체하므로 얕은 반응성이면 충분하다.
  const items = shallowRef<TaskItem[]>([])
  const bosses = shallowRef<Boss[]>([])
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const loadError = ref('')
  let current: Character | null = null

  /** 초기화 규칙(라벨)별로 묶어서 표시 */
  const groups = computed(() => {
    const map = new Map<string, { label: string; nextResetAt: Date; items: TaskItem[] }>()
    for (const item of items.value) {
      const label = item.strategy.label
      const group = map.get(label) ?? { label, nextResetAt: item.nextResetAt, items: [] }
      group.items.push(item)
      map.set(label, group)
    }
    return [...map.values()]
  })

  const completedCount = computed(() => items.value.filter((i) => i.task.isComplete()).length)

  function requireUid(): string {
    const uid = auth.user?.uid
    if (!uid) throw new Error('로그인이 필요합니다.')
    return uid
  }

  function requireCharacter(): Character {
    if (!current) throw new Error('캐릭터 정보가 없습니다.')
    return current
  }

  /** 보스 목록 → 숙제 보드 순서로 불러온다 (묶음 숙제가 있는 게임만 보스 조회) */
  async function fetchAll(character: Character) {
    const uid = requireUid()
    const hasGroup = getGame(character.gameId).tasks.some((t) => t.kind === 'group')
    const nextBosses = hasGroup ? await getBossService().list(uid, character.id) : []
    const nextItems = await getTaskService().loadBoard(uid, character, nextBosses)
    bosses.value = nextBosses
    items.value = nextItems
  }

  async function load(character: Character) {
    current = character
    status.value = 'loading'
    loadError.value = ''
    try {
      await fetchAll(character)
      status.value = 'ready'
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : '숙제 목록을 불러오지 못했습니다.'
      status.value = 'error'
    }
  }

  /**
   * 숙제(또는 묶음 숙제의 하위 숙제 childId)에 동작 적용.
   * 실패하면 예외를 그대로 던진다 → 각 줄이 오류를 표시
   */
  async function apply(taskId: string, action: TaskAction, childId?: string) {
    const character = requireCharacter()
    const item = items.value.find((i) => i.definition.id === taskId)
    if (!item) throw new Error('숙제를 찾을 수 없습니다.')

    const updated = await getTaskService().apply(requireUid(), character.id, item, action, childId)
    items.value = items.value.map((i) => (i.definition.id === taskId ? updated : i))
  }

  // ── 주간 보스 목록 관리: 저장 성공 후 보드를 다시 불러와 화면과 저장 데이터를 일치시킨다 ──

  async function addBoss(input: NewBoss) {
    const character = requireCharacter()
    await getBossService().add(requireUid(), character.id, bosses.value, input)
    await fetchAll(character)
  }

  async function updateBoss(id: string, input: NewBoss) {
    const character = requireCharacter()
    const target = bosses.value.find((b) => b.id === id)
    if (!target) throw new Error('보스를 찾을 수 없습니다. 새로고침해주세요.')
    await getBossService().update(requireUid(), character.id, bosses.value, target, input)
    await fetchAll(character)
  }

  async function removeBoss(id: string) {
    const character = requireCharacter()
    await getBossService().remove(requireUid(), character.id, id)
    await fetchAll(character)
  }

  async function moveBoss(id: string, direction: 'up' | 'down') {
    const character = requireCharacter()
    const moved = await getBossService().move(requireUid(), character.id, bosses.value, id, direction)
    if (moved) await fetchAll(character)
  }

  return {
    items,
    bosses,
    status,
    loadError,
    groups,
    completedCount,
    load,
    apply,
    addBoss,
    updateBoss,
    removeBoss,
    moveBoss,
  }
}
