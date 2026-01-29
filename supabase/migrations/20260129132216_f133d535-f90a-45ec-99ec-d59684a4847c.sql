-- Add telegram_user_id column for Telegram WebApp authentication
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telegram_user_id text;

-- Make device_id nullable for multi-device support
ALTER TABLE public.users ALTER COLUMN device_id DROP NOT NULL;

-- Create unique index on telegram_user_id (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_user_id_unique 
ON public.users (telegram_user_id) 
WHERE telegram_user_id IS NOT NULL;