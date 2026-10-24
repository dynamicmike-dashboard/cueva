-- 20240407_add_phone_to_reservations.sql
-- Add a phone column to the reservations table for WhatsApp/SMS notifications.
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Backfill existing rows with empty string to avoid nulls.
UPDATE public.reservations
SET phone = ''
WHERE phone IS NULL;
