-- AMATE 38 PWA: DATABASE STABILIZATION & RLS UNLOCK
-- This script ensures all tables exist and RLS policies allow for anonymous inserts and updates as needed.

-- 1. FACTURAS TABLE & POLICIES
CREATE TABLE IF NOT EXISTS public.facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    rfc TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    postal_code TEXT,
    cfdi_usage TEXT,
    ticket_url TEXT,
    voucher_url TEXT,
    status TEXT DEFAULT 'pending'
);

ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for all users" ON public.facturas;
CREATE POLICY "Enable insert for all users" ON public.facturas FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON public.facturas;
CREATE POLICY "Enable update for all users" ON public.facturas FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable select for all users" ON public.facturas;
CREATE POLICY "Enable select for all users" ON public.facturas FOR SELECT USING (true);


-- 2. REVIEWS TABLE & POLICIES
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    rating INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    review TEXT NOT NULL,
    responded BOOLEAN DEFAULT false,
    language TEXT DEFAULT 'en'
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for all users" ON public.reviews;
CREATE POLICY "Enable insert for all users" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for all users" ON public.reviews;
CREATE POLICY "Enable select for all users" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable update for all users" ON public.reviews;
CREATE POLICY "Enable update for all users" ON public.reviews FOR UPDATE USING (true);


-- 3. RESERVATIONS TABLE ENHANCEMENT
-- Ensure the restaurant column exists (handles both 'restaurant' and 'venue' legacies)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservations' AND column_name='restaurant') THEN
        ALTER TABLE public.reservations ADD COLUMN restaurant TEXT DEFAULT 'Amate 38';
    END IF;
END $$;

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all actions for all users" ON public.reservations;
CREATE POLICY "Enable all actions for all users" ON public.reservations FOR ALL USING (true) WITH CHECK (true);


-- 4. CHAT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    language TEXT DEFAULT 'en'
);

ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for all users" ON public.chat_logs;
CREATE POLICY "Enable all for all users" ON public.chat_logs FOR ALL USING (true) WITH CHECK (true);

-- 5. STAFF MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    passcode TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'staff',
    active BOOLEAN DEFAULT true
);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable select for all" ON public.staff_members;
CREATE POLICY "Enable select_for_all" ON public.staff_members FOR SELECT USING (true);
