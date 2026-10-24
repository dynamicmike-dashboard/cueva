-- Migration: Add phone + postal_code to factura_requests, create chat_logs table
-- Date: 2026-04-14

-- 1. Add phone and postal_code to factura_requests (if not exists)
DO $$ BEGIN
  ALTER TABLE factura_requests ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE factura_requests ADD COLUMN IF NOT EXISTS postal_code TEXT;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'factura columns already exist or table missing';
END $$;

-- 2. Create chat_logs table for admin chat review
CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  message TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  channel TEXT DEFAULT 'web' CHECK (channel IN ('web', 'whatsapp', 'sms', 'fb', 'voice')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast session lookups  
CREATE INDEX IF NOT EXISTS idx_chat_logs_session ON chat_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created ON chat_logs(created_at DESC);

-- 3. Create chatbot_rules table for admin training
CREATE TABLE IF NOT EXISTS chatbot_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('allowed', 'forbidden')),
  trigger_keywords TEXT,
  response_text TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
