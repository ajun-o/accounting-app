<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon,
  HeartIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/vue/24/outline';

const router = useRouter();
const userStore = useUserStore();

const isLogin = ref(true);
const showPassword = ref(false);

const form = ref({
  email: '',
  password: '',
  name: '',
});

const errors = ref<Record<string, string>>({});

const isLoading = computed(() => userStore.isLoading);
const error = computed(() => userStore.error);

function validateForm() {
  errors.value = {};
  
  if (!form.value.email) {
    errors.value.email = '请输入邮箱';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = '请输入有效的邮箱地址';
  }
  
  if (!form.value.password) {
    errors.value.password = '请输入密码';
  } else if (form.value.password.length < 6) {
    errors.value.password = '密码至少需要6个字符';
  }
  
  if (!isLogin.value && !form.value.name) {
    errors.value.name = '请输入昵称';
  }
  
  return Object.keys(errors.value).length === 0;
}

async function handleSubmit() {
  if (!validateForm()) return;
  
  let success;
  
  if (isLogin.value) {
    success = await userStore.login(form.value.email, form.value.password);
  } else {
    success = await userStore.register(
      form.value.email, 
      form.value.password, 
      form.value.name
    );
  }
  
  if (success) {
    // 检查是否有情侣空间
    if (userStore.hasCouple) {
      router.push('/');
    } else {
      router.push('/couple-setup');
    }
  }
}

function toggleMode() {
  isLogin.value = !isLogin.value;
  errors.value = {};
  userStore.error = null;
}
</script>

<template>
  <div class="login-page">
    <!-- 背景 -->
    <div class="login-bg">
      <div class="bg-blob blob-1"></div>
      <div class="bg-blob blob-2"></div>
    </div>
    
    <!-- 内容 -->
    <div class="login-content">
      <!-- Logo -->
      <div class="login-logo">
        <div class="logo-icon">
          <HeartIcon class="w-8 h-8" />
        </div>
        <h1 class="logo-text">共同记账</h1>
        <p class="logo-subtitle">情侣间的记账小助手</p>
      </div>
      
      <!-- 表单卡片 -->
      <div class="login-card">
        <h2 class="card-title">{{ isLogin ? '欢迎回来' : '创建账号' }}</h2>
        <p class="card-subtitle">
          {{ isLogin ? '登录以继续管理你们的账单' : '开始你们共同的记账之旅' }}
        </p>
        
        <form class="login-form" @submit.prevent="handleSubmit">
          <!-- 昵称（仅注册） -->
          <div v-if="!isLogin" class="form-group">
            <label class="form-label">
              <UserIcon class="w-4 h-4" />
              <span>昵称</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="请输入你的昵称"
              class="form-input"
              :class="{ error: errors.name }"
            />
            <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
          </div>
          
          <!-- 邮箱 -->
          <div class="form-group">
            <label class="form-label">
              <EnvelopeIcon class="w-4 h-4" />
              <span>邮箱</span>
            </label>
            <input
              v-model="form.email"
              type="email"
              placeholder="请输入邮箱地址"
              class="form-input"
              :class="{ error: errors.email }"
            />
            <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
          </div>
          
          <!-- 密码 -->
          <div class="form-group">
            <label class="form-label">
              <LockClosedIcon class="w-4 h-4" />
              <span>密码</span>
            </label>
            <div class="password-input">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                class="form-input"
                :class="{ error: errors.password }"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                <EyeIcon v-if="showPassword" class="w-5 h-5" />
                <EyeSlashIcon v-else class="w-5 h-5" />
              </button>
            </div>
            <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
          </div>
          
          <!-- 错误提示 -->
          <div v-if="error" class="form-error">
            {{ error }}
          </div>
          
          <!-- 提交按钮 -->
          <button
            type="submit"
            class="submit-btn"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">{{ isLogin ? '登录' : '注册' }}</span>
            <span v-else class="spinner"></span>
          </button>
        </form>
        
        <!-- 切换模式 -->
        <div class="form-footer">
          <span>{{ isLogin ? '还没有账号？' : '已有账号？' }}</span>
          <button type="button" class="toggle-btn" @click="toggleMode">
            {{ isLogin ? '立即注册' : '立即登录' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: #000000;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.login-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.blob-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #6366f1 0%, transparent 70%);
  top: -100px;
  right: -100px;
}

.blob-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #ec4899 0%, transparent 70%);
  bottom: -50px;
  left: -100px;
}

.login-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
}

/* Logo */
.login-logo {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: white;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4);
}

.logo-text {
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.logo-subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.5);
}

/* 卡片 */
.login-card {
  background: rgba(28, 28, 30, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.card-title {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
  text-align: center;
}

.card-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  margin-bottom: 28px;
}

/* 表单 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.form-label svg {
  color: #6366f1;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  font-size: 16px;
  color: white;
  outline: none;
  transition: all 0.2s ease;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-input:focus {
  border-color: #6366f1;
  background: rgba(255, 255, 255, 0.08);
}

.form-input.error {
  border-color: #ff375f;
}

.password-input {
  position: relative;
}

.password-input .form-input {
  padding-right: 48px;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: rgba(255, 255, 255, 0.7);
}

.error-text {
  font-size: 12px;
  color: #ff375f;
}

.form-error {
  padding: 12px 16px;
  background: rgba(255, 55, 95, 0.1);
  border: 1px solid rgba(255, 55, 95, 0.2);
  border-radius: 10px;
  font-size: 14px;
  color: #ff375f;
  text-align: center;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 底部 */
.form-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.toggle-btn {
  background: transparent;
  border: none;
  color: #6366f1;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-left: 4px;
  transition: color 0.2s ease;
}

.toggle-btn:hover {
  color: #818cf8;
}
</style>
