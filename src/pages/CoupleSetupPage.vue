<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { 
  UsersIcon, 
  PlusIcon, 
  LinkIcon,
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  CheckIcon
} from '@heroicons/vue/24/outline';

const router = useRouter();
const userStore = useUserStore();

const mode = ref<'select' | 'create' | 'join'>('select');
const coupleName = ref('');
const inviteCode = ref('');
const copied = ref(false);

const isLoading = computed(() => userStore.isLoading);
const error = computed(() => userStore.error);
const createdCouple = computed(() => userStore.couple);

async function handleCreate() {
  if (!coupleName.value.trim()) return;
  
  const success = await userStore.createCouple(coupleName.value.trim());
  if (success) {
    // 显示邀请码
    mode.value = 'create';
  }
}

async function handleJoin() {
  if (!inviteCode.value.trim()) return;
  
  const success = await userStore.joinCouple(inviteCode.value.trim());
  if (success) {
    router.push('/');
  }
}

function copyInviteCode() {
  if (createdCouple.value?.inviteCode) {
    navigator.clipboard.writeText(createdCouple.value.inviteCode);
    copied.value = true;
    setTimeout(() => copied.value = false, 2000);
  }
}

function goToHome() {
  router.push('/');
}
</script>

<template>
  <div class="setup-page">
    <!-- 背景 -->
    <div class="setup-bg">
      <div class="bg-blob blob-1"></div>
      <div class="bg-blob blob-2"></div>
    </div>
    
    <!-- 内容 -->
    <div class="setup-content">
      <!-- 返回按钮 -->
      <button v-if="mode !== 'select'" class="back-btn" @click="mode = 'select'">
        <ArrowLeftIcon class="w-5 h-5" />
        <span>返回</span>
      </button>
      
      <!-- 选择模式 -->
      <template v-if="mode === 'select'">
        <div class="setup-header">
          <div class="header-icon">
            <UsersIcon class="w-8 h-8" />
          </div>
          <h1 class="header-title">创建情侣空间</h1>
          <p class="header-subtitle">
            创建一个专属空间，与另一半一起记账
          </p>
        </div>
        
        <div class="setup-options">
          <button class="option-card" @click="mode = 'create'">
            <div class="option-icon create">
              <PlusIcon class="w-6 h-6" />
            </div>
            <div class="option-content">
              <h3>创建新空间</h3>
              <p>创建一个新的情侣记账空间</p>
            </div>
          </button>
          
          <button class="option-card" @click="mode = 'join'">
            <div class="option-icon join">
              <LinkIcon class="w-6 h-6" />
            </div>
            <div class="option-content">
              <h3>加入已有空间</h3>
              <p>通过邀请码加入另一半的空间</p>
            </div>
          </button>
        </div>
      </template>
      
      <!-- 创建空间 -->
      <template v-else-if="mode === 'create' && !createdCouple">
        <div class="setup-header">
          <h1 class="header-title">命名你们的空间</h1>
          <p class="header-subtitle">
            给你们的记账空间起个温馨的名字
          </p>
        </div>
        
        <div class="setup-form">
          <div class="form-group">
            <input
              v-model="coupleName"
              type="text"
              placeholder="例如：我们的小窝"
              class="form-input"
              maxlength="20"
            />
            <span class="input-hint">{{ coupleName.length }}/20</span>
          </div>
          
          <div v-if="error" class="form-error">
            {{ error }}
          </div>
          
          <button
            class="submit-btn"
            :disabled="!coupleName.trim() || isLoading"
            @click="handleCreate"
          >
            <span v-if="!isLoading">创建空间</span>
            <span v-else class="spinner"></span>
          </button>
        </div>
      </template>
      
      <!-- 显示邀请码 -->
      <template v-else-if="mode === 'create' && createdCouple">
        <div class="setup-header">
          <div class="success-icon">
            <CheckIcon class="w-8 h-8" />
          </div>
          <h1 class="header-title">空间创建成功！</h1>
          <p class="header-subtitle">
            将邀请码分享给另一半，让对方加入
          </p>
        </div>
        
        <div class="invite-code-section">
          <div class="invite-code-label">邀请码</div>
          <div class="invite-code-box">
            <span class="invite-code">{{ createdCouple.inviteCode }}</span>
            <button class="copy-btn" @click="copyInviteCode">
              <CheckIcon v-if="copied" class="w-5 h-5" />
              <DocumentDuplicateIcon v-else class="w-5 h-5" />
            </button>
          </div>
          <p class="invite-hint">点击复制邀请码，发送给另一半</p>
        </div>
        
        <button class="submit-btn" @click="goToHome">
          进入空间
        </button>
      </template>
      
      <!-- 加入空间 -->
      <template v-else-if="mode === 'join'">
        <div class="setup-header">
          <h1 class="header-title">输入邀请码</h1>
          <p class="header-subtitle">
            向另一半索取邀请码，输入后即可加入
          </p>
        </div>
        
        <div class="setup-form">
          <div class="form-group">
            <input
              v-model="inviteCode"
              type="text"
              placeholder="请输入8位邀请码"
              class="form-input code-input"
              maxlength="8"
              style="text-transform: uppercase;"
            />
          </div>
          
          <div v-if="error" class="form-error">
            {{ error }}
          </div>
          
          <button
            class="submit-btn"
            :disabled="inviteCode.length !== 8 || isLoading"
            @click="handleJoin"
          >
            <span v-if="!isLoading">加入空间</span>
            <span v-else class="spinner"></span>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.setup-page {
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

.setup-bg {
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

.setup-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
}

/* 返回按钮 */
.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 24px;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* 头部 */
.setup-header {
  text-align: center;
  margin-bottom: 32px;
}

.header-icon {
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

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #30d158, #34c759);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: white;
  box-shadow: 0 8px 32px rgba(48, 209, 88, 0.4);
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.header-subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.5);
}

/* 选项卡片 */
.setup-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(28, 28, 30, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.option-card:hover {
  background: rgba(28, 28, 30, 0.95);
  border-color: rgba(99, 102, 241, 0.3);
  transform: translateY(-2px);
}

.option-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.option-icon.create {
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
}

.option-icon.join {
  background: rgba(236, 72, 153, 0.2);
  color: #f472b6;
}

.option-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.option-content p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

/* 表单 */
.setup-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
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

.code-input {
  font-size: 24px;
  letter-spacing: 8px;
  text-align: center;
  font-weight: 600;
}

.input-hint {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
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
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
}

.submit-btn:disabled {
  opacity: 0.5;
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

/* 邀请码 */
.invite-code-section {
  background: rgba(28, 28, 30, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 24px;
  text-align: center;
}

.invite-code-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 12px;
}

.invite-code-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.invite-code {
  font-size: 36px;
  font-weight: 700;
  color: white;
  letter-spacing: 4px;
  font-family: 'SF Mono', monospace;
}

.copy-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: rgba(99, 102, 241, 0.2);
}

.invite-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
