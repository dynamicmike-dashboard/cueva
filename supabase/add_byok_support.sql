-- Add columns for BYOK (Bring Your Own Key) to restaurant_secrets
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurant_secrets' AND column_name='openai_key') THEN
        ALTER TABLE public.restaurant_secrets ADD COLUMN openai_key text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurant_secrets' AND column_name='tinytalk_key') THEN
        ALTER TABLE public.restaurant_secrets ADD COLUMN tinytalk_key text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurant_secrets' AND column_name='tinytalk_agent_id') THEN
        ALTER TABLE public.restaurant_secrets ADD COLUMN tinytalk_agent_id text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurant_secrets' AND column_name='resend_key') THEN
        ALTER TABLE public.restaurant_secrets ADD COLUMN resend_key text;
    END IF;
END $$;
