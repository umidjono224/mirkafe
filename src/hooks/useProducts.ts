import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
}

export function useProducts() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [categoriesRes, productsRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('products').select('*').eq('is_available', true).order('sort_order'),
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (productsRes.error) throw productsRes.error;

      setCategories(categoriesRes.data || []);
      setProducts(productsRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Mahsulotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const getProductsByCategory = (categoryId: string) => {
    return products.filter((p) => p.category_id === categoryId);
  };

  const createCategory = async (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0);
    
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug, sort_order: maxOrder + 1 })
      .select()
      .single();
    
    if (error) throw error;
    await fetchData();
    return data;
  };

  const deleteCategory = async (categoryId: string) => {
    // First check if any products use this category
    const productsInCategory = products.filter(p => p.category_id === categoryId);
    if (productsInCategory.length > 0) {
      throw new Error('Bu kategoriyada mahsulotlar bor. Avval mahsulotlarni o\'chiring yoki boshqa kategoriyaga o\'tkazing.');
    }
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);
    
    if (error) throw error;
    await fetchData();
  };

  const updateCategoryOrder = async (categoryId: string, newOrder: number) => {
    const { error } = await supabase
      .from('categories')
      .update({ sort_order: newOrder })
      .eq('id', categoryId);
    
    if (error) throw error;
    await fetchData();
  };

  const reorderCategories = async (orderedIds: string[]) => {
    // Update each category with its new sort order
    const updates = orderedIds.map((id, index) => 
      supabase
        .from('categories')
        .update({ sort_order: index })
        .eq('id', id)
    );
    
    await Promise.all(updates);
    await fetchData();
  };

  return {
    categories,
    products,
    loading,
    error,
    refetch: fetchData,
    getProductsByCategory,
    createCategory,
    deleteCategory,
    updateCategoryOrder,
    reorderCategories,
  };
}
