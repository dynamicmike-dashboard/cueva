-- AMATE 38 - MASTER SYNC FIX V2 (March 19, 2026)
-- Resolves the "Database Error" during new user registration by ensuring 
-- all confirmed columns have proper defaults and the trigger is robust.

-- 1. Ensure Profiles table columns have safe defaults to prevent INSERT failures
ALTER TABLE public.profiles ALTER COLUMN is_admin SET DEFAULT false;
ALTER TABLE public.profiles ALTER COLUMN is_resident SET DEFAULT false;
ALTER TABLE public.profiles ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.profiles ALTER COLUMN preferred_language SET DEFAULT 'en';

-- 2. Update the sync function to handle all known columns safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
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
  
  -- Initialize loyalty points
  INSERT INTO public.loyalty_points (user_id, points)
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-apply trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Safety: Ensure RLS is active but bypassable by service role
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.loyalty_points TO service_role;
