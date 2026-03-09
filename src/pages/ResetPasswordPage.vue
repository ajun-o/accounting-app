<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const userStore = useUserStore()

const newPassword = ref('')
const confirmPassword = ref('')
const errors = ref<Record<string, string>>({})
const isSuccess = ref(false)
const isValidLink = ref(false)
const isChecking = ref(true)

const isLoading = userStore.isLoading
const error = userStore.error

let authSubscription: any = null

onMounted(() => {
  authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      isValidLink.value = true
      isChecking.value = false
    } else if (event === 'SIGNED_IN' && session) {
      isValidLink.value = true
      isChecking.value = false
    }
  })

  const hash = window.location.hash
  if (!hash.includes('access_token') && !hash.includes('type=recovery')) {
    setTimeout(() => {
      if (!isValidLink.value) isChecking.value = false
    }, 2000)
  }
})

onUnmounted(() => {
  if (authSubscription) authSubscription.data.subscription.unsubscribe()
})

function validateForm() {
  errors.value = {}

  if (!newPassword.value) {
    errors.value.password = '请输入新密码'
  } else if (newPassword.value.length < 6) {
    errors.value.password = '密码至少需要 6 个字符'
  }

  if (!confirmPassword.value) {
    errors.value.confirmPassword = '请确认密码'
  } else if (confirmPassword.value !== newPassword.value) {
    errors.value.confirmPassword = '两次输入的密码不一致'
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return

  const success = await userStore.updatePassword(newPassword.value)
  if (success) {
    isSuccess.value = true
    setTimeout(() => router.push('/login'), 3000)
  }
}
</script>

<template>
  <div class="page">
    <div class="card">
      <h1>重置密码</h1>

      <template v-if="isChecking">
        <p>正在验证链接...</p>
      </template>

      <template v-else-if="!isValidLink">
        <p class="error">链接无效或已过期，请重新申请。</p>
        <button @click="router.push('/login')">返回登录</button>
      </template>

      <template v-else-if="isSuccess">
        <p>密码重置成功，3 秒后跳转到登录页。</p>
        <button @click="router.push('/login')">立即登录</button>
      </template>

      <template v-else>
        <form @submit.prevent="handleSubmit">
          <input v-model="newPassword" type="password" placeholder="请输入新密码" />
          <div v-if="errors.password" class="error">{{ errors.password }}</div>

          <input v-model="confirmPassword" type="password" placeholder="请再次输入新密码" />
          <div v-if="errors.confirmPassword" class="error">{{ errors.confirmPassword }}</div>

          <div v-if="error" class="error">{{ error }}</div>
          <button type="submit" :disabled="isLoading">{{ isLoading ? '提交中...' : '确认重置' }}</button>
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; display: grid; place-items: center; background: #0b0b0b; color: #fff; }
.card { width: min(92vw, 420px); background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px; padding: 24px; }
h1 { margin: 0 0 12px; }
form { display: grid; gap: 10px; }
input { padding: 10px 12px; border-radius: 8px; border: 1px solid #333; background: #111; color: #fff; }
button { padding: 10px 12px; border: none; border-radius: 8px; background: #4f46e5; color: #fff; cursor: pointer; }
.error { color: #fb7185; font-size: 13px; }
</style>
