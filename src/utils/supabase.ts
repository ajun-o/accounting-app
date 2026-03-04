import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库类型定义
export interface Database {
  public: {
    Tables: {
      couples: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_at: string
          user1_id: string
          user2_id: string | null
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          created_at?: string
          user1_id: string
          user2_id?: string | null
        }
      }
      bills: {
        Row: {
          id: string
          amount: number
          description: string
          category: string
          payer_id: string
          couple_id: string
          created_at: string
        }
        Insert: {
          id?: string
          amount: number
          description: string
          category: string
          payer_id: string
          couple_id: string
          created_at?: string
        }
      }
    }
  }
}
