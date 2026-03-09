<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useBillsStore } from '@/stores/bills';
import {
  PlusIcon,
  FireIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon,
  BackspaceIcon,
  MicrophoneIcon,
  TruckIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  WalletIcon,
  ChartPieIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const userStore = useUserStore();
const billsStore = useBillsStore();

// 鐘舵€?
const isPanelOpen = ref(false);
const isVoicePanelOpen = ref(false);
const newAmountStr = ref('0');
const showInstallPrompt = ref(false);
const openedMenuBillId = ref<string | null>(null);
const editingBill = ref<any | null>(null);
const isSubmitting = ref(false);
const billsLoaded = ref(false);
const isRecording = ref(false);
const selectedTransactionType = ref<'expense' | 'income'>('expense');

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

// 鍒嗙被鏁版嵁
const categories = [
  { name: 'Food', icon: FireIcon, color: '#ff9f0a' },
  { name: 'Shopping', icon: ShoppingBagIcon, color: '#bf5af2' },
  { name: 'Transport', icon: TruckIcon, color: '#0a84ff' },
  { name: 'Entertainment', icon: BuildingStorefrontIcon, color: '#30d158' },
];
const incomeCategory = { name: 'Income', icon: WalletIcon, color: '#30d158' };
const selectedCategory = ref(categories[0]);

// 璁＄畻灞炴€?
const user = computed(() => userStore.user);
const partner = computed(() => userStore.partner);
const couple = computed(() => userStore.couple);
const recentBills = computed(() => billsStore.recentBills);
const stats = computed(() => billsStore.stats);

const totalExpenditure = computed(() => billsStore.totalExpenditure);
const totalIncome = computed(() => billsStore.totalIncome);
const netBalance = computed(() => billsStore.netBalance);
const myExpenditure = computed(() => billsStore.myExpenditure);
const partnerExpenditure = computed(() => billsStore.partnerExpenditure);

const displayTotalExpenditure = ref(0);

const myPercentage = computed(() => 
  stats.value?.myPercentage || 
  (totalExpenditure.value === 0 ? 0 : (myExpenditure.value / totalExpenditure.value) * 100)
);

const partnerPercentage = computed(() => 
  stats.value?.partnerPercentage || 
  (totalExpenditure.value === 0 ? 0 : (partnerExpenditure.value / totalExpenditure.value) * 100)
);

const formattedAmount = computed(() =>
  parseFloat(newAmountStr.value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
);

const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

// 鐢熷懡鍛ㄦ湡
onMounted(async () => {
  // 妫€鏌ュ畨瑁呮彁绀?
  if (localStorage.getItem('installPromptDismissed') !== 'true') {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (!isStandalone) {
      setTimeout(() => {
        showInstallPrompt.value = true;
      }, 2000);
    }
  }

  // 鍔犺浇璐﹀崟鏁版嵁
  await billsStore.refresh();
  billsLoaded.value = true;
  displayTotalExpenditure.value = totalExpenditure.value;
});

// 鐩戝惉鎬婚鍙樺寲锛屾坊鍔犲姩鐢?
let animationFrame: number | null = null;
watch(totalExpenditure, (newValue) => {
  if (animationFrame) cancelAnimationFrame(animationFrame);

  const startValue = displayTotalExpenditure.value;
  const diff = newValue - startValue;
  const duration = 800;
  const startTime = performance.now();

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);

    displayTotalExpenditure.value = startValue + diff * easeOut;

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate);
    }
  };

  animationFrame = requestAnimationFrame(animate);
});

// 鏂规硶
function dismissInstallPrompt() {
  showInstallPrompt.value = false;
  localStorage.setItem('installPromptDismissed', 'true');
}

async function handleLogout() {
  userStore.logout();
  router.push('/login');
}

let pressTimer: ReturnType<typeof setTimeout> | null = null;

function handlePressStart() {
  pressTimer = setTimeout(() => {
    isVoicePanelOpen.value = true;
    pressTimer = null;
  }, 500);
}

function handlePressEnd() {
  if (pressTimer) {
    clearTimeout(pressTimer);
    isPanelOpen.value = true;
    newAmountStr.value = '0';
    editingBill.value = null;
  }
}

async function toggleRecording() {
  if (isRecording.value) {
    mediaRecorder?.stop();
    isRecording.value = false;
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    isRecording.value = true;
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      console.log('褰曢煶瀹屾垚', audioBlob);
      isRecording.value = false;
      isVoicePanelOpen.value = false;
    };

    mediaRecorder.start();
  } catch (err) {
    console.error('楹﹀厠椋庢潈闄愯幏鍙栧け璐?', err);
    isRecording.value = false;
  }
}

