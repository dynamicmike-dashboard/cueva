-- ============================================================
-- AMATE 38 — Supabase Database Schema (IDEMPOTENT)
-- Run this in the Supabase SQL Editor.
-- Safe to re-run - drops conflicting policies before re-creating.
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  updated_at timestamp with time zone DEFAULT now(),
  full_name text,
  is_admin boolean DEFAULT false,
  is_resident boolean DEFAULT false,
  preferred_language text DEFAULT 'en',
  birthday date
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );


-- ============================================================
-- 2. LOYALTY POINTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  points integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own loyalty points" ON public.loyalty_points;
CREATE POLICY "Users can view own loyalty points"
  ON public.loyalty_points FOR SELECT
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Service role can manage loyalty points" ON public.loyalty_points;
CREATE POLICY "Service role can manage loyalty points"
  ON public.loyalty_points FOR ALL
  USING ( true );


-- ============================================================
-- 3. RESERVATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  guests text NOT NULL,
  is_resident boolean DEFAULT false,
  birthday date,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own reservations" ON public.reservations;
CREATE POLICY "Users can insert own reservations"
  ON public.reservations FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
CREATE POLICY "Users can view own reservations"
  ON public.reservations FOR SELECT
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Service role can view all reservations" ON public.reservations;
CREATE POLICY "Service role can view all reservations"
  ON public.reservations FOR ALL
  USING ( true );


-- ============================================================
-- 4. RESTAURANT SECRETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.restaurant_secrets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_code text NOT NULL DEFAULT 'AMATE2026',
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.restaurant_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage secrets" ON public.restaurant_secrets;
CREATE POLICY "Service role can manage secrets"
  ON public.restaurant_secrets FOR ALL
  USING ( true );

-- Seed default code only if table is empty
INSERT INTO public.restaurant_secrets (restaurant_code)
SELECT 'AMATE2026'
WHERE NOT EXISTS (SELECT 1 FROM public.restaurant_secrets);


-- ============================================================
-- 5. AUTO-PROFILE TRIGGER
-- Creates profile + loyalty record on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, preferred_language)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Guest'),
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'en')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.loyalty_points (user_id, points)
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
