import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Promotion {
  id: string;
  image_url: string;
  title: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPromotions();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`promotions-changes-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promotions',
        },
        () => {
          fetchPromotions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setPromotions(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      setError('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const createPromotion = async (imageUrl: string, title?: string) => {
    const maxOrder = promotions.reduce((max, p) => Math.max(max, p.sort_order), 0);
    
    const { data, error } = await supabase
      .from('promotions')
      .insert({
        image_url: imageUrl,
        title: title || null,
        sort_order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchPromotions();
    return data;
  };

  const deletePromotion = async (promotionId: string) => {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', promotionId);

    if (error) throw error;
    await fetchPromotions();
  };

  return {
    promotions,
    loading,
    error,
    hasPromotions: promotions.length > 0,
    refetch: fetchPromotions,
    createPromotion,
    deletePromotion,
  };
}
