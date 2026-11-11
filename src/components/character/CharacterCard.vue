<script setup lang="ts">
import { nextTick, ref } from 'vue'

import { CHARACTER_NAME_MAX_LENGTH, type Character } from '@/domain/character/Character'
import { useCharacterStore } from '@/stores/characters'

const props = defineProps<{ character: Character }>()
const store = useCharacterStore()

const editing = ref(false)
const draft = ref('')
const confirmingDelete = ref(false)
const busy = ref(false)
const error = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

async function startEdit() {
  draft.value = props.character.name
  error.value = ''
  editing.value = true
  await nextTick()
  inputRef.value?.focus()
}

function cancelEdit() {
  editing.value = false
  error.value = ''
}

async function saveEdit() {
  if (draft.value.trim() === props.character.name) {
    cancelEdit()
    return
  }
  busy.value = true
  error.value = ''
  try {
    await store.rename(props.character.id, draft.value)
    editing.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : '이름 수정에 실패했습니다.'
  } finally {
    busy.value = false
  }
}

async function confirmDelete() {
  busy.value = true
  error.value = ''
  try {
    await store.remove(props.character.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '삭제에 실패했습니다.'
    confirmingDelete.value = false
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <li class="character-card">
    <form v-if="editing" class="row" novalidate @submit.prevent="saveEdit">
      <input
        ref="inputRef"
        v-model="draft"
        type="text"
        :maxlength="CHARACTER_NAME_MAX_LENGTH"
        :disabled="busy"
        aria-label="새 캐릭터 이름"
        @keydown.esc="cancelEdit"
      />
      <button type="submit" class="primary" :disabled="busy">저장</button>
      <button type="button" :disabled="busy" @click="cancelEdit">취소</button>
    </form>

    <div v-else-if="confirmingDelete" class="row">
      <span class="confirm-text">'{{ character.name }}'을(를) 삭제할까요?</span>
      <button type="button" class="danger" :disabled="busy" @click="confirmDelete">
        {{ busy ? '삭제 중…' : '삭제' }}
      </button>
      <button type="button" :disabled="busy" @click="confirmingDelete = false">취소</button>
    </div>

    <div v-else class="row">
      <span class="name">{{ character.name }}</span>
      <button type="button" @click="startEdit">이름 수정</button>
      <button type="button" @click="confirmingDelete = true">삭제</button>
    </div>

    <p v-if="error" class="card-error" role="alert">{{ error }}</p>
  </li>
</template>

<style scoped>
.character-card {
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e3e6ef;
  border-radius: 10px;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.name,
.confirm-text {
  flex: 1;
  font-weight: 600;
}
input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #d0d4e0;
  border-radius: 6px;
  font: inherit;
}
button {
  padding: 6px 10px;
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
.card-error {
  margin: 8px 0 0;
  color: #b42318;
  font-size: 0.85rem;
}
</style>
