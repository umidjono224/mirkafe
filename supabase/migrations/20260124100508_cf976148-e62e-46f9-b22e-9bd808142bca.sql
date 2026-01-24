-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Allow anyone to view product images
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow uploads (no auth required for admin panel)
CREATE POLICY "Anyone can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- Allow updates
CREATE POLICY "Anyone can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

-- Allow deletes
CREATE POLICY "Anyone can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');

-- Add RLS policies for products table (add/edit/delete)
CREATE POLICY "Anyone can insert products"
ON public.products FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update products"
ON public.products FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete products"
ON public.products FOR DELETE
USING (true);

-- Add RLS policies for categories table management
CREATE POLICY "Anyone can insert categories"
ON public.categories FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update categories"
ON public.categories FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete categories"
ON public.categories FOR DELETE
USING (true);