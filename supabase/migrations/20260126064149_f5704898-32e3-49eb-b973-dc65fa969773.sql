-- Enable realtime for promotions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.promotions;

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;