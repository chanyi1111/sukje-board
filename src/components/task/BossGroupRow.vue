<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import {
  BOSS_DIFFICULTIES,
  BOSS_NAME_MAX_LENGTH,
  bossTaskId,
  canAddBoss,
  difficultyLabel,
  MAX_BOSSES_PER_CHARACTER,
  validateBossName,
  type Boss,
  type BossDifficulty,
  type NewBoss,
} from '@/domain/boss/Boss'
import type { GroupTask } from '@/domain/task/Task'

const props = defineProps<{
  task: GroupTask
  bosses: readonly Boss[]
  onToggle: (childId: string) => Promise<void>
  onAdd: (input: NewBoss) => Promise<void>
  onUpdate: (id: string, input: NewBoss) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onMove: (id: string, direction: 'up' | 'down') => Promise<void>
}>()

const managing = ref(false)
const busy = ref(false)
const error = ref('')

const addForm = reactive<NewBoss>({ name: '', difficulty: 'hard' })
const editingId = ref<string | null>(null)
const editForm = reactive<NewBoss>({ name: '', difficulty: 'hard' })
const confirmingDeleteId = ref<string | null>(null)

const locked = computed(() => props.task.state.name === 'locked')
const percent = computed(() => Math.round(props.task.progressRatio() * 100))
const canAdd = computed(() => canAddBoss(props.bosses))

/** 보스 순서대로 하위 숙제를 짝지어 표시 */
const rows = computed(() =>
  props.bosses.map((boss) => ({ boss, child: props.task.findChild(bossTaskId(boss.id)) })),
)

async function run(job: () => Promise<void>): Promise<boolean> {
  busy.value = true
  error.value = ''
  try {
    await job()
    return true
  } catch (e) {
    error.value = e instanceof Error ? e.message : '처리에 실패했습니다.'
    return false
  } finally {
    busy.value = false
  }
}

async function submitAdd() {
  const message = validateBossName(addForm.name)
  if (message) {
    error.value = message
    return
  }
  if (await run(() => props.onAdd({ ...addForm }))) addForm.name = ''
}

function startEdit(boss: Boss) {
  editingId.value = boss.id
  editForm.name = boss.name
  editForm.difficulty = boss.difficulty
  error.value = ''
}

async function submitEdit(id: string) {
  const message = validateBossName(editForm.name)
  if (message) {
    error.value = message
    return
  }
  if (await run(() => props.onUpdate(id, { ...editForm }))) editingId.value = null
}

async function confirmRemove(id: string) {
  if (await run(() => props.onRemove(id))) confirmingDeleteId.value = null
}

function difficultyClass(d: BossDifficulty) {
  return `diff-${d}`
}
</script>

<template>
  <li class="boss-group" :class="`state-${task.state.name}`">
    <div class="header">
      <span class="name">{{ task.name }}</span>
      <span class="summary">{{ task.summary() }}</span>
      <span class="badge">{{ task.state.label }}</span>
      <button type="button" class="manage" :disabled="busy" @click="managing = !managing">
        {{ managing ? '관리 완료' : '보스 관리' }}
      </button>
    </div>
    <div class="bar" aria-hidden="true"><div class="fill" :style="{ width: `${percent}%` }" /></div>

    <p v-if="bosses.length === 0" class="empty">
      등록된 보스가 없어요. 아래에서 이번 주에 잡을 보스를 추가해보세요.
    </p>

    <ul v-else class="boss-list">
      <li v-for="({ boss, child }, index) in rows" :key="boss.id" class="boss">
        <!-- 수정 중 -->
        <form
          v-if="editingId === boss.id"
          class="inline-form"
          novalidate
          @submit.prevent="submitEdit(boss.id)"
        >
          <select v-model="editForm.difficulty" :disabled="busy" aria-label="난이도">
            <option v-for="d in BOSS_DIFFICULTIES" :key="d.id" :value="d.id">{{ d.label }}</option>
          </select>
          <input
            v-model="editForm.name"
            type="text"
            :maxlength="BOSS_NAME_MAX_LENGTH"
            :disabled="busy"
            aria-label="보스 이름"
          />
          <button type="submit" class="primary" :disabled="busy">저장</button>
          <button type="button" :disabled="busy" @click="editingId = null">취소</button>
        </form>

        <!-- 삭제 확인 -->
        <div v-else-if="confirmingDeleteId === boss.id" class="inline-form">
          <span class="confirm">'{{ difficultyLabel(boss.difficulty) }} {{ boss.name }}' 삭제할까요?</span>
          <button type="button" class="danger" :disabled="busy" @click="confirmRemove(boss.id)">
            삭제
          </button>
          <button type="button" :disabled="busy" @click="confirmingDeleteId = null">취소</button>
        </div>

        <!-- 기본 -->
        <template v-else>
          <label class="check">
            <input
              type="checkbox"
              :checked="child?.isComplete() ?? false"
              :disabled="busy || locked || !child"
              @change="run(() => onToggle(bossTaskId(boss.id)))"
            />
            <span class="diff" :class="difficultyClass(boss.difficulty)">
              {{ difficultyLabel(boss.difficulty) }}
            </span>
            <span class="boss-name" :class="{ done: child?.isComplete() }">{{ boss.name }}</span>
          </label>
          <div v-if="managing" class="tools">
            <button
              type="button"
              :disabled="busy || index === 0"
              aria-label="위로"
              @click="run(() => onMove(boss.id, 'up'))"
            >
              ↑
            </button>
            <button
              type="button"
              :disabled="busy || index === rows.length - 1"
              aria-label="아래로"
              @click="run(() => onMove(boss.id, 'down'))"
            >
              ↓
            </button>
            <button type="button" :disabled="busy" @click="startEdit(boss)">수정</button>
            <button type="button" :disabled="busy" @click="confirmingDeleteId = boss.id">삭제</button>
          </div>
        </template>
      </li>
    </ul>

    <form
      v-if="managing || bosses.length === 0"
      class="add-form"
      novalidate
      @submit.prevent="submitAdd"
    >
      <select v-model="addForm.difficulty" :disabled="busy || !canAdd" aria-label="난이도">
        <option v-for="d in BOSS_DIFFICULTIES" :key="d.id" :value="d.id">{{ d.label }}</option>
      </select>
      <input
        v-model="addForm.name"
        type="text"
        placeholder="보스 이름 (예: 스우)"
        :maxlength="BOSS_NAME_MAX_LENGTH"
        :disabled="busy || !canAdd"
        aria-label="새 보스 이름"
      />
      <button type="submit" class="primary" :disabled="busy || !canAdd">추가</button>
      <span class="limit" :class="{ full: !canAdd }">
        {{ bosses.length }} / {{ MAX_BOSSES_PER_CHARACTER }}
      </span>
    </form>

    <p v-if="error" class="row-error" role="alert">{{ error }}</p>
  </li>
