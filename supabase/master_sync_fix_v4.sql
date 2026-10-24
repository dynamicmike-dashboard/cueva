-- MASTER SYNC FIX V4: Deduplication & Auth Alignment
-- 1. CLEAN UP DUPLICATE SECRETS (Fixes Password Reverting)
DELETE FROM public.restaurant_secrets 
WHERE id NOT IN (SELECT id FROM public.restaurant_secrets ORDER BY created_at DESC LIMIT 1);

-- 2. ENSURE POINT CONSTRAINTS (Fixes Points Not Saving)
ALTER TABLE public.loyalty_points DROP CONSTRAINT IF EXISTS loyalty_points_user_id_key;
ALTER TABLE public.loyalty_points ADD CONSTRAINT loyalty_points_user_id_key UNIQUE (user_id);

-- 3. ENSURE EMAIL COLUMN EXISTS IN PROFILES
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email text;
    END IF;
END $$;

-- 4. ROBUST TRIGGER RESET
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, preferred_language)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Member'), new.email, 'mx')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  
  INSERT INTO public.loyalty_points (user_id, points)
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
