import type { Context, Next } from 'hono';
import { verifyToken } from '../utils/jwt';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未提供认证令牌' }, 401);
  }
  
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    return c.json({ error: '无效的认证令牌' }, 401);
  }
  
  // 将用户信息存储在上下文中
  c.set('userId', payload.userId);
  c.set('email', payload.email);
  
  await next();
}

// 获取当前登录用户ID
export function getUserId(c: Context): string {
  return c.get('userId');
}
