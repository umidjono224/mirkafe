-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to clean up old delivered orders
CREATE OR REPLACE FUNCTION public.cleanup_delivered_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.orders
  WHERE status = 'yetkazildi'
    AND updated_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Schedule the cleanup job to run every 5 minutes
SELECT cron.schedule(
  'cleanup-delivered-orders',
  '*/5 * * * *',
  $$SELECT public.cleanup_delivered_orders()$$
);