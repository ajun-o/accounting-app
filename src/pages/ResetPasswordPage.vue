<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { supabase } from '@/utils/supabase';
import { 
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  HeartIcon
} from '@heroicons/vue/24/outline';

const router = useRouter();
const userStore = useUserStore();

const newPassword = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const errors = ref<Record<string, string>>({});
const isSuccess = ref(false);
const isValidLink = ref(false);
const isChecking = ref(true);

const isLoading = userStore.isLoading;
const error = userStore.error;

let authSubscription: any = null;

onMounted(() => {
  // 监听认证状态变化，处理密码恢复
  authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      // 密码恢复链接有效
      isValidLink.value = true;
      isChecking.value = false;
    } else if (event === 'SIGNED_IN' && session) {
      // 用户已通过其他方式登录
      isValidLink.value = true;
      isChecking.value = false;
    }
  });

  // 检查当前URL是否有token
  const hash = window.location.hash;
  if (!hash.includes('access_token') && !hash.includes('type=recovery')) {
    // 如果没有token，延迟检查，因为Supabase可能需要时间解析hash
    setTimeout(() => {
      if (!isValidLink.value) {
        isChecking.value = false;
      }
    }, 2000);
  }
});

onUnmounted(() => {
  if (authSubscription) {
    authSubscription.data.subscription.unsubscribe();
  }
});

function validateForm() {
  errors.value = {};
  
  if (!newPassword.value) {
    errors.value.password = '请输入新密码';
  } else if (newPassword.value.length < 6) {
    errors.value.password = '密码至少需要6个字符';
  }
  
  if (!confirmPassword.value) {
    errors.value.confirmPassword = '请确认密码';
  } else if (confirmPassword.value !== newPassword.value) {
    errors.value.confirmPassword = '两次输入的密码不一致';
  }
  
  return Object.keys(errors.value).length === 0;
}

async function handleSubmit() {
  if (!validateForm()) return;
  
  const success = await userStore.updatePassword(newPassword.value);
  
  if (success) {
    isSuccess.value = true;
    // 3秒后自动跳转到登录页
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  }
}
</script>

<template>
  <div class="reset-page">
    <!-- 背景 -->
    <div class="reset-bg">
      <div class="bg-blob blob-1"></div>
      <div class="bg-blob blob-2"></div>
    </div>
    
    <!-- 内容 -->
    <div class="reset-content">
      <!-- Logo -->
      <div class="reset-logo">
        <div class="logo-icon">
          <HeartIcon class="w-8 h-8" />
        </div>
        <h1 class="logo-text">共同记账</h1>
      </div>
      
      <!-- 卡片 -->
      <div class="reset-card">
        <!-- 检查中 -->
        <template v-if="isChecking">
          <div class="checking-state">
            <div class="spinner-large"></div>
            <p class="checking-text">正在验证链接...</p>
          </div>
        </template>
        
        <!-- 链接无效 -->
        <template v-else-if="!isValidLink">
          <div class="invalid-state">
            <div class="invalid-icon">✕</div>
            <h2 class="invalid-title">链接无效或已过期</h2>
            <p class="invalid-text">重置密码链接可能已过期，请重新请求</p>
            <button class="submit-btn" @click="router.push('/login')">
              返回登录页
            </button>
          </div>
        </template>
        
        <!-- 重置成功 -->
        <template v-else-if="isSuccess">
          <div class="success-state">
            <div class="success-icon">✓</div>
            <h2 class="success-title">密码重置成功</h2>
            <p class="success-text">您的密码已成功更新</p>
            <p class="success-hint">3秒后自动跳转到登录页...</p>
            <button class="submit-btn" @click="router.push('/login')">
              立即登录
            </button>
          </div>
        </template>
        
        <!-- 重置表单 -->
        <template v-else>
          <h2 class="card-title">设置新密码</h2>
          <p class="card-subtitle">请输入您的新密码</p>
          
          <form class="reset-form" @submit.prevent="handleSubmit">
            <!-- 新密码 -->
            <div class="form-group">
              <label class="form-label">
                <LockClosedIcon class="w-4 h-4" />
                <span>新密码</span>
              </label>
              <div class="password-input">
                <input
                  v-model="newPassword"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入新密码"
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
            
            <!-- 确认密码 -->
            <div class="form-group">
              <label class="form-label">
                <LockClosedIcon class="w-4 h-4" />
                <span>确认密码</span>
              </label>
              <div class="password-input">
                <input
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="请再次输入新密码"
                  class="form-input"
                  :class="{ error: errors.confirmPassword }"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <EyeIcon v-if="showConfirmPassword" class="w-5 h-5" />
                  <EyeSlashIcon v-else class="w-5 h-5" />
                </button>
              </div>
              <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
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
              <span v-if="!isLoading">确认重置</span>
              <span v-else class="spinner"></span>
            </button>
          </form>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reset-page {
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

.reset-bg {
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

.reset-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
}

/* Logo */
.reset-logo {
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
}

/* 卡片 */
.reset-card {
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
.reset-form {
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

/* 成功状态 */
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
}

.success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #34d399);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: white;
}

.success-title {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.success-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

.success-hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

/* 检查中状态 */
.checking-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 20px;
}

.spinner-large {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.checking-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}

/* 链接无效状态 */
.invalid-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
}

.invalid-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ef4444, #f87171);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: white;
}

.invalid-title {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.invalid-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}
</style>
