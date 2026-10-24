-- ============================================================
-- AMATE 38 — Reviews table (private 1-3 star feedback inbox)
-- Run this in the Supabase SQL Editor after 00_init.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 3),
  name text NOT NULL,
  email text NOT NULL,
  review text NOT NULL,
  responded boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public can INSERT (submit a review)
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
CREATE POLICY "Anyone can submit a review"
  ON public.reviews FOR INSERT
  WITH CHECK ( true );

-- Only service role (server) can read all reviews
DROP POLICY IF EXISTS "Service role manages reviews" ON public.reviews;
CREATE POLICY "Service role manages reviews"
  ON public.reviews FOR ALL
  USING ( true );
