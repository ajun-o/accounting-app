import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db';
import { generateToken } from '../utils/jwt';
import { authMiddleware, getUserId } from '../middleware/auth';
import type { User } from '../types';

export const authRouter = new Hono();

// 注册请求体验证
const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符'),
  name: z.string().min(1, '请输入昵称'),
});

// 登录请求体验证
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

// 注册
authRouter.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({ 
        error: '输入验证失败', 
        details: result.error.errors 
      }, 400);
    }
    
    const { email, password, name } = result.data;
    
    // 检查邮箱是否已存在
    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return c.json({ error: '该邮箱已被注册' }, 409);
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const user: User = {
      id: crypto.randomUUID(),
      email,
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString(),
    };
    
    db.createUser(user);
    
    // 生成 JWT
    const token = generateToken({ userId: user.id, email: user.email });
    
    return c.json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        coupleId: user.coupleId,
      },
    }, 201);
  } catch (error) {
    console.error('注册错误:', error);
    return c.json({ error: '注册失败，请稍后重试' }, 500);
  }
});

// 登录
authRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({ 
        error: '输入验证失败', 
        details: result.error.errors 
      }, 400);
    }
    
    const { email, password } = result.data;
    
    // 查找用户
    const user = db.findUserByEmail(email);
    if (!user) {
      return c.json({ error: '邮箱或密码错误' }, 401);
    }
    
    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return c.json({ error: '邮箱或密码错误' }, 401);
    }
    
    // 生成 JWT
    const token = generateToken({ userId: user.id, email: user.email });
    
    return c.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        coupleId: user.coupleId,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    return c.json({ error: '登录失败，请稍后重试' }, 500);
  }
});

// 获取当前用户信息
authRouter.get('/me', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const user = db.findUserById(userId);
  
  if (!user) {
    return c.json({ error: '用户不存在' }, 404);
  }
  
  // 获取伴侣信息
  let partner = null;
  if (user.coupleId) {
    const couple = db.findCoupleById(user.coupleId);
    if (couple) {
      const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
      if (partnerId) {
        const partnerUser = db.findUserById(partnerId);
        if (partnerUser) {
          partner = {
            id: partnerUser.id,
            name: partnerUser.name,
            avatar: partnerUser.avatar,
          };
        }
      }
    }
  }
  
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      coupleId: user.coupleId,
    },
    partner,
  });
});

// 退出登录（前端只需删除 token）
authRouter.post('/logout', authMiddleware, async (c) => {
  return c.json({ message: '退出成功' });
});
