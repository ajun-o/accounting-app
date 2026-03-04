import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'

export interface UserInfo {
  id: string
  email: string
  name: string
  avatar?: string
}

export interface CoupleInfo {
  id: string
  name: string
  inviteCode: string
  createdAt: string
  user1Id: string
  user2Id?: string
}

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<UserInfo | null>(null)
  const partner = ref<UserInfo | null>(null)
  const couple = ref<CoupleInfo | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isLoggedIn = computed(() => !!user.value)
  const hasCouple = computed(() => !!couple.value)

  // 从 Supabase 用户数据构建 UserInfo
  function buildUserInfo(supabaseUser: any): UserInfo {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || '用户',
      avatar: supabaseUser.user_metadata?.avatar,
    }
  }

  // Actions
  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      user.value = buildUserInfo(session.user)
      await fetchCoupleInfo()
    }
  }

  async function login(email: string, password: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (authError) throw authError
      
      if (data.user) {
        user.value = buildUserInfo(data.user)
        await fetchCoupleInfo()
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.message || '登录失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function register(email: string, password: string, name: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      })
      
      if (authError) throw authError
      
      if (data.user) {
        user.value = buildUserInfo(data.user)
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.message || '注册失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCoupleInfo() {
    if (!user.value) return
    
    try {
      // 查找当前用户参与的情侣空间
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .or(`user1_id.eq.${user.value.id},user2_id.eq.${user.value.id}`)
        .single()
      
      if (coupleError) {
        if (coupleError.code === 'PGRST116') {
          // 没有找到记录
          couple.value = null
          partner.value = null
          return
        }
        throw coupleError
      }
      
      if (coupleData) {
        couple.value = {
          id: coupleData.id,
          name: coupleData.name,
          inviteCode: coupleData.invite_code,
          createdAt: coupleData.created_at,
          user1Id: coupleData.user1_id,
          user2Id: coupleData.user2_id,
        }
        
        // 获取伴侣信息
        const partnerId = coupleData.user1_id === user.value.id 
          ? coupleData.user2_id 
          : coupleData.user1_id
        
        if (partnerId) {
          const { data: partnerData } = await supabase
            .from('profiles')
            .select('id, name, avatar')
            .eq('id', partnerId)
            .single()
          
          if (partnerData) {
            partner.value = {
              id: partnerData.id,
              email: '',
              name: partnerData.name,
              avatar: partnerData.avatar,
            }
          }
        }
      }
    } catch (err: any) {
      console.error('获取情侣空间信息失败:', err)
    }
  }

  async function createCouple(name: string) {
    isLoading.value = true
    error.value = null
    
    try {
      if (!user.value) throw new Error('未登录')
      
      // 生成邀请码
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      
      const { data, error: insertError } = await supabase
        .from('couples')
        .insert({
          name,
          invite_code: inviteCode,
          user1_id: user.value.id,
        })
        .select()
        .single()
      
      if (insertError) throw insertError
      
      if (data) {
        couple.value = {
          id: data.id,
          name: data.name,
          inviteCode: data.invite_code,
          createdAt: data.created_at,
          user1Id: data.user1_id,
          user2Id: data.user2_id,
        }
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.message || '创建失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function joinCouple(inviteCode: string) {
    isLoading.value = true
    error.value = null
    
    try {
      if (!user.value) throw new Error('未登录')
      
      // 查找邀请码对应的情侣空间
      const { data: coupleData, error: findError } = await supabase
        .from('couples')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .is('user2_id', null)
        .single()
      
      if (findError || !coupleData) {
        throw new Error('邀请码无效或情侣空间已满')
      }
      
      // 更新情侣空间
      const { data, error: updateError } = await supabase
        .from('couples')
        .update({ user2_id: user.value.id })
        .eq('id', coupleData.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      if (data) {
        couple.value = {
          id: data.id,
          name: data.name,
          inviteCode: data.invite_code,
          createdAt: data.created_at,
          user1Id: data.user1_id,
          user2Id: data.user2_id,
        }
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.message || '加入失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function leaveCouple() {
    isLoading.value = true
    
    try {
      if (!user.value || !couple.value) return false
      
      // 删除情侣空间（或者根据业务逻辑处理）
      const { error: deleteError } = await supabase
        .from('couples')
        .delete()
        .eq('id', couple.value.id)
      
      if (deleteError) throw deleteError
      
      couple.value = null
      partner.value = null
      return true
    } catch (err: any) {
      error.value = err.message || '退出失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    partner.value = null
    couple.value = null
    error.value = null
  }

  return {
    user,
    partner,
    couple,
    isLoading,
    error,
    isLoggedIn,
    hasCouple,
    init,
    login,
    register,
    logout,
    fetchCoupleInfo,
    createCouple,
    joinCouple,
    leaveCouple,
  }
})
