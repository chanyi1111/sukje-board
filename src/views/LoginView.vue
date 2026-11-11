<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { validateEmail, validatePassword } from '@/domain/auth/validation'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const fieldErrors = reactive<{ email: string | null; password: string | null }>({
  email: null,
  password: null,
})
const submitError = ref('')
const loading = ref(false)

async function handleSubmit() {
  submitError.value = ''
  fieldErrors.email = validateEmail(form.email)
  fieldErrors.password = validatePassword(form.password)
  if (fieldErrors.email || fieldErrors.password) return

  loading.value = true
  try {
    await auth.signIn(form.email, form.password)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-card">
    <h1>로그인</h1>
    <form novalidate @submit.prevent="handleSubmit">
      <label>
        이메일
        <input v-model="form.email" type="email" autocomplete="email" :disabled="loading" />
      </label>
      <p v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</p>

      <label>
        비밀번호
        <input
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          :disabled="loading"
        />
      </label>
      <p v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</p>

      <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>

      <button type="submit" :disabled="loading">{{ loading ? '로그인 중…' : '로그인' }}</button>
    </form>
    <p class="switch">계정이 없나요? <RouterLink to="/signup">회원가입</RouterLink></p>
  </section>
</template>

<style scoped src="./auth-form.css"></style>
