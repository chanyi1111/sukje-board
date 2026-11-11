<script setup lang="ts">
import { ref } from 'vue'

import { CHARACTER_NAME_MAX_LENGTH, validateCharacterName } from '@/domain/character/Character'
import { GAMES } from '@/domain/game/games'
import type { GameId } from '@/domain/game/types'
import { useCharacterStore } from '@/stores/characters'

const store = useCharacterStore()

const gameId = ref<GameId>('maplestory')
const name = ref('')
const error = ref('')
const saving = ref(false)

async function handleSubmit() {
  error.value = validateCharacterName(name.value) ?? ''
  if (error.value) return

  saving.value = true
  try {
    await store.add({ gameId: gameId.value, name: name.value })
    name.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : '캐릭터 등록에 실패했습니다.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="character-form" novalidate @submit.prevent="handleSubmit">
    <select v-model="gameId" :disabled="saving" aria-label="게임 선택">
      <option v-for="game in GAMES" :key="game.id" :value="game.id">{{ game.name }}</option>
    </select>
    <input
      v-model="name"
      type="text"
      placeholder="캐릭터 이름"
      :maxlength="CHARACTER_NAME_MAX_LENGTH"
      :disabled="saving"
      aria-label="캐릭터 이름"
    />
    <button type="submit" :disabled="saving">{{ saving ? '등록 중…' : '캐릭터 추가' }}</button>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
  </form>
</template>

<style scoped>
.character-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e3e6ef;
  border-radius: 12px;
}
select,
input {
  padding: 10px 12px;
  border: 1px solid #d0d4e0;
  border-radius: 8px;
  font: inherit;
}
input {
  flex: 1;
  min-width: 160px;
}
button {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: #3b4cca;
  color: #fff;
  font-weight: 600;
}
.form-error {
  flex-basis: 100%;
  margin: 0;
  color: #b42318;
  font-size: 0.9rem;
}
</style>
