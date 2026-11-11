import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { AuthService, AuthUser } from '@/services/auth/AuthService'
import { FirebaseAuthService } from '@/services/auth/FirebaseAuthService'

let service: AuthService | null = null
function getService(): AuthService {
  if (service === null) service = new FirebaseAuthService()
  return service
}

/** 테스트에서 가짜 AuthService 를 끼워 넣기 위한 함수 */
export function setAuthService(custom: AuthService): void {
  service = custom
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  /** Firebase 가 저장된 로그인 상태를 처음 확인했는지 여부 */
  const ready = ref(false)
  let readyPromise: Promise<void> | null = null

  const isLoggedIn = computed(() => user.value !== null)

  /** 로그인 상태 구독 시작. 첫 확인이 끝나면 resolve (새로고침 후 상태 복원용) */
  function init(): Promise<void> {
    if (readyPromise === null) {
      readyPromise = new Promise((resolve) => {
        getService().onChange((next) => {
          user.value = next
          if (!ready.value) {
            ready.value = true
            resolve()
          }
        })
      })
    }
    return readyPromise
  }

  async function signUp(email: string, password: string, displayName: string) {
    user.value = await getService().signUp(email, password, displayName)
  }

  async function signIn(email: string, password: string) {
    user.value = await getService().signIn(email, password)
  }

  async function signOut() {
    await getService().signOut()
    user.value = null
  }

  return { user, ready, isLoggedIn, init, signUp, signIn, signOut }
})
