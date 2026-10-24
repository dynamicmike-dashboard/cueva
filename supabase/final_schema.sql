-- ============================================================
-- AMATE 38 — COMPLETE DATABASE SCHEMA (FINAL - WITH DROP POLICY)
-- ============================================================

-- 1. CORE TABLES

-- Profiles (Linked to Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  birthday date,
  is_resident boolean DEFAULT false,
  preferred_language text DEFAULT 'es',
  updated_at timestamp with time zone DEFAULT now()
);

-- Loyalty Points
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  points integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Reservations
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  guests text NOT NULL,
  is_resident boolean DEFAULT false,
  birthday date,
  status text DEFAULT 'pending', 
  created_at timestamp with time zone DEFAULT now()
);

-- Staff Members
CREATE TABLE IF NOT EXISTS public.staff_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  passcode text NOT NULL UNIQUE,
  role text DEFAULT 'staff', 
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Loyalty Rewards
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en text NOT NULL,
  title_es text NOT NULL,
  points_cost integer NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Menu Items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en text NOT NULL,
  name_es text NOT NULL,
  description_en text,
  description_es text,
  price text NOT NULL,
  category text NOT NULL,
  image text,
  active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Restaurant Secrets (Password)
CREATE TABLE IF NOT EXISTS public.restaurant_secrets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_code text NOT NULL DEFAULT 'AMATE2026',
  admin_password text NOT NULL DEFAULT 'amate-admin-38',
  reminder_timing text DEFAULT '24h',
  reminder_message text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rating integer NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  review text NOT NULL,
  responded boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Loyalty History
CREATE TABLE IF NOT EXISTS public.loyalty_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  staff_name text,
  points integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_history ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES (With DROP IF EXISTS to prevent already exists error)
-- ...
DROP POLICY IF EXISTS "Service role manages loyalty history" ON public.loyalty_history;
CREATE POLICY "Service role manages loyalty history" ON public.loyalty_history FOR ALL USING (true);

-- 4. POLICIES (With DROP IF EXISTS to prevent already exists error)

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role manages profiles" ON public.profiles;
CREATE POLICY "Service role manages profiles" ON public.profiles FOR ALL USING (true);

-- Loyalty
DROP POLICY IF EXISTS "Users can view own points" ON public.loyalty_points;
CREATE POLICY "Users can view own points" ON public.loyalty_points FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages points" ON public.loyalty_points;
CREATE POLICY "Service role manages points" ON public.loyalty_points FOR ALL USING (true);

-- Menu
DROP POLICY IF EXISTS "Anyone can view active menu items" ON public.menu_items;
CREATE POLICY "Anyone can view active menu items" ON public.menu_items FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Service role manages menu items" ON public.menu_items;
CREATE POLICY "Service role manages menu items" ON public.menu_items FOR ALL USING (true);

-- Rewards
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.loyalty_rewards;
CREATE POLICY "Anyone can view active rewards" ON public.loyalty_rewards FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Service role manages rewards" ON public.loyalty_rewards;
CREATE POLICY "Service role manages rewards" ON public.loyalty_rewards FOR ALL USING (true);

-- Reservations
DROP POLICY IF EXISTS "Users can insert own reservations" ON public.reservations;
CREATE POLICY "Users can insert own reservations" ON public.reservations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
CREATE POLICY "Users can view own reservations" ON public.reservations FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Service role manages reservations" ON public.reservations;
CREATE POLICY "Service role manages reservations" ON public.reservations FOR ALL USING (true);

-- Reviews
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages reviews" ON public.reviews;
CREATE POLICY "Service role manages reviews" ON public.reviews FOR ALL USING (true);

-- Staff
DROP POLICY IF EXISTS "Service role manages staff" ON public.staff_members;
CREATE POLICY "Service role manages staff" ON public.staff_members FOR ALL USING (true);

-- Secrets
DROP POLICY IF EXISTS "Service role manages secrets" ON public.restaurant_secrets;
CREATE POLICY "Service role manages secrets" ON public.restaurant_secrets FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read secrets" ON public.restaurant_secrets;
CREATE POLICY "Public read secrets" ON public.restaurant_secrets FOR SELECT USING (true);

-- 5. TRIGGER FOR NEW USER PROFILE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, preferred_language)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'preferred_language')
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.loyalty_points (user_id, points)
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to prevent error on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. SEED INITIAL DATA
INSERT INTO public.restaurant_secrets (restaurant_code, admin_password)
VALUES ('AMATE2026', 'amate-admin-38')
ON CONFLICT DO NOTHING;

INSERT INTO public.staff_members (name, passcode)
VALUES ('General Staff', '3838')
ON CONFLICT (passcode) DO NOTHING;

INSERT INTO public.loyalty_rewards (title_en, title_es, points_cost)
VALUES 
  ('Free Mezcalita', 'Mezcalita de Cortesía', 50),
  ('15% Discount', '15% de Descuento', 100),
  ('Free Jungle Omelette', 'Omelette Selvático de Cortesía', 150),
  ('Free Dinner for Two', 'Cena para Dos de Cortesía', 400)
ON CONFLICT DO NOTHING;