function handleKeyPress(key: string) {
  if (key === 'del') {
    newAmountStr.value = newAmountStr.value.length > 1
      ? newAmountStr.value.slice(0, -1)
      : '0';
  } else if (key === '.' && !newAmountStr.value.includes('.')) {
    newAmountStr.value += '.';
  } else if (key !== '.') {
    if (newAmountStr.value === '0') {
      newAmountStr.value = key;
    } else if (newAmountStr.value.length < 10) {
      newAmountStr.value += key;
    }
  }
}

async function handleTransactionSubmit() {
  if (isSubmitting.value) return;

  const amount = parseFloat(newAmountStr.value);
  if (!amount || isNaN(amount) || amount <= 0) {
    closePanel();
    return;
  }

  const signedAmount = selectedTransactionType.value === 'income'
    ? -Math.abs(amount)
    : Math.abs(amount);
  const description = selectedTransactionType.value === 'income'
    ? incomeCategory.name
    : selectedCategory.value.name;
  const category = selectedTransactionType.value === 'income'
    ? incomeCategory.name
    : selectedCategory.value.name;

  isSubmitting.value = true;

  try {
    if (editingBill.value) {
      await billsStore.updateBill(editingBill.value.id, {
        amount: signedAmount,
        description,
        category,
      });
    } else {
      await billsStore.createBill({
        amount: signedAmount,
        description,
        category,
      });
    }
  } catch (error) {
    console.error('淇濆瓨璐﹀崟澶辫触:', error);
  }

  isSubmitting.value = false;
  closePanel();
}

function closePanel() {
  isPanelOpen.value = false;
  newAmountStr.value = '0';
  selectedCategory.value = categories[0];
  selectedTransactionType.value = 'expense';
  editingBill.value = null;
}

async function deleteBill(id: string) {
  try {
    await billsStore.deleteBill(id);
    openedMenuBillId.value = null;
  } catch (error) {
    console.error('鍒犻櫎璐﹀崟澶辫触:', error);
  }
}

