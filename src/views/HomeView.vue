<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <section>
    <h1>안녕하세요, {{ auth.user?.displayName ?? '용사' }}님!</h1>
    <p>숙제 보드는 다음 단계에서 만들 예정이에요.</p>
  </section>
</template>
