import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db';
import { authMiddleware, getUserId } from '../middleware/auth';
import type { Bill } from '../types';

export const billsRouter = new Hono();

// 创建账单请求体验证
const createBillSchema = z.object({
  amount: z.number().positive('金额必须大于0'),
  description: z.string().min(1, '请输入账单描述'),
  category: z.string().min(1, '请选择分类'),
});

// 更新账单请求体验证
const updateBillSchema = z.object({
  amount: z.number().positive('金额必须大于0').optional(),
  description: z.string().min(1, '请输入账单描述').optional(),
  category: z.string().min(1, '请选择分类').optional(),
});

billsRouter.use(authMiddleware);

// 获取所有账单
billsRouter.get('/', async (c) => {
  try {
    const userId = getUserId(c);
    const user = db.findUserById(userId);
    
    if (!user || !user.coupleId) {
      return c.json({ error: '您还没有加入情侣空间' }, 403);
    }
    
    const bills = db.findBillsByCoupleId(user.coupleId);
    
    // 添加支付者信息
    const billsWithPayer = bills.map(bill => {
      const payer = db.findUserById(bill.payerId);
      return {
        ...bill,
        payerName: payer?.name || '未知',
        isMyBill: bill.payerId === userId,
      };
    });
    
    return c.json({ bills: billsWithPayer });
  } catch (error) {
    console.error('获取账单错误:', error);
    return c.json({ error: '获取账单失败' }, 500);
  }
});

// 创建账单
billsRouter.post('/', async (c) => {
  try {
    const userId = getUserId(c);
    const user = db.findUserById(userId);
    
    if (!user || !user.coupleId) {
      return c.json({ error: '您还没有加入情侣空间' }, 403);
    }
    
    const body = await c.req.json();
    const result = createBillSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({ 
        error: '输入验证失败', 
        details: result.error.errors 
      }, 400);
    }
    
    const { amount, description, category } = result.data;
    
    const bill: Bill = {
      id: crypto.randomUUID(),
      amount,
      description,
      category,
      payerId: userId,
      coupleId: user.coupleId,
      createdAt: new Date().toISOString(),
    };
    
    db.createBill(bill);
    
    return c.json({
      message: '账单创建成功',
      bill: {
        ...bill,
        payerName: user.name,
        isMyBill: true,
      },
    }, 201);
  } catch (error) {
    console.error('创建账单错误:', error);
    return c.json({ error: '创建账单失败' }, 500);
  }
});

// 获取单个账单
billsRouter.get('/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const billId = c.req.param('id');
    
    const bill = db.findBillById(billId);
    if (!bill) {
      return c.json({ error: '账单不存在' }, 404);
    }
    
    // 检查权限
    const user = db.findUserById(userId);
    if (!user || bill.coupleId !== user.coupleId) {
      return c.json({ error: '无权访问此账单' }, 403);
    }
    
    const payer = db.findUserById(bill.payerId);
    
    return c.json({
      bill: {
        ...bill,
        payerName: payer?.name || '未知',
        isMyBill: bill.payerId === userId,
      },
    });
  } catch (error) {
    console.error('获取账单错误:', error);
    return c.json({ error: '获取账单失败' }, 500);
  }
});

// 更新账单
billsRouter.put('/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const billId = c.req.param('id');
    
    const bill = db.findBillById(billId);
    if (!bill) {
      return c.json({ error: '账单不存在' }, 404);
    }
    
    // 检查权限（只能修改自己创建的账单）
    if (bill.payerId !== userId) {
      return c.json({ error: '只能修改自己创建的账单' }, 403);
    }
    
    const body = await c.req.json();
    const result = updateBillSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({ 
        error: '输入验证失败', 
        details: result.error.errors 
      }, 400);
    }
    
    const updates = result.data;
    const updatedBill = db.updateBill(billId, updates);
    
    if (!updatedBill) {
      return c.json({ error: '更新失败' }, 500);
    }
    
    const payer = db.findUserById(updatedBill.payerId);
    
    return c.json({
      message: '账单更新成功',
      bill: {
        ...updatedBill,
        payerName: payer?.name || '未知',
        isMyBill: true,
      },
    });
  } catch (error) {
    console.error('更新账单错误:', error);
    return c.json({ error: '更新账单失败' }, 500);
  }
});

// 删除账单
billsRouter.delete('/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const billId = c.req.param('id');
    
    const bill = db.findBillById(billId);
    if (!bill) {
      return c.json({ error: '账单不存在' }, 404);
    }
    
    // 检查权限（只能删除自己创建的账单）
    if (bill.payerId !== userId) {
      return c.json({ error: '只能删除自己创建的账单' }, 403);
    }
    
    const success = db.deleteBill(billId);
    
    if (!success) {
      return c.json({ error: '删除失败' }, 500);
    }
    
    return c.json({ message: '账单删除成功' });
  } catch (error) {
    console.error('删除账单错误:', error);
    return c.json({ error: '删除账单失败' }, 500);
  }
});

// 获取统计信息
billsRouter.get('/stats/summary', async (c) => {
  try {
    const userId = getUserId(c);
    const user = db.findUserById(userId);
    
    if (!user || !user.coupleId) {
      return c.json({ error: '您还没有加入情侣空间' }, 403);
    }
    
    const bills = db.findBillsByCoupleId(user.coupleId);
    
    const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0);
    const myAmount = bills.filter(b => b.payerId === userId).reduce((sum, b) => sum + b.amount, 0);
    const partnerAmount = totalAmount - myAmount;
    
    // 按分类统计
    const categoryStats: Record<string, { amount: number; count: number }> = {};
    bills.forEach(bill => {
      if (!categoryStats[bill.category]) {
        categoryStats[bill.category] = { amount: 0, count: 0 };
      }
      categoryStats[bill.category].amount += bill.amount;
      categoryStats[bill.category].count += 1;
    });
    
    return c.json({
      summary: {
        totalAmount,
        myAmount,
        partnerAmount,
        myPercentage: totalAmount > 0 ? (myAmount / totalAmount) * 100 : 0,
        partnerPercentage: totalAmount > 0 ? (partnerAmount / totalAmount) * 100 : 0,
        totalBills: bills.length,
      },
      categoryStats,
    });
  } catch (error) {
    console.error('获取统计错误:', error);
    return c.json({ error: '获取统计失败' }, 500);
  }
});
