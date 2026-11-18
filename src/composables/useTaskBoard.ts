import { computed, ref } from 'vue'

import type { Character } from '@/domain/character/Character'
import type { TaskAction } from '@/domain/task/TaskProgress'
import { FirestoreCheckRepository } from '@/infrastructure/firestore/FirestoreCheckRepository'
import { TaskService, type TaskItem } from '@/services/task/TaskService'
import { useAuthStore } from '@/stores/auth'

let service: TaskService | null = null
function getService(): TaskService {
  if (service === null) service = new TaskService(new FirestoreCheckRepository())
  return service
}

/** 테스트에서 다른 TaskService 를 끼워 넣기 위한 함수 */
export function setTaskService(custom: TaskService): void {
  service = custom
}

/** 캐릭터 한 명의 숙제 보드 상태 */
export function useTaskBoard() {
  const auth = useAuthStore()

  const items = ref<TaskItem[]>([])
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

  async function load(character: Character) {
    current = character
    status.value = 'loading'
    loadError.value = ''
    try {
      items.value = await getService().loadBoard(requireUid(), character)
      status.value = 'ready'
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : '숙제 목록을 불러오지 못했습니다.'
      status.value = 'error'
    }
  }

  /** 실패하면 예외를 그대로 던진다 → 각 줄(TaskRow)이 오류를 표시 */
  async function apply(taskId: string, action: TaskAction) {
    if (!current) throw new Error('캐릭터 정보가 없습니다.')
    const item = items.value.find((i) => i.definition.id === taskId)
    if (!item) throw new Error('숙제를 찾을 수 없습니다.')

    const updated = await getService().apply(requireUid(), current.id, item, action)
    items.value = items.value.map((i) => (i.definition.id === taskId ? updated : i))
  }

  return { items, status, loadError, groups, completedCount, load, apply }
}
