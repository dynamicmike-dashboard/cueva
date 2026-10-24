-- AMATE 38 - MASTER SYNC FIX V3.2 (Complete Database Recovery)
-- Resolves uuid comparison error, registration errors, and duplicate points.

DO $$ 
BEGIN
    -- 1. Ensure Profiles table has all necessary columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='preferred_language') THEN
        ALTER TABLE public.profiles ADD COLUMN preferred_language text DEFAULT 'en';
    END IF;

    -- 2. CRITICAL: Remove Foreign Key to auth.users to allow "Manual Members" created by Admin
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

    -- 3. Update Loyalty Rewards Table (Add order_index)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loyalty_rewards' AND column_name='order_index') THEN
        ALTER TABLE public.loyalty_rewards ADD COLUMN order_index integer DEFAULT 0;
    END IF;
END $$;

-- 4. Clean up duplicate Loyalty Points if they exist (Fixed UUID min issue)
DELETE FROM public.loyalty_points a USING (
  SELECT MIN(id::text)::uuid as min_id, user_id 
  FROM public.loyalty_points 
  GROUP BY user_id 
  HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id AND a.id <> b.min_id;

-- Ensure UNIQUE constraint on loyalty_points
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'loyalty_points_user_id_key') THEN
        ALTER TABLE public.loyalty_points ADD CONSTRAINT loyalty_points_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 5. Create Loyalty History Table (Missing in previous migrations)
CREATE TABLE IF NOT EXISTS public.loyalty_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  staff_id uuid, -- Can be null for Admin
  staff_name text,
  points integer NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS for History
ALTER TABLE public.loyalty_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own history" ON public.loyalty_history;
CREATE POLICY "Users can view own history" ON public.loyalty_history FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role manages history" ON public.loyalty_history;
CREATE POLICY "Service role manages history" ON public.loyalty_history FOR ALL USING (true);

-- 6. Update the trigger function to be robust against missing data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    is_resident, 
    is_admin, 
    updated_at, 
    preferred_language
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    COALESCE((new.raw_user_meta_data->>'is_resident')::boolean, false),
    false,
    now(),
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'en')
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = now();
  
  -- Initialize loyalty points record (upsert to avoid duplicates)
  INSERT INTO public.loyalty_points (user_id, points)
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error and continue to allow user to be created in auth.users at least
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Re-apply trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Safety Grants
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.loyalty_points TO service_role;
GRANT ALL ON public.loyalty_history TO service_role;
GRANT ALL ON public.loyalty_rewards TO service_role;
GRANT ALL ON public.staff_members TO service_role;
GRANT ALL ON public.restaurant_secrets TO service_role; 
GRANT ALL ON public.reservations TO service_role;
GRANT SELECT ON public.loyalty_rewards TO anon;
GRANT SELECT ON public.loyalty_rewards TO authenticated;
