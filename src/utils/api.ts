// 这个文件现在只是导出类型，实际 API 调用已移到 stores
// 使用 Supabase 后，直接通过 stores 进行数据操作

export interface UserInfo {
  id: string
  email: string
  name: string
  avatar?: string
  coupleId?: string
}

export interface CoupleInfo {
  id: string
  name: string
  inviteCode: string
  createdAt: string
}

export interface Bill {
  id: string
  amount: number
  description: string
  category: string
  payerId: string
  coupleId: string
  createdAt: string
  updatedAt?: string
  payerName: string
  isMyBill: boolean
}
