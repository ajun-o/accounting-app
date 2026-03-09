<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const mode = ref<'select' | 'create' | 'join'>('select')
const coupleName = ref('')
const inviteCode = ref('')
const copied = ref(false)

const isLoading = computed(() => userStore.isLoading)
const error = computed(() => userStore.error)
const createdCouple = computed(() => userStore.couple)

async function handleCreate() {
  if (!coupleName.value.trim()) return
  const success = await userStore.createCouple(coupleName.value.trim())
  if (success) mode.value = 'create'
}

async function handleJoin() {
  if (!inviteCode.value.trim()) return
  const success = await userStore.joinCouple(inviteCode.value.trim())
  if (success) router.push('/')
}

function copyInviteCode() {
  if (createdCouple.value?.inviteCode) {
    navigator.clipboard.writeText(createdCouple.value.inviteCode)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
}
</script>

<template>
  <div class="page">
    <div class="card">
      <template v-if="mode === 'select'">
        <h1>创建情侣空间</h1>
        <p>创建一个专属空间，与另一半一起记账。</p>
        <div class="actions">
          <button @click="mode = 'create'">创建新空间</button>
          <button @click="mode = 'join'">加入已有空间</button>
        </div>
      </template>

      <template v-else-if="mode === 'create' && !createdCouple">
        <h1>给空间起个名字</h1>
        <input v-model="coupleName" type="text" maxlength="20" placeholder="例如：我们的小窝" />
        <div v-if="error" class="error">{{ error }}</div>
        <button :disabled="!coupleName.trim() || isLoading" @click="handleCreate">{{ isLoading ? '创建中...' : '创建空间' }}</button>
        <button class="ghost" @click="mode = 'select'">返回</button>
      </template>

      <template v-else-if="mode === 'create' && createdCouple">
        <h1>空间创建成功</h1>
        <p>把邀请码发给另一半即可加入。</p>
        <div class="code">{{ createdCouple.inviteCode }}</div>
        <button @click="copyInviteCode">{{ copied ? '已复制' : '复制邀请码' }}</button>
        <button class="ghost" @click="router.push('/')">进入空间</button>
      </template>

      <template v-else>
        <h1>输入邀请码</h1>
        <input v-model="inviteCode" type="text" maxlength="8" placeholder="请输入 8 位邀请码" style="text-transform: uppercase" />
        <div v-if="error" class="error">{{ error }}</div>
        <button :disabled="inviteCode.length !== 8 || isLoading" @click="handleJoin">{{ isLoading ? '加入中...' : '加入空间' }}</button>
        <button class="ghost" @click="mode = 'select'">返回</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; display: grid; place-items: center; background: #0b0b0b; color: #fff; }
.card { width: min(92vw, 420px); background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px; padding: 24px; }
h1 { margin: 0 0 12px; }
p { color: #ccc; margin-bottom: 12px; }
.actions { display: grid; gap: 10px; }
input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #333; background: #111; color: #fff; margin-bottom: 10px; }
button { padding: 10px 12px; border: none; border-radius: 8px; background: #4f46e5; color: #fff; cursor: pointer; margin-top: 8px; }
button.ghost { background: #2a2a2a; }
.code { margin: 10px 0; font-size: 28px; letter-spacing: 4px; font-weight: 700; }
.error { color: #fb7185; font-size: 13px; }
</style>
