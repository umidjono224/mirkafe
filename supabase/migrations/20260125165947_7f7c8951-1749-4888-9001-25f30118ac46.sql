-- Create order_stats table to persist daily statistics
CREATE TABLE public.order_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  order_count INTEGER NOT NULL DEFAULT 0,
  total_revenue INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_stats ENABLE ROW LEVEL SECURITY;

-- Admin can view stats
CREATE POLICY "Anyone can view stats"
  ON public.order_stats FOR SELECT
  USING (true);

-- System can insert/update stats
CREATE POLICY "System can insert stats"
  ON public.order_stats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update stats"
  ON public.order_stats FOR UPDATE
  USING (true);

-- Create trigger to auto-update stats when order status changes to 'yetkazildi'
CREATE OR REPLACE FUNCTION public.update_order_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- When an order is marked as delivered, update stats
  IF NEW.status = 'yetkazildi' AND (OLD.status IS DISTINCT FROM 'yetkazildi') THEN
    INSERT INTO public.order_stats (date, order_count, total_revenue)
    VALUES (CURRENT_DATE, 1, NEW.total_amount)
    ON CONFLICT (date)
    DO UPDATE SET
      order_count = order_stats.order_count + 1,
      total_revenue = order_stats.total_revenue + NEW.total_amount,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to orders table
CREATE TRIGGER on_order_delivered
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_stats();

-- Also track initial orders when created and immediately delivered (edge case)
CREATE TRIGGER on_order_created_delivered
  AFTER INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'yetkazildi')
  EXECUTE FUNCTION public.update_order_stats();