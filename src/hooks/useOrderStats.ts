import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DailyStats {
  date: string;
  order_count: number;
  total_revenue: number;
}

export interface TotalStats {
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  totalUsers: number;
}

export function useOrderStats() {
  const [stats, setStats] = useState<TotalStats>({
    totalOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch all stats from order_stats table
      const { data: statsData, error: statsError } = await supabase
        .from('order_stats')
        .select('*');
      
      if (statsError) {
        console.error('Error fetching stats:', statsError);
      }
      
      // Fetch total users count
      const { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (usersError) {
        console.error('Error fetching users count:', usersError);
      }
      
      // Calculate totals
      let totalOrders = 0;
      let totalRevenue = 0;
      let todayOrders = 0;
      let todayRevenue = 0;
      
      if (statsData) {
        for (const stat of statsData) {
          totalOrders += stat.order_count;
          totalRevenue += stat.total_revenue;
          
          if (stat.date === today) {
            todayOrders = stat.order_count;
            todayRevenue = stat.total_revenue;
          }
        }
      }
      
      setStats({
        totalOrders,
        totalRevenue,
        todayOrders,
        todayRevenue,
        totalUsers: usersCount || 0,
      });
    } catch (err) {
      console.error('Error in useOrderStats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    refetch: fetchStats,
  };
}
