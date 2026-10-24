-- AMATE 38 - RLS RECURSION FIX (March 19, 2026)
-- Run this in your Supabase SQL Editor to resolve the "infinite recursion" error.

-- 1. DROP Problematic Policies
DROP POLICY IF EXISTS "Admins can see everything" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;

-- 2. CREATE Clean Policies for Profiles
-- Users can view their own profile (Standard check)
CREATE POLICY "Users view own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
-- Users can Update their own profile
CREATE POLICY "Users update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 3. FIX Loyalty Points Recursion
DROP POLICY IF EXISTS "Users view own points" ON public.loyalty_points;
CREATE POLICY "Users view points own" ON public.loyalty_points FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4. PERMISSIVE Policy for Service Role (Optional but safe)
-- The Supabase Service Role Key bypasses these checks by default.
-- If the error persists, it usually means a FUNCTION (e.g. check_is_admin) 
-- is querying 'profiles' which triggers RLS again.
