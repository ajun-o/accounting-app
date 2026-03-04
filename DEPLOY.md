# 部署指南

## 1. Supabase 设置

### 创建项目
1. 访问 [Supabase](https://supabase.com) 并登录
2. 点击 "New Project" 创建新项目
3. 记住项目 URL 和 Anon Key

### 创建数据库表
1. 进入项目的 SQL Editor
2. 打开 `supabase/schema.sql` 文件
3. 复制全部内容到 SQL Editor 并执行

### 获取 API 密钥
1. 进入 Project Settings → API
2. 复制以下信息：
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public**: `your-anon-key`

## 2. 本地开发

### 安装依赖
```bash
cd D:\zuoye\shun\us
npm install
```

### 配置环境变量
1. 复制 `.env.example` 为 `.env`:
```bash
copy .env.example .env
```

2. 编辑 `.env` 文件，填入你的 Supabase 信息：
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 启动开发服务器
```bash
npm run dev
```

## 3. 部署到 Vercel

### 方式一：通过 GitHub 部署（推荐）

1. **推送代码到 GitHub**
```bash
git add .
git commit -m "Add Supabase backend"
git push origin main
```

2. **在 Vercel 导入项目**
   - 登录 [Vercel](https://vercel.com)
   - 点击 "Add New Project"
   - 导入你的 GitHub 仓库
   - Framework Preset 选择 "Vite"
   - 点击 "Deploy"

3. **配置环境变量**
   - 进入项目 Settings → Environment Variables
   - 添加以下变量：
     - `VITE_SUPABASE_URL`: 你的 Supabase URL
     - `VITE_SUPABASE_ANON_KEY`: 你的 Supabase Anon Key
   - 点击 "Save" 并重新部署

### 方式二：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
```bash
npm i -g vercel
```

2. **登录 Vercel**
```bash
vercel login
```

3. **部署**
```bash
vercel --prod
```

4. **配置环境变量**
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## 4. 验证部署

1. 访问部署后的网站
2. 测试注册/登录功能
3. 创建情侣空间
4. 添加账单测试

## 常见问题

### 问题：注册后没有自动创建 profile
**解决**：检查 `schema.sql` 中的触发器是否正确执行

### 问题：无法访问数据
**解决**：检查 RLS (Row Level Security) 策略是否正确配置

### 问题：环境变量不生效
**解决**：确保变量名以 `VITE_` 开头，并在 Vercel 中重新部署

## 文件结构

```
us/
├── src/
│   ├── stores/
│   │   ├── user.ts      # 用户状态管理 (Supabase)
│   │   └── bills.ts     # 账单状态管理 (Supabase)
│   ├── utils/
│   │   └── supabase.ts  # Supabase 客户端配置
│   └── ...
├── supabase/
│   └── schema.sql       # 数据库表结构
├── .env.example         # 环境变量示例
├── vercel.json          # Vercel 配置
└── DEPLOY.md            # 本文件
```
