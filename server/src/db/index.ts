// 内存数据库（生产环境应使用真实数据库如 PostgreSQL/MongoDB）
import type { User, Couple, Bill } from '../types';

class Database {
  users: Map<string, User> = new Map();
  couples: Map<string, Couple> = new Map();
  bills: Map<string, Bill> = new Map();
  emailIndex: Map<string, string> = new Map(); // email -> userId

  // 用户相关
  createUser(user: User): User {
    this.users.set(user.id, user);
    this.emailIndex.set(user.email, user.id);
    return user;
  }

  findUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  findUserByEmail(email: string): User | undefined {
    const userId = this.emailIndex.get(email);
    return userId ? this.users.get(userId) : undefined;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    // 如果更新邮箱，更新索引
    if (updates.email && updates.email !== user.email) {
      this.emailIndex.delete(user.email);
      this.emailIndex.set(updates.email, id);
    }
    
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // 情侣关系相关
  createCouple(couple: Couple): Couple {
    this.couples.set(couple.id, couple);
    return couple;
  }

  findCoupleById(id: string): Couple | undefined {
    return this.couples.get(id);
  }

  findCoupleByUserId(userId: string): Couple | undefined {
    for (const couple of this.couples.values()) {
      if (couple.user1Id === userId || couple.user2Id === userId) {
        return couple;
      }
    }
    return undefined;
  }

  joinCouple(coupleId: string, userId: string): Couple | undefined {
    const couple = this.couples.get(coupleId);
    if (!couple || couple.user2Id) return undefined;
    
    couple.user2Id = userId;
    this.couples.set(coupleId, couple);
    
    // 更新用户的 coupleId
    const user = this.users.get(userId);
    if (user) {
      user.coupleId = coupleId;
      this.users.set(userId, user);
    }
    
    return couple;
  }

  // 账单相关
  createBill(bill: Bill): Bill {
    this.bills.set(bill.id, bill);
    return bill;
  }

  findBillById(id: string): Bill | undefined {
    return this.bills.get(id);
  }

  findBillsByCoupleId(coupleId: string): Bill[] {
    return Array.from(this.bills.values())
      .filter(b => b.coupleId === coupleId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  updateBill(id: string, updates: Partial<Bill>): Bill | undefined {
    const bill = this.bills.get(id);
    if (!bill) return undefined;
    
    const updated = { ...bill, ...updates, updatedAt: new Date().toISOString() };
    this.bills.set(id, updated);
    return updated;
  }

  deleteBill(id: string): boolean {
    return this.bills.delete(id);
  }
}

export const db = new Database();
