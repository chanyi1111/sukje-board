<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import BossGroupRow from '@/components/task/BossGroupRow.vue'
import TaskRow from '@/components/task/TaskRow.vue'
import { useTaskBoard } from '@/composables/useTaskBoard'
import { getGame } from '@/domain/game/games'
import { GroupTask, type Task } from '@/domain/task/Task'
import type { TaskAction } from '@/domain/task/TaskProgress'
import { useCharacterStore } from '@/stores/characters'

const route = useRoute()
const characters = useCharacterStore()
const board = useTaskBoard()

const characterId = computed(() => String(route.params.id))
const character = computed(() => characters.items.find((c) => c.id === characterId.value) ?? null)
const gameName = computed(() => (character.value ? getGame(character.value.gameId).name : ''))

const resetFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

// 새로고침으로 바로 들어온 경우 캐릭터 목록부터 불러온다
if (characters.status === 'idle') characters.load()

// 캐릭터 정보가 준비되면 숙제 보드를 불러온다
watch(
  character,
  (c) => {
    if (c) board.load(c)
  },
  { immediate: true },
)

function actionFor(taskId: string) {
  return (action: TaskAction) => board.apply(taskId, action)
}

function isGroup(task: Task): task is GroupTask {
  return task instanceof GroupTask
}

function toggleChildFor(taskId: string) {
  return (childId: string) => board.apply(taskId, { type: 'toggle' }, childId)
}
</script>

<template>
  <section class="board">
    <RouterLink to="/" class="back">← 캐릭터 목록</RouterLink>

    <p v-if="characters.status === 'loading'" class="state">캐릭터 정보를 불러오는 중…</p>
    <p v-else-if="characters.status === 'error'" class="state error" role="alert">
      {{ characters.loadError }}
    </p>
    <p v-else-if="characters.status === 'ready' && !character" class="state">
      캐릭터를 찾을 수 없어요. 삭제되었거나 다른 계정의 캐릭터일 수 있어요.
    </p>

    <template v-else-if="character">
      <header class="board-header">
        <div>
          <p class="game">{{ gameName }}</p>
          <h1>{{ character.name }}</h1>
        </div>
        <p v-if="board.status.value === 'ready'" class="total">
          완료 <strong>{{ board.completedCount.value }}</strong> / {{ board.items.value.length }}
        </p>
      </header>

      <p v-if="board.status.value === 'loading'" class="state">숙제를 불러오는 중…</p>
      <div v-else-if="board.status.value === 'error'" class="state error" role="alert">
        <p>{{ board.loadError.value }}</p>
        <button type="button" @click="board.load(character)">다시 시도</button>
      </div>

      <template v-else-if="board.status.value === 'ready'">
        <section v-for="group in board.groups.value" :key="group.label" class="group">
          <h2>
            {{ group.label }} 초기화
            <span class="next">다음 초기화 {{ resetFormatter.format(group.nextResetAt) }}</span>
          </h2>
          <ul>
            <template v-for="item in group.items" :key="item.definition.id">
              <BossGroupRow
                v-if="isGroup(item.task)"
                :task="item.task"
                :bosses="board.bosses.value"
                :on-toggle="toggleChildFor(item.definition.id)"
                :on-add="board.addBoss"
                :on-update="board.updateBoss"
                :on-remove="board.removeBoss"
                :on-move="board.moveBoss"
              />
              <TaskRow v-else :task="item.task" :on-action="actionFor(item.definition.id)" />
            </template>
          </ul>
        </section>
      </template>
    </template>
  </section>
</template>

<style scoped>
.board {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.back {
  color: #5b6275;
  text-decoration: none;
  font-size: 0.9rem;
}
.board-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.game {
  margin: 0 0 4px;
  color: #3b4cca;
  font-size: 0.85rem;
  font-weight: 600;
}
h1 {
  margin: 0;
  font-size: 1.5rem;
}
.total {
  margin: 0;
  color: #5b6275;
}
.total strong {
  color: #1f2330;
  font-size: 1.2rem;
}
h2 {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 0 0 10px;
  font-size: 1rem;
}
.next {
  color: #8a90a2;
  font-size: 0.8rem;
  font-weight: 400;
}
ul {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.state {
  margin: 0;
  padding: 24px;
  text-align: center;
  color: #5b6275;
  background: #fff;
  border: 1px dashed #d0d4e0;
  border-radius: 12px;
}
.state.error {
  color: #b42318;
  border-color: #f3b8b3;
}
.state.error button {
  margin-top: 12px;
  padding: 6px 14px;
  border: 1px solid #b42318;
  border-radius: 6px;
  background: #fff;
  color: #b42318;
}
</style>
