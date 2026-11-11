<script setup lang="ts">
import { onMounted } from 'vue'

import CharacterCard from '@/components/character/CharacterCard.vue'
import CharacterForm from '@/components/character/CharacterForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useCharacterStore } from '@/stores/characters'

const auth = useAuthStore()
const store = useCharacterStore()

onMounted(() => {
  if (store.status === 'idle') store.load()
})
</script>

<template>
  <section class="home">
    <h1>{{ auth.user?.displayName ?? '용사' }}님의 숙제보드</h1>

    <CharacterForm />

    <p v-if="store.status === 'loading'" class="state">캐릭터 목록을 불러오는 중…</p>

    <div v-else-if="store.status === 'error'" class="state error" role="alert">
      <p>{{ store.loadError }}</p>
      <button type="button" @click="store.load()">다시 시도</button>
    </div>

    <p v-else-if="store.status === 'ready' && store.items.length === 0" class="state">
      아직 등록한 캐릭터가 없어요. 위에서 게임을 고르고 캐릭터를 추가해보세요.
    </p>

    <template v-else-if="store.status === 'ready'">
      <section
        v-for="group in store.groupedByGame"
        :key="group.game.id"
        class="game-group"
        :aria-label="group.game.name"
      >
        <template v-if="group.characters.length > 0">
          <h2>
            {{ group.game.name }} <span class="count">{{ group.characters.length }}</span>
          </h2>
          <ul>
            <CharacterCard v-for="c in group.characters" :key="c.id" :character="c" />
          </ul>
        </template>
      </section>
    </template>
  </section>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
h1 {
  margin: 0;
  font-size: 1.5rem;
}
h2 {
  margin: 0 0 10px;
  font-size: 1.1rem;
}
.count {
  margin-left: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e8ebfa;
  color: #3b4cca;
  font-size: 0.8rem;
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
.state.error p {
  margin: 0 0 12px;
}
.state.error button {
  padding: 6px 14px;
  border: 1px solid #b42318;
  border-radius: 6px;
  background: #fff;
  color: #b42318;
}
</style>
