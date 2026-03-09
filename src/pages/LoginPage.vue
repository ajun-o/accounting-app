<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const isLogin = ref(true)
const showForgotPassword = ref(false)
const resetEmail = ref('')
const resetSuccess = ref(false)

const form = ref({
  email: '',
  password: '',
  name: '',
})

const errors = ref<Record<string, string>>({})

const isLoading = computed(() => userStore.isLoading)
const error = computed(() => userStore.error)

function validateForm() {
  errors.value = {}

  if (!form.value.email) {
    errors.value.email = '请输入邮箱'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = '请输入有效的邮箱地址'
  }

  if (!form.value.password) {
    errors.value.password = '请输入密码'
  } else if (form.value.password.length < 6) {
    errors.value.password = '密码至少需要 6 个字符'
  }

  if (!isLogin.value && !form.value.name) {
    errors.value.name = '请输入昵称'
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return

  const success = isLogin.value
    ? await userStore.login(form.value.email, form.value.password)
    : await userStore.register(form.value.email, form.value.password, form.value.name)

  if (success) {
    router.push(userStore.hasCouple ? '/' : '/couple-setup')
  }
}

function toggleMode() {
  isLogin.value = !isLogin.value
  showForgotPassword.value = false
  errors.value = {}
  userStore.error = null
}

function showForgotPasswordForm() {
  showForgotPassword.value = true
  resetSuccess.value = false
  resetEmail.value = ''
  errors.value = {}
  userStore.error = null
}

function backToLogin() {
  showForgotPassword.value = false
  resetSuccess.value = false
  errors.value = {}
  userStore.error = null
}

async function handleResetPassword() {
  errors.value = {}

  if (!resetEmail.value) {
    errors.value.email = '请输入邮箱'
    return
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.value)) {
    errors.value.email = '请输入有效的邮箱地址'
    return
  }

  const success = await userStore.resetPassword(resetEmail.value)
  if (success) {
    resetSuccess.value = true
  }
}
</script>

<template>
  <div class="page">
    <div class="card">
      <h1>共同记账</h1>

      <template v-if="showForgotPassword">
        <h2>重置密码</h2>
        <p v-if="!resetSuccess">输入您的邮箱以接收重置链接</p>
        <p v-else>重置链接已发送到：{{ resetEmail }}</p>

        <form v-if="!resetSuccess" @submit.prevent="handleResetPassword">
          <input v-model="resetEmail" type="email" placeholder="请输入邮箱地址" />
          <div v-if="errors.email" class="error">{{ errors.email }}</div>
          <div v-if="error" class="error">{{ error }}</div>
          <button type="submit" :disabled="isLoading">{{ isLoading ? '发送中...' : '发送重置链接' }}</button>
        </form>

        <button @click="backToLogin">返回登录</button>
      </template>

      <template v-else>
        <h2>{{ isLogin ? '登录' : '注册' }}</h2>

        <form @submit.prevent="handleSubmit">
          <input v-if="!isLogin" v-model="form.name" type="text" placeholder="请输入昵称" />
          <div v-if="errors.name" class="error">{{ errors.name }}</div>

          <input v-model="form.email" type="email" placeholder="请输入邮箱地址" />
          <div v-if="errors.email" class="error">{{ errors.email }}</div>

          <input v-model="form.password" type="password" placeholder="请输入密码" />
          <div v-if="errors.password" class="error">{{ errors.password }}</div>
          <div v-if="error" class="error">{{ error }}</div>

          <button type="submit" :disabled="isLoading">{{ isLoading ? '处理中...' : (isLogin ? '登录' : '注册') }}</button>
        </form>

        <button v-if="isLogin" @click="showForgotPasswordForm">忘记密码？</button>

        <p>
          {{ isLogin ? '还没有账号？' : '已有账号？' }}
          <button @click="toggleMode">{{ isLogin ? '立即注册' : '立即登录' }}</button>
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; display: grid; place-items: center; background: #0b0b0b; color: #fff; }
.card { width: min(92vw, 420px); background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px; padding: 24px; }
h1 { margin: 0 0 12px; }
h2 { margin: 0 0 12px; }
form { display: grid; gap: 10px; margin-bottom: 10px; }
input { padding: 10px 12px; border-radius: 8px; border: 1px solid #333; background: #111; color: #fff; }
button { padding: 10px 12px; border: none; border-radius: 8px; background: #4f46e5; color: #fff; cursor: pointer; }
.error { color: #fb7185; font-size: 13px; }
p { color: #ccc; }
</style>
