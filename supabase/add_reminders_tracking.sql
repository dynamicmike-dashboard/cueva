-- Add columns for the Reminder Automation Engine
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservations' AND column_name='reminded') THEN
        ALTER TABLE public.reservations ADD COLUMN reminded boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservations' AND column_name='restaurant') THEN
        ALTER TABLE public.reservations ADD COLUMN restaurant text DEFAULT 'Amate 38';
    END IF;
END $$;
