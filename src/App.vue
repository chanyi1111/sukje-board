<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const signingOut = ref(false)
const signOutError = ref('')

async function handleSignOut() {
  signingOut.value = true
  signOutError.value = ''
  try {
    await auth.signOut()
    await router.push({ name: 'login' })
  } catch (error) {
    signOutError.value = error instanceof Error ? error.message : '로그아웃에 실패했습니다.'
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="brand">숙제보드</RouterLink>
    <div v-if="auth.isLoggedIn" class="user-area">
      <span class="user-name">{{ auth.user?.displayName ?? auth.user?.email }}</span>
      <button type="button" :disabled="signingOut" @click="handleSignOut">
        {{ signingOut ? '로그아웃 중…' : '로그아웃' }}
      </button>
    </div>
  </header>
  <p v-if="signOutError" class="global-error" role="alert">{{ signOutError }}</p>

  <main class="app-main">
    <RouterView />
  </main>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    'Malgun Gothic',
    sans-serif;
  background: #f6f7fb;
  color: #1f2330;
}
button {
  font: inherit;
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #e3e6ef;
}
.brand {
  font-weight: 700;
  font-size: 1.2rem;
  color: #3b4cca;
  text-decoration: none;
}
.user-area {
  display: flex;
  gap: 12px;
  align-items: center;
}
.user-area button {
  padding: 6px 12px;
  border: 1px solid #d0d4e0;
  border-radius: 6px;
  background: #fff;
}
.global-error {
  margin: 0;
  padding: 8px 24px;
  background: #fdecec;
  color: #b42318;
}
.app-main {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 16px;
}
</style>
