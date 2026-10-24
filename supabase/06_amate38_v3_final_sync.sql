-- AMATE 38 - FINAL V3 PRODUCTION SYNC
-- Date: 2026-04-14
-- Purpose: Complete AI Review Hub, Factura System, and Chatbot Training tables.

-- 1. FACTURA REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.factura_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfc TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  postal_code TEXT,
  cfdi_usage TEXT DEFAULT 'G03 - Gastos en general',
  ticket_url TEXT,
  voucher_url TEXT,
  restaurant TEXT DEFAULT 'Amate 38',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CHAT LOGS TABLE (For Admin Review)
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  message TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  channel TEXT DEFAULT 'web' CHECK (channel IN ('web', 'whatsapp', 'sms', 'fb', 'voice')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_logs_session ON chat_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created ON chat_logs(created_at DESC);

-- 3. CHATBOT TRAINING RULES
CREATE TABLE IF NOT EXISTS public.chatbot_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('correction', 'fact', 'ban', 'allowed', 'forbidden')),
  trigger_keywords TEXT,
  response_text TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. UPDATE RESTAURANT SECRETS (Ensure notification email exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurant_secrets' AND column_name='admin_notification_email') THEN
    ALTER TABLE public.restaurant_secrets ADD COLUMN admin_notification_email TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurant_secrets' AND column_name='sound_notifications_enabled') THEN
    ALTER TABLE public.restaurant_secrets ADD COLUMN sound_notifications_enabled BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurant_secrets' AND column_name='support_whatsapp') THEN
    ALTER TABLE public.restaurant_secrets ADD COLUMN support_whatsapp TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurant_secrets' AND column_name='support_messenger') THEN
    ALTER TABLE public.restaurant_secrets ADD COLUMN support_messenger TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurant_secrets' AND column_name='support_sms') THEN
    ALTER TABLE public.restaurant_secrets ADD COLUMN support_sms TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurant_secrets' AND column_name='support_phone') THEN
    ALTER TABLE public.restaurant_secrets ADD COLUMN support_phone TEXT;
  END IF;
END $$;

-- 5. UPDATE REVIEWS (Ensure language tracking)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='language') THEN
    ALTER TABLE public.reviews ADD COLUMN language TEXT DEFAULT 'en';
  END IF;
END $$;

-- 6. SECURITY & PERMISSIONS
ALTER TABLE public.factura_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_rules ENABLE ROW LEVEL SECURITY;

-- Allow service role (API) everything
DROP POLICY IF EXISTS "Service role manages facturas" ON public.factura_requests;
CREATE POLICY "Service role manages facturas" ON public.factura_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role manages chat logs" ON public.chat_logs;
CREATE POLICY "Service role manages chat logs" ON public.chat_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role manages chatbot rules" ON public.chatbot_rules;
CREATE POLICY "Service role manages chatbot rules" ON public.chatbot_rules FOR ALL USING (true);

-- Public insert for facturas (Diner app)
DROP POLICY IF EXISTS "Public can insert facturas" ON public.factura_requests;
CREATE POLICY "Public can insert facturas" ON public.factura_requests FOR INSERT WITH CHECK (true);

-- Ensure grants for the API to function
GRANT ALL ON public.factura_requests TO service_role;
GRANT ALL ON public.chat_logs TO service_role;
GRANT ALL ON public.chatbot_rules TO service_role;
GRANT ALL ON public.reviews TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.reservations TO service_role;
GRANT ALL ON public.restaurant_secrets TO service_role;

-- Grant public inserts where needed
GRANT INSERT ON public.factura_requests TO anon;
GRANT INSERT ON public.factura_requests TO authenticated;
GRANT INSERT ON public.chat_logs TO anon;
GRANT INSERT ON public.chat_logs TO authenticated;

-- Ensure the master secret is seeded
INSERT INTO public.restaurant_secrets (restaurant_code, admin_password, admin_notification_email)
VALUES ('AMATE38', 'amate-admin-38', 'hola@amate38.com')
ON CONFLICT DO NOTHING;
