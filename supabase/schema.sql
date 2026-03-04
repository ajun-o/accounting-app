-- Supabase 数据库表结构
-- 在 Supabase SQL Editor 中执行这些命令

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户资料表（扩展 Supabase Auth 的用户信息）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 情侣空间表
CREATE TABLE IF NOT EXISTS couples (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  user1_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 账单表
CREATE TABLE IF NOT EXISTS bills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  payer_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  couple_id UUID REFERENCES couples ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_couples_user1 ON couples(user1_id);
CREATE INDEX IF NOT EXISTS idx_couples_user2 ON couples(user2_id);
CREATE INDEX IF NOT EXISTS idx_couples_invite_code ON couples(invite_code);
CREATE INDEX IF NOT EXISTS idx_bills_couple ON bills(couple_id);
CREATE INDEX IF NOT EXISTS idx_bills_payer ON bills(payer_id);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at DESC);

-- 启用 RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略

-- Profiles: 用户可以查看所有资料，但只能更新自己的
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Couples: 只有成员可以查看和修改
CREATE POLICY "Couples are viewable by members" 
  ON couples FOR SELECT USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

CREATE POLICY "Users can create couples" 
  ON couples FOR INSERT WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Members can update their couple" 
  ON couples FOR UPDATE USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

CREATE POLICY "Members can delete their couple" 
  ON couples FOR DELETE USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- Bills: 只有情侣空间成员可以查看和修改
CREATE POLICY "Bills are viewable by couple members" 
  ON bills FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couples 
      WHERE couples.id = bills.couple_id 
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Members can insert bills" 
  ON bills FOR INSERT WITH CHECK (
    auth.uid() = payer_id AND
    EXISTS (
      SELECT 1 FROM couples 
      WHERE couples.id = couple_id 
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Payer can update their bills" 
  ON bills FOR UPDATE USING (auth.uid() = payer_id);

CREATE POLICY "Payer can delete their bills" 
  ON bills FOR DELETE USING (auth.uid() = payer_id);

-- 创建触发器：用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
