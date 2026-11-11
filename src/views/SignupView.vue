<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import {
  validateDisplayName,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from '@/domain/auth/validation'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ displayName: '', email: '', password: '', passwordConfirm: '' })
const fieldErrors = reactive<Record<keyof typeof form, string | null>>({
  displayName: null,
  email: null,
  password: null,
  passwordConfirm: null,
})
const submitError = ref('')
const loading = ref(false)

async function handleSubmit() {
  submitError.value = ''
  fieldErrors.displayName = validateDisplayName(form.displayName)
  fieldErrors.email = validateEmail(form.email)
  fieldErrors.password = validatePassword(form.password)
  fieldErrors.passwordConfirm = validatePasswordConfirm(form.password, form.passwordConfirm)
  if (Object.values(fieldErrors).some((message) => message !== null)) return

  loading.value = true
  try {
    await auth.signUp(form.email, form.password, form.displayName)
    await router.replace({ name: 'home' })
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : '회원가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-card">
    <h1>회원가입</h1>
    <form novalidate @submit.prevent="handleSubmit">
      <label>
        닉네임
        <input v-model="form.displayName" type="text" autocomplete="nickname" :disabled="loading" />
      </label>
      <p v-if="fieldErrors.displayName" class="field-error">{{ fieldErrors.displayName }}</p>

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
          autocomplete="new-password"
          :disabled="loading"
        />
      </label>
      <p v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</p>

      <label>
        비밀번호 확인
        <input
          v-model="form.passwordConfirm"
          type="password"
          autocomplete="new-password"
          :disabled="loading"
        />
      </label>
      <p v-if="fieldErrors.passwordConfirm" class="field-error">{{ fieldErrors.passwordConfirm }}</p>

      <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>

      <button type="submit" :disabled="loading">{{ loading ? '가입 중…' : '회원가입' }}</button>
    </form>
    <p class="switch">이미 계정이 있나요? <RouterLink to="/login">로그인</RouterLink></p>
  </section>
</template>

<style scoped src="./auth-form.css"></style>
