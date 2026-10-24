-- ============================================================
-- AMATE 38 — Staff & Rewards Management
-- ============================================================

-- 1. Staff Passcodes (for waitstaff to allocate points)
CREATE TABLE IF NOT EXISTS public.staff_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  passcode text NOT NULL UNIQUE, -- Waiters use this to confirm point additions
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Loyalty Rewards (Admin controlled)
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en text NOT NULL,
  title_es text NOT NULL,
  points_cost integer NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS Policies
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- Public can read active rewards
CREATE POLICY "Anyone can view active rewards"
  ON public.loyalty_rewards FOR SELECT
  USING ( active = true );

-- All other operations restricted to Service Role (managed via server.ts)
CREATE POLICY "Service role manages staff and rewards"
  ON public.staff_members FOR ALL USING (true);

CREATE POLICY "Service role manages rewards"
  ON public.loyalty_rewards FOR ALL USING (true);

-- Seed initial staff member and rewards
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