</template>

<style scoped>
.boss-group {
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e3e6ef;
  border-radius: 10px;
}
.boss-group.state-done {
  background: #f3f8f4;
  border-color: #cfe6d5;
}
.header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.name {
  flex: 1;
  font-weight: 600;
}
.summary {
  font-variant-numeric: tabular-nums;
}
.badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef0f6;
  color: #5b6275;
  font-size: 0.75rem;
}
.state-in-progress .badge {
  background: #e8ebfa;
  color: #3b4cca;
}
.state-done .badge {
  background: #dcefe1;
  color: #2f7a45;
}
.state-locked .badge {
  background: #fdecec;
  color: #b42318;
}
button {
  padding: 4px 10px;
  border: 1px solid #d0d4e0;
  border-radius: 6px;
  background: #fff;
  font-size: 0.85rem;
}
button.primary {
  border-color: #3b4cca;
  background: #3b4cca;
  color: #fff;
}
button.danger {
  border-color: #b42318;
  background: #b42318;
  color: #fff;
}
.bar {
  height: 4px;
  margin: 10px 0;
  border-radius: 2px;
  background: #eef0f6;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: #3b4cca;
  transition: width 0.2s;
}
.state-done .fill {
  background: #2f7a45;
}
.empty {
  margin: 4px 0 8px;
  color: #8a90a2;
  font-size: 0.9rem;
}
.boss-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.boss {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  border-top: 1px solid #f0f1f6;
}
.check {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  cursor: pointer;
}
.check input {
  width: 16px;
  height: 16px;
}
.diff {
  min-width: 52px;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  text-align: center;
  color: #fff;
}
.diff-easy {
  background: #8a90a2;
}
.diff-normal {
  background: #3f8fd2;
}
.diff-hard {
  background: #d24b6b;
}
.diff-chaos {
  background: #3a2f4f;
}
.diff-extreme {
  background: #b8860b;
}
.boss-name.done {
  color: #8a90a2;
  text-decoration: line-through;
}
.tools {
  display: flex;
  gap: 4px;
}
.inline-form,
.add-form {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.add-form {
  margin-top: 10px;
}
.inline-form input,
.add-form input {
  flex: 1;
  min-width: 100px;
  padding: 5px 8px;
  border: 1px solid #d0d4e0;
  border-radius: 6px;
  font: inherit;
}
select {
  padding: 5px 6px;
  border: 1px solid #d0d4e0;
  border-radius: 6px;
  font: inherit;
}
.confirm {
  flex: 1;
  font-size: 0.9rem;
}
.limit {
  color: #8a90a2;
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}
.limit.full {
  color: #b42318;
  font-weight: 600;
}
.row-error {
  margin: 8px 0 0;
  color: #b42318;
  font-size: 0.85rem;
}
</style>
