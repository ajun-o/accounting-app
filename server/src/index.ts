import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './routes/auth';
import { billsRouter } from './routes/bills';
import { couplesRouter } from './routes/couples';

const app = new Hono();

// CORS 配置
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));

// 根路径
app.get('/', (c) => c.json({ 
  message: '情侣记账 API 服务',
  version: '1.0.0',
  endpoints: {
    health: '/health',
    auth: '/api/auth',
    bills: '/api/bills',
    couples: '/api/couples'
  }
}));

// 健康检查
app.get('/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }));

// 路由
app.route('/api/auth', authRouter);
app.route('/api/bills', billsRouter);
app.route('/api/couples', couplesRouter);

const port = process.env.PORT || 3000;

console.log(`🚀 服务器启动在 http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port: Number(port),
});
