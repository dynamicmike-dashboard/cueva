-- Add dynamic contact settings to restaurant_secrets
ALTER TABLE public.restaurant_secrets ADD COLUMN IF NOT EXISTS whatsapp_number text DEFAULT '529842312982';
ALTER TABLE public.restaurant_secrets ADD COLUMN IF NOT EXISTS facebook_url text DEFAULT 'https://facebook.com/amate38';
ALTER TABLE public.restaurant_secrets ADD COLUMN IF NOT EXISTS messenger_url text DEFAULT 'https://m.me/2023Amate';
ALTER TABLE public.restaurant_secrets ADD COLUMN IF NOT EXISTS sms_number text DEFAULT '529842312982';

-- Update existing row if it exists
UPDATE public.restaurant_secrets 
SET 
  whatsapp_number = COALESCE(whatsapp_number, '529842312982'),
  facebook_url = COALESCE(facebook_url, 'https://facebook.com/amate38'),
  messenger_url = COALESCE(messenger_url, 'https://m.me/2023Amate'),
  sms_number = COALESCE(sms_number, '529842312982')
WHERE id IN (SELECT id FROM public.restaurant_secrets ORDER BY updated_at DESC LIMIT 1);
