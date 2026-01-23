-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('tayyorlanmoqda', 'yetkazilmoqda', 'yetkazildi');

-- Create categories table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create users table (device-bound, one phone = one device)
CREATE TABLE public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    device_id TEXT NOT NULL UNIQUE,
    last_address TEXT,
    last_lat DOUBLE PRECISION,
    last_lng DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    status order_status NOT NULL DEFAULT 'tayyorlanmoqda',
    address TEXT NOT NULL,
    address_lat DOUBLE PRECISION,
    address_lng DOUBLE PRECISION,
    total_amount INTEGER NOT NULL,
    items JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read)
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT 
USING (true);

-- Products policies (public read)
CREATE POLICY "Products are viewable by everyone" 
ON public.products FOR SELECT 
USING (true);

-- Users policies (users can manage their own data)
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (true);

-- Orders policies
CREATE POLICY "Users can view all orders" 
ON public.orders FOR SELECT 
USING (true);

CREATE POLICY "Users can create orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update orders" 
ON public.orders FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Insert default categories
INSERT INTO public.categories (name, slug, sort_order) VALUES
('Taomlar', 'meals', 1),
('Ichimliklar', 'drinks', 2),
('Salatlar', 'salads', 3),
('Boshqalar', 'others', 4);

-- Insert sample products
INSERT INTO public.products (category_id, name, price, is_available, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'meals'), 'Lavash', 35000, true, 1),
((SELECT id FROM public.categories WHERE slug = 'meals'), 'Burger', 30000, true, 2),
((SELECT id FROM public.categories WHERE slug = 'meals'), 'Shashlik', 45000, true, 3),
((SELECT id FROM public.categories WHERE slug = 'meals'), 'Pizza', 50000, true, 4),
((SELECT id FROM public.categories WHERE slug = 'drinks'), 'Coca Cola', 8000, true, 1),
((SELECT id FROM public.categories WHERE slug = 'drinks'), 'Fanta', 8000, true, 2),
((SELECT id FROM public.categories WHERE slug = 'drinks'), 'Choy', 5000, true, 3),
((SELECT id FROM public.categories WHERE slug = 'salads'), 'Sezar salati', 25000, true, 1),
((SELECT id FROM public.categories WHERE slug = 'salads'), 'Ovqat salati', 15000, true, 2),
((SELECT id FROM public.categories WHERE slug = 'others'), 'Non', 3000, true, 1),
((SELECT id FROM public.categories WHERE slug = 'others'), 'Sous', 2000, true, 2);