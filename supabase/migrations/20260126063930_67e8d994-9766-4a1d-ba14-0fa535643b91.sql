-- Create promotions table for banner images
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- RLS policies for promotions
CREATE POLICY "Promotions are viewable by everyone" 
ON public.promotions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert promotions" 
ON public.promotions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update promotions" 
ON public.promotions 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete promotions" 
ON public.promotions 
FOR DELETE 
USING (true);

-- Create notifications table for broadcast messages
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Notifications are viewable by everyone" 
ON public.notifications 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete notifications" 
ON public.notifications 
FOR DELETE 
USING (true);

-- Create user_notification_reads table to track which notifications users have seen
CREATE TABLE public.user_notification_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

-- Enable RLS
ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_notification_reads
CREATE POLICY "Users can view their own reads" 
ON public.user_notification_reads 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own reads" 
ON public.user_notification_reads 
FOR INSERT 
WITH CHECK (true);

-- Create storage bucket for promotion images
INSERT INTO storage.buckets (id, name, public) VALUES ('promotions', 'promotions', true);

-- Storage policies for promotions bucket
CREATE POLICY "Promotion images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'promotions');

CREATE POLICY "Anyone can upload promotion images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'promotions');

CREATE POLICY "Anyone can delete promotion images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'promotions');

-- Add trigger for updated_at
CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();