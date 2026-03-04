import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db';
import { authMiddleware, getUserId } from '../middleware/auth';
import type { Couple } from '../types';

export const couplesRouter = new Hono();

// 创建情侣关系
const createCoupleSchema = z.object({
  name: z.string().min(1, '请输入情侣空间名称'),
});

// 加入情侣关系
const joinCoupleSchema = z.object({
  inviteCode: z.string().min(1, '请输入邀请码'),
});

couplesRouter.use(authMiddleware);

// 创建情侣空间
couplesRouter.post('/create', async (c) => {
  try {
    const userId = getUserId(c);
    const body = await c.req.json();
    const result = createCoupleSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({ 
        error: '输入验证失败', 
        details: result.error.errors 
      }, 400);
    }
    
    // 检查用户是否已有情侣关系
    const existingCouple = db.findCoupleByUserId(userId);
    if (existingCouple) {
      return c.json({ error: '您已经在一个情侣空间中了' }, 409);
    }
    
    const { name } = result.data;
    
    // 创建情侣空间
    const couple: Couple = {
      id: crypto.randomUUID(),
      name,
      user1Id: userId,
      createdAt: new Date().toISOString(),
    };
    
    db.createCouple(couple);
    
    // 更新用户的 coupleId
    const user = db.findUserById(userId);
    if (user) {
      user.coupleId = couple.id;
      db.updateUser(userId, user);
    }
    
    // 生成邀请码（简单使用 coupleId 的前8位）
    const inviteCode = couple.id.substring(0, 8).toUpperCase();
    
    return c.json({
      message: '情侣空间创建成功',
      couple: {
        id: couple.id,
        name: couple.name,
        inviteCode,
      },
    }, 201);
  } catch (error) {
    console.error('创建情侣空间错误:', error);
    return c.json({ error: '创建失败，请稍后重试' }, 500);
  }
});

// 加入情侣空间
couplesRouter.post('/join', async (c) => {
  try {
    const userId = getUserId(c);
    const body = await c.req.json();
    const result = joinCoupleSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({ 
        error: '输入验证失败', 
        details: result.error.errors 
      }, 400);
    }
    
    // 检查用户是否已有情侣关系
    const existingCouple = db.findCoupleByUserId(userId);
    if (existingCouple) {
      return c.json({ error: '您已经在一个情侣空间中了' }, 409);
    }
    
    const { inviteCode } = result.data;
    
    // 查找情侣空间（通过邀请码）
    let targetCouple: Couple | undefined;
    for (const couple of db.couples.values()) {
      if (couple.id.substring(0, 8).toUpperCase() === inviteCode.toUpperCase()) {
        targetCouple = couple;
        break;
      }
    }
    
    if (!targetCouple) {
      return c.json({ error: '邀请码无效' }, 404);
    }
    
    if (targetCouple.user2Id) {
      return c.json({ error: '该情侣空间已满员' }, 409);
    }
    
    // 加入情侣空间
    db.joinCouple(targetCouple.id, userId);
    
    return c.json({
      message: '加入情侣空间成功',
      couple: {
        id: targetCouple.id,
        name: targetCouple.name,
      },
    });
  } catch (error) {
    console.error('加入情侣空间错误:', error);
    return c.json({ error: '加入失败，请稍后重试' }, 500);
  }
});

// 获取情侣空间信息
couplesRouter.get('/info', async (c) => {
  try {
    const userId = getUserId(c);
    const couple = db.findCoupleByUserId(userId);
    
    if (!couple) {
      return c.json({ error: '您还没有加入情侣空间' }, 404);
    }
    
    // 获取双方信息
    const user1 = db.findUserById(couple.user1Id);
    const user2 = couple.user2Id ? db.findUserById(couple.user2Id) : null;
    
    const inviteCode = couple.id.substring(0, 8).toUpperCase();
    
    return c.json({
      couple: {
        id: couple.id,
        name: couple.name,
        inviteCode,
        createdAt: couple.createdAt,
        members: [
          {
            id: user1?.id,
            name: user1?.name,
            avatar: user1?.avatar,
          },
          user2 ? {
            id: user2.id,
            name: user2.name,
            avatar: user2.avatar,
          } : null,
        ].filter(Boolean),
      },
    });
  } catch (error) {
    console.error('获取情侣空间信息错误:', error);
    return c.json({ error: '获取信息失败' }, 500);
  }
});

// 离开情侣空间
couplesRouter.post('/leave', async (c) => {
  try {
    const userId = getUserId(c);
    const user = db.findUserById(userId);
    
    if (!user || !user.coupleId) {
      return c.json({ error: '您不在任何情侣空间中' }, 404);
    }
    
    // 清除用户的 coupleId
    user.coupleId = undefined;
    db.updateUser(userId, user);
    
    return c.json({ message: '已离开情侣空间' });
  } catch (error) {
    console.error('离开情侣空间错误:', error);
    return c.json({ error: '操作失败' }, 500);
  }
});
