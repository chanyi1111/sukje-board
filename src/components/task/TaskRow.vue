<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { Task } from '@/domain/task/Task'
import type { TaskAction } from '@/domain/task/TaskProgress'

const props = defineProps<{
  task: Task
  /** 부모가 저장까지 처리하고, 실패하면 예외를 던진다 */
  onAction: (action: TaskAction) => Promise<void>
}>()

const busy = ref(false)
const error = ref('')
const valueDraft = ref(props.task.progress.value?.toString() ?? '')

watch(
  () => props.task.progress.value,
  (v) => {
    valueDraft.value = v?.toString() ?? ''
  },
)

const state = computed(() => props.task.state)
const percent = computed(() => Math.round(props.task.progressRatio() * 100))
const canIncrement = computed(() => state.value.guard({ type: 'increment' }) === null)
const canDecrement = computed(() => state.value.guard({ type: 'decrement' }) === null)
const locked = computed(() => state.value.name === 'locked')

async function run(action: TaskAction) {
  busy.value = true
  error.value = ''
  try {
    await props.onAction(action)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '저장에 실패했습니다.'
  } finally {
    busy.value = false
  }
}

function submitValue() {
  const raw = valueDraft.value.trim().replace(/,/g, '')
  if (raw === '' || Number.isNaN(Number(raw))) {
    error.value = '숫자를 입력해주세요.'
    return
  }
  run({ type: 'setValue', value: Number(raw) })
}
</script>

<template>
  <li class="task-row" :class="`state-${state.name}`">
    <div class="main">
      <!-- 체크형 -->
      <label v-if="task.kind === 'check'" class="check">
        <input
          type="checkbox"
          :checked="task.isComplete()"
          :disabled="busy || locked"
          @change="run({ type: 'toggle' })"
        />
        <span class="name">{{ task.name }}</span>
      </label>
      <span v-else class="name">{{ task.name }}</span>

      <!-- 횟수형 -->
      <div v-if="task.kind === 'count'" class="counter">
        <button
          type="button"
          :disabled="busy || !canDecrement"
          aria-label="1회 빼기"
          @click="run({ type: 'decrement' })"
        >
          −
        </button>
        <span class="summary">{{ task.summary() }}</span>
        <button
          type="button"
          :disabled="busy || !canIncrement"
          aria-label="1회 더하기"
          @click="run({ type: 'increment' })"
        >
          +
        </button>
        <button type="button" class="ghost" :disabled="busy || locked" @click="run({ type: 'toggle' })">
          {{ task.isComplete() ? '초기화' : '모두 완료' }}
        </button>
      </div>

      <!-- 값 기록형 -->
      <form v-else-if="task.kind === 'value'" class="value" novalidate @submit.prevent="submitValue">
        <input
          v-model="valueDraft"
          type="text"
          inputmode="numeric"
          placeholder="기록 입력"
          :disabled="busy || locked"
          :aria-label="`${task.name} 기록`"
        />
        <button type="submit" :disabled="busy || locked">저장</button>
      </form>

      <span class="badge">{{ state.label }}</span>
    </div>

    <div v-if="task.kind === 'count'" class="bar" aria-hidden="true">
      <div class="fill" :style="{ width: `${percent}%` }" />
    </div>
    <p v-if="error" class="row-error" role="alert">{{ error }}</p>
  </li>
</template>

<style scoped>
.task-row {
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e3e6ef;
  border-radius: 10px;
}
.task-row.state-done {
  background: #f3f8f4;
  border-color: #cfe6d5;
}
.main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.check {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  cursor: pointer;
}
.check input {
  width: 18px;
  height: 18px;
}
.name {
  flex: 1;
  font-weight: 600;
}
.state-done .name {
  color: #4b6b55;
}
.counter,
.value {
  display: flex;
  align-items: center;
  gap: 6px;
}
.counter button,
.value button {
  min-width: 32px;
  padding: 4px 10px;
  border: 1px solid #d0d4e0;
  border-radius: 6px;
  background: #fff;
}
.counter button.ghost {
  font-size: 0.8rem;
  color: #5b6275;
}
.summary {
  min-width: 64px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.value input {
  width: 120px;
  padding: 5px 8px;
  border: 1px solid #d0d4e0;
  border-radius: 6px;
  font: inherit;
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
.bar {
  height: 4px;
  margin-top: 10px;
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
.row-error {
  margin: 8px 0 0;
  color: #b42318;
  font-size: 0.85rem;
}
</style>
