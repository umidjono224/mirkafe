-- Allow deletion of orders (for admin cancel functionality)
CREATE POLICY "Anyone can delete orders" 
ON public.orders 
FOR DELETE 
USING (true);