function startEditing(bill: any) {
  editingBill.value = bill;
  selectedTransactionType.value = bill.amount < 0 ? 'income' : 'expense';
  newAmountStr.value = Math.abs(bill.amount).toString();
  selectedCategory.value = categories.find(c => c.name === bill.category) || categories[0];
  openedMenuBillId.value = null;
  isPanelOpen.value = true;
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '浠婂ぉ';
  if (days === 1) return '鏄ㄥぉ';
  if (days < 7) return `${days}澶╁墠`;

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function getCategoryColor(categoryName: string): string {
  return categories.find(c => c.name === categoryName)?.color || '#6366f1';
}

function getCategoryIcon(categoryName: string) {
  return categories.find(c => c.name === categoryName)?.icon || FireIcon;
}

function formatSignedAmount(amount: number): string {
  const absAmount = Math.abs(amount).toFixed(2);
  return amount < 0 ? `+${absAmount}` : `-${absAmount}`;
}
</script>

<template>
  <div class="app-container">
    <!-- 鑳屾櫙娓愬彉 -->
    <div class="ambient-bg">
      <div class="ambient-blob blob-1"></div>
      <div class="ambient-blob blob-2"></div>
      <div class="ambient-blob blob-3"></div>
    </div>

    <!-- 涓诲唴瀹瑰尯 -->
    <main class="main-content" :class="{ 'panel-open': isPanelOpen || isVoicePanelOpen }">
      <!-- 椤堕儴鏍囬 -->
      <header class="page-header animate-ios-slide-up">
        <div class="header-left">
          <div class="header-icon">
            <WalletIcon class="w-6 h-6" />
          </div>
          <div class="header-info">
            <h1 class="header-title">{{ couple?.name || '鍏卞悓璁拌处' }}</h1>
            <div class="header-users" v-if="user">
              <span class="user-badge me">{{ user.name }}</span>
              <span v-if="partner" class="user-badge partner">{{ partner.name }}</span>
              <span v-else class="user-badge waiting">绛夊緟鍔犲叆</span>
            </div>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout">
          <ArrowRightOnRectangleIcon class="w-5 h-5" />
        </button>
      </header>

      <!-- 鎬绘敮鍑哄崱鐗?-->
      <section class="total-card animate-ios-slide-up" style="animation-delay: 0.05s">
        <div class="total-label">Monthly Expense</div>
        <div class="total-amount">
          <span class="currency">楼</span>
          <span class="amount">{{ displayTotalExpenditure.toFixed(2) }}</span>
        </div>
        <div class="total-meta">
          <span class="meta-income">Income +¥{{ totalIncome.toFixed(2) }}</span>
          <span class="meta-balance">Balance ¥{{ netBalance.toFixed(2) }}</span>
        </div>
        <div class="total-decoration"></div>
      </section>

      <!-- 鏀嚭姣斾緥 -->
      <section class="ratio-card animate-ios-slide-up" style="animation-delay: 0.1s">
        <div class="ratio-header">
          <div class="ratio-person" :class="{ active: myPercentage >= partnerPercentage }">
            <div class="person-avatar" style="--avatar-color: #6366f1">
              <span>{{ user?.name?.charAt(0) || 'M' }}</span>
            </div>
            <div class="person-info">
              <span class="person-name">{{ user?.name || 'Me' }}</span>
              <span class="person-percent">{{ myPercentage.toFixed(0) }}%</span>
            </div>
          </div>
          <div class="ratio-divider">VS</div>
          <div class="ratio-person" :class="{ active: partnerPercentage > myPercentage }">
            <div class="person-avatar" style="--avatar-color: #ff375f">
              <span>{{ partner?.name?.charAt(0) || '?' }}</span>
            </div>
            <div class="person-info">
              <span class="person-name">{{ partner?.name || 'Partner' }}</span>
              <span class="person-percent">{{ partnerPercentage.toFixed(0) }}%</span>
            </div>
          </div>
        </div>

        <div class="ratio-bar">
          <div class="ratio-track">
            <div class="ratio-fill ratio-fill-a" :style="{ width: `${myPercentage}%` }"></div>
            <div class="ratio-fill ratio-fill-b" :style="{ width: `${partnerPercentage}%` }"></div>
          </div>
        </div>

        <div class="ratio-amounts">
          <span class="amount-a">楼{{ myExpenditure.toFixed(2) }}</span>
          <span class="amount-b">楼{{ partnerExpenditure.toFixed(2) }}</span>
        </div>
      </section>

      <!-- 鏈€杩戣处鍗?-->
      <section class="bills-section animate-ios-slide-up" style="animation-delay: 0.15s">
        <div class="section-header">
          <div class="section-title">
            <ChartPieIcon class="w-5 h-5" />
            <span>Recent Bills</span>
          </div>
          <span class="bill-count">{{ recentBills.length }} items</span>
        </div>

        <div class="bills-list" v-if="billsLoaded">
          <TransitionGroup name="bill-list">
            <div
              v-for="(bill, index) in recentBills"
              :key="bill.id"
              class="bill-item"
              :style="{ animationDelay: `${index * 0.05}s` }"
            >
              <div class="bill-icon" :style="{ backgroundColor: `${getCategoryColor(bill.category)}20` }">
                <component
                  :is="getCategoryIcon(bill.category)"
                  class="w-5 h-5"
                  :style="{ color: getCategoryColor(bill.category) }"
                />
              </div>

              <div class="bill-content">
                <div class="bill-main">
                  <span class="bill-title">{{ bill.description }}</span>
                  <span class="bill-amount" :class="{ income: bill.amount < 0, expense: bill.amount >= 0 }">{{ formatSignedAmount(bill.amount) }}</span>
                </div>
                <div class="bill-meta">
                  <span class="bill-payer" :class="{ me: bill.is_my_bill, partner: !bill.is_my_bill }">
                    {{ bill.is_my_bill ? 'Me' : (partner?.name || 'Partner') }} paid
                  </span>
                  <span class="bill-date">{{ formatDate(bill.created_at) }}</span>
                </div>
              </div>

              <button
                class="bill-menu-btn"
                @click.stop="openedMenuBillId = openedMenuBillId === bill.id ? null : bill.id"
              >
                <EllipsisHorizontalIcon class="w-5 h-5" />
              </button>

              <Transition name="menu-pop">
                <div v-if="openedMenuBillId === bill.id" class="bill-actions">
                  <button @click="startEditing(bill)" class="action-btn edit">
                    <PencilIcon class="w-4 h-4" />
                  </button>
                  <button @click="deleteBill(bill.id)" class="action-btn delete">
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </Transition>
            </div>
          </TransitionGroup>

          <div v-if="recentBills.length === 0" class="empty-state">
            <div class="empty-icon">
              <WalletIcon class="w-12 h-12" />
            </div>
            <p class="empty-text">No bills yet</p>
            <p class="empty-subtext">Tap the button to add your first record</p>
          </div>
        </div>

        <div v-else class="bills-loading">
          <div v-for="i in 3" :key="i" class="skeleton-item">
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 鎮诞鎸夐挳 -->
    <div class="fab-wrapper">
      <button
        class="fab"
        @mousedown.prevent="handlePressStart"
        @mouseup.prevent="handlePressEnd"
        @touchstart.prevent="handlePressStart"
        @touchend.prevent="handlePressEnd"
      >
        <div class="fab-bg"></div>
        <div class="fab-icon">
          <PlusIcon class="w-8 h-8" />
        </div>
      </button>
      <span class="fab-hint">闀挎寜璇煶</span>
    </div>

    <!-- 璁拌处闈㈡澘 -->
    <Transition name="panel">
      <div v-if="isPanelOpen" class="panel-overlay">
        <div class="panel-backdrop" @click="closePanel"></div>
        <div class="panel-sheet">
          <div class="panel-handle" @click="closePanel">
            <div class="handle-bar"></div>
          </div>

          <div class="amount-display">
            <span class="amount-currency">楼</span>
            <span class="amount-value">{{ formattedAmount }}</span>
          </div>

                    <div class="type-switch">
            <button
              class="type-btn"
              :class="{ active: selectedTransactionType === 'expense' }"
              @click="selectedTransactionType = 'expense'"
            >
              支出
            </button>
            <button
              class="type-btn"
              :class="{ active: selectedTransactionType === 'income' }"
              @click="selectedTransactionType = 'income'"
            >
              收入
            </button>
          </div>

          <div v-if="selectedTransactionType === 'expense'" class="category-selector">
            <button
              v-for="category in categories"
              :key="category.name"
              class="category-btn"
              :class="{ active: selectedCategory.name === category.name }"
              @click="selectedCategory = category"
            >
              <div class="category-icon" :style="{ backgroundColor: selectedCategory.name === category.name ? `${category.color}30` : 'rgba(120, 120, 128, 0.16)' }">
                <component :is="category.icon" class="w-6 h-6" :style="{ color: selectedCategory.name === category.name ? category.color : 'rgba(255, 255, 255, 0.6)' }" />
              </div>
              <span>{{ category.name }}</span>
            </button>
          </div>

          <div class="keypad">
            <button
              v-for="key in keypad"
              :key="key"
              class="keypad-btn"
              :class="{ 'keypad-del': key === 'del', 'keypad-zero': key === '0' }"
              @click="handleKeyPress(key)"
            >
              <span v-if="key !== 'del'" class="keypad-text">{{ key }}</span>
              <BackspaceIcon v-else class="w-6 h-6" />
            </button>
          </div>

          <button class="submit-btn" :disabled="isSubmitting" @click="handleTransactionSubmit">
            <span v-if="!isSubmitting">{{ editingBill ? '淇濆瓨淇敼' : '纭璁拌处' }}</span>
            <span v-else class="spinner"></span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 璇煶闈㈡澘 -->
    <Transition name="voice">
      <div v-if="isVoicePanelOpen" class="voice-overlay">
        <div class="voice-backdrop" @click="isVoicePanelOpen = false"></div>
        <div class="voice-content">
          <p class="voice-hint">{{ isRecording ? 'Listening...' : 'Tap to start recording' }}</p>
          <button class="voice-btn" :class="{ recording: isRecording }" @click="toggleRecording">
            <div class="voice-btn-ring"></div>
            <div class="voice-btn-inner">
              <MicrophoneIcon class="w-10 h-10" />
            </div>
          </button>
          <p class="voice-status">{{ isRecording ? '璇村嚭娑堣垂鍐呭' : '鍑嗗灏辩华' }}</p>
          <button class="voice-close" @click="isVoicePanelOpen = false">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  min-height: 100dvh;
  background: #000000;
  position: relative;
  overflow: hidden;
}

.ambient-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.ambient-blob {
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
  background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
  bottom: 20%;
  left: -100px;
}

.blob-3 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, #ec4899 0%, transparent 70%);
  bottom: -50px;
  right: 20%;
}

.main-content {
  position: relative;
  z-index: 1;
  padding: 20px;
  padding-top: calc(20px + env(safe-area-inset-top, 0));
  padding-bottom: calc(100px + env(safe-area-inset-bottom, 0));
  max-width: 430px;
  margin: 0 auto;
}

.main-content.panel-open {
  transform: scale(0.96);
  filter: blur(8px);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.header-users {
  display: flex;
  gap: 6px;
}

.user-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.user-badge.me {
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
}

.user-badge.partner {
  background: rgba(255, 55, 95, 0.2);
  color: #fb7185;
}

.user-badge.waiting {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
}

.logout-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}

.total-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1));
  border-radius: 24px;
  padding: 28px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.total-label {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}

.total-amount {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.currency {
  font-size: 24px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8px;
}

.amount {
  font-size: 48px;
  font-weight: 700;
  color: white;
  letter-spacing: -1px;
}

.total-meta {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  font-weight: 600;
}

.meta-income {
  color: #34d399;
}

.meta-balance {
  color: rgba(255, 255, 255, 0.82);
}

.ratio-card {
  background: rgba(28, 28, 30, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.ratio-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.ratio-person {
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0.6;
}

.ratio-person.active {
  opacity: 1;
}

.person-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--avatar-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.person-name {
  font-size: 15px;
  font-weight: 600;
  color: white;
}

.person-percent {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.ratio-divider {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
}

.ratio-bar {
  margin-bottom: 12px;
}

.ratio-track {
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
}

.ratio-fill {
  height: 100%;
  transition: width 0.6s ease;
}

.ratio-fill-a {
  background: linear-gradient(90deg, #6366f1, #818cf8);
  border-radius: 4px 0 0 4px;
}

.ratio-fill-b {
  background: linear-gradient(90deg, #f43f5e, #fb7185);
  border-radius: 0 4px 4px 0;
}

.ratio-amounts {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 500;
}

.amount-a {
  color: #818cf8;
}

.amount-b {
  color: #fb7185;
}

.bills-section {
  flex: 1;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.bill-count {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.bills-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bill-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: rgba(28, 28, 30, 0.5);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  position: relative;
}

.bill-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bill-content {
  flex: 1;
  min-width: 0;
}

.bill-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.bill-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.bill-amount {
  font-size: 16px;
  font-weight: 700;
  color: white;
}

.bill-amount.expense {
  color: #fb7185;
}

.bill-amount.income {
  color: #34d399;
}

.bill-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.bill-payer.me {
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  padding: 2px 8px;
  border-radius: 4px;
}

.bill-payer.partner {
  background: rgba(244, 63, 94, 0.2);
  color: #fb7185;
  padding: 2px 8px;
  border-radius: 4px;
}

.bill-date {
  color: rgba(255, 255, 255, 0.4);
}

.bill-menu-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  background: transparent;
  border: none;
  cursor: pointer;
}

.bill-actions {
  position: absolute;
  right: 52px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.8);
  padding: 6px;
  border-radius: 10px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
}

.action-btn.edit {
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
}

.action-btn.delete {
  background: rgba(244, 63, 94, 0.2);
  color: #fb7185;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.2);
  margin-bottom: 20px;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
}

.fab-wrapper {
  position: fixed;
  bottom: calc(24px + env(safe-area-inset-bottom, 0));
  right: 24px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.fab {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: transparent;
  padding: 0;
}

.fab-bg {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.5);
}

.fab-icon {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.fab-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
}

.panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.panel-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.panel-sheet {
  position: relative;
  background: linear-gradient(180deg, #1c1c1e 0%, #000000 100%);
  border-radius: 28px 28px 0 0;
  padding: 20px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0));
  max-height: 85vh;
  overflow-y: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.panel-handle {
  display: flex;
  justify-content: center;
  padding: 8px 0 16px;
  cursor: pointer;
}

.handle-bar {
  width: 36px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.amount-display {
  text-align: center;
  margin-bottom: 24px;
}

.amount-currency {
  font-size: 32px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  vertical-align: top;
  margin-right: 4px;
}

.amount-value {
  font-size: 56px;
  font-weight: 300;
  color: white;
  letter-spacing: -1px;
}

.type-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}

.type-btn {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.75);
  border-radius: 12px;
  padding: 10px 0;
  font-size: 14px;
  font-weight: 600;
}

.type-btn.active {
  background: rgba(99, 102, 241, 0.25);
  border-color: rgba(99, 102, 241, 0.45);
  color: #c7d2fe;
}

.category-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.category-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  flex-shrink: 0;
}

.category-btn.active {
  background: rgba(255, 255, 255, 0.08);
}

.category-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-btn span {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

.category-btn.active span {
  color: white;
}

.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.keypad-btn {
  aspect-ratio: 1.6;
  background: rgba(255, 255, 255, 0.06);
  border: none;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.keypad-text {
  font-size: 28px;
  font-weight: 400;
  color: white;
}

.keypad-zero {
  aspect-ratio: 3.4;
  grid-column: span 2;
}

.submit-btn {
  width: 100%;
  padding: 18px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 16px;
  color: white;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.7;
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

.voice-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
}

.voice-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.voice-btn {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-btn-inner {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.voice-btn.recording .voice-btn-inner {
  background: linear-gradient(135deg, #ff375f, #fb7185);
}

.voice-close {
  position: absolute;
  top: -80px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
}

.animate-ios-slide-up {
  animation: ios-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes ios-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>



