-- AMATE 38 - AUTH TRIGGER & PROFILE SYNC FIX (March 19, 2026)
-- Run this in your Supabase SQL Editor if "Create Account" gives a database error.

-- 1. Create a robust function to sync Auth users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles (handles existing manual profiles via ON CONFLICT)
  INSERT INTO public.profiles (id, full_name, email, is_resident)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    false
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email = COALESCE(EXCLUDED.email, public.profiles.email);
  
  -- Initialize loyalty points at 0 if they don't exist
  INSERT INTO public.loyalty_points (user_id, points)
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Verify RLS bypass for the sync function
-- SECURITY DEFINER ensures it runs with enough permissions
