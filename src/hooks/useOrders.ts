import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from './useCart';

export type OrderStatus = 'tayyorlanmoqda' | 'yetkazilmoqda' | 'yetkazildi';

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  address: string;
  address_lat: number | null;
  address_lng: number | null;
  total_amount: number;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderWithUser extends Order {
  user?: {
    name: string;
    phone_number: string;
  };
}

export function useOrders(userId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Parse items from JSON
      const parsedOrders = (data || []).map((order) => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      }));

      setOrders(parsedOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Buyurtmalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchOrders]);

  const createOrder = async (
    cartItems: CartItem[],
    address: string,
    lat?: number,
    lng?: number
  ) => {
    if (!userId) throw new Error('Foydalanuvchi topilmadi');

    try {
      const total = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );

      const { data, error: insertError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          items: JSON.parse(JSON.stringify(cartItems)),
          total_amount: total,
          address,
          address_lat: lat || null,
          address_lng: lng || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchOrders();
      return data;
    } catch (err: any) {
      console.error('Error creating order:', err);
      throw new Error(err.message || 'Buyurtma yaratishda xatolik');
    }
  };

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    createOrder,
  };
}

// Hook for admin to fetch all orders
export function useAllOrders() {
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Get unique user IDs
      const userIds = [...new Set(ordersData?.map((o) => o.user_id) || [])];
      
      // Fetch users
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, phone_number')
        .in('id', userIds);

      const usersMap = new Map(usersData?.map((u) => [u.id, u]) || []);

      // Combine orders with user data
      const ordersWithUsers = (ordersData || []).map((order) => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        user: usersMap.get(order.user_id),
      }));

      setOrders(ordersWithUsers);
      setError(null);
    } catch (err) {
      console.error('Error fetching all orders:', err);
      setError('Buyurtmalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('all-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchAllOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllOrders]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (updateError) throw updateError;

      await fetchAllOrders();
    } catch (err: any) {
      console.error('Error updating order status:', err);
      throw new Error(err.message || 'Status yangilashda xatolik');
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      // Simply delete the order - it won't be added to stats since stats only update on 'yetkazildi' status
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (deleteError) throw deleteError;

      await fetchAllOrders();
    } catch (err: any) {
      console.error('Error canceling order:', err);
      throw new Error(err.message || 'Buyurtmani bekor qilishda xatolik');
    }
  };

  return {
    orders,
    loading,
    error,
    refetch: fetchAllOrders,
    updateOrderStatus,
    cancelOrder,
  };
}
