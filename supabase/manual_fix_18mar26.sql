-- AMATE 38 - MANUAL MEMBERS FIX (March 18, 2026)
-- Run this in your Supabase SQL Editor to finish enabling Manual Member profiles.

-- 1. Allow profiles without a linked Supabase Web Account
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Add email column for manual member tracking (if missing)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 3. Update loyalty links to handle cascading deletes properly
ALTER TABLE public.loyalty_points
DROP CONSTRAINT IF EXISTS loyalty_points_user_id_fkey,
ADD CONSTRAINT loyalty_points_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Verify restaurant_secrets has only one row (I have already run a cleanup script for this, but this is a safety check)
-- DELETE FROM public.restaurant_secrets WHERE id NOT IN (SELECT id FROM public.restaurant_secrets LIMIT 1);
