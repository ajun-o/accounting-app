import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'
import { useUserStore } from './user'

export interface Bill {
  id: string
  amount: number
  description: string
  category: string
  payer_id: string
  couple_id: string
  created_at: string
  payer_name?: string
  is_my_bill?: boolean
}

export const useBillsStore = defineStore('bills', () => {
  // State
  const bills = ref<Bill[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const stats = ref<{
    totalAmount: number
    myAmount: number
    partnerAmount: number
    myPercentage: number
    partnerPercentage: number
    totalBills: number
  } | null>(null)

  // Getters
  const recentBills = computed(() => bills.value.slice(0, 50))
  
  const totalExpenditure = computed(() => 
    stats.value?.totalAmount || bills.value.reduce((sum, b) => sum + b.amount, 0)
  )
  
  const myExpenditure = computed(() => {
    const userStore = useUserStore()
    return stats.value?.myAmount || 
      bills.value.filter(b => b.payer_id === userStore.user?.id).reduce((sum, b) => sum + b.amount, 0)
  })
  
  const partnerExpenditure = computed(() => 
    stats.value?.partnerAmount || 
    bills.value.filter(b => b.payer_id !== useUserStore().user?.id).reduce((sum, b) => sum + b.amount, 0)
  )

  // Actions
  async function fetchBills() {
    isLoading.value = true
    error.value = null
    
    try {
      const userStore = useUserStore()
      if (!userStore.user || !userStore.couple) {
        bills.value = []
        return true
      }
      
      const { data, error: fetchError } = await supabase
        .from('bills')
        .select('*')
        .eq('couple_id', userStore.couple.id)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      
      // 获取所有支付者的信息
      const payerIds = [...new Set(data?.map(b => b.payer_id) || [])]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', payerIds)
      
      const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || [])
      
      bills.value = (data || []).map(bill => ({
        ...bill,
        payer_name: profileMap.get(bill.payer_id) || '未知',
        is_my_bill: bill.payer_id === userStore.user?.id,
      }))
      
      // 计算统计
      calculateStats()
      
      return true
    } catch (err: any) {
      error.value = err.message || '获取账单失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  function calculateStats() {
    const userStore = useUserStore()
    const userId = userStore.user?.id
    
    const totalAmount = bills.value.reduce((sum, b) => sum + b.amount, 0)
    const myAmount = bills.value.filter(b => b.payer_id === userId).reduce((sum, b) => sum + b.amount, 0)
    const partnerAmount = totalAmount - myAmount
    
    stats.value = {
      totalAmount,
      myAmount,
      partnerAmount,
      myPercentage: totalAmount > 0 ? (myAmount / totalAmount) * 100 : 0,
      partnerPercentage: totalAmount > 0 ? (partnerAmount / totalAmount) * 100 : 0,
      totalBills: bills.value.length,
    }
  }

  async function createBill(data: { 
    amount: number
    description: string
    category: string
  }) {
    isLoading.value = true
    error.value = null
    
    try {
      const userStore = useUserStore()
      if (!userStore.user || !userStore.couple) {
        throw new Error('未登录或未加入情侣空间')
      }
      
      const { data: newBill, error: insertError } = await supabase
        .from('bills')
        .insert({
          amount: data.amount,
          description: data.description,
          category: data.category,
          payer_id: userStore.user.id,
          couple_id: userStore.couple.id,
        })
        .select()
        .single()
      
      if (insertError) throw insertError
      
      if (newBill) {
        bills.value.unshift({
          ...newBill,
          payer_name: userStore.user.name,
          is_my_bill: true,
        })
        calculateStats()
      }
      
      return true
    } catch (err: any) {
      error.value = err.message || '创建账单失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function updateBill(id: string, data: Partial<{
    amount: number
    description: string
    category: string
  }>) {
    isLoading.value = true
    error.value = null
    
    try {
      const { data: updatedBill, error: updateError } = await supabase
        .from('bills')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      const index = bills.value.findIndex(b => b.id === id)
      if (index !== -1 && updatedBill) {
        bills.value[index] = {
          ...bills.value[index],
          ...updatedBill,
        }
        calculateStats()
      }
      
      return true
    } catch (err: any) {
      error.value = err.message || '更新账单失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function deleteBill(id: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from('bills')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      
      bills.value = bills.value.filter(b => b.id !== id)
      calculateStats()
      
      return true
    } catch (err: any) {
      error.value = err.message || '删除账单失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function refresh() {
    await fetchBills()
  }

  return {
    bills,
    isLoading,
    error,
    stats,
    recentBills,
    totalExpenditure,
    myExpenditure,
    partnerExpenditure,
    fetchBills,
    createBill,
    updateBill,
    deleteBill,
    refresh,
  }
})
