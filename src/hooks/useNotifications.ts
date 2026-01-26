import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  message: string;
  created_at: string;
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Get all notifications
      const { data: allNotifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifError) throw notifError;

      // Get read notifications for this user
      const { data: reads, error: readsError } = await supabase
        .from('user_notification_reads')
        .select('notification_id')
        .eq('user_id', userId);

      if (readsError) throw readsError;

      const readIds = new Set(reads?.map(r => r.notification_id) || []);
      const unread = (allNotifications || []).filter(n => !readIds.has(n.id));

      setNotifications(allNotifications || []);
      setUnreadNotifications(unread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    if (!userId) return;

    try {
      await supabase
        .from('user_notification_reads')
        .insert({
          user_id: userId,
          notification_id: notificationId,
        });

      setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!userId || unreadNotifications.length === 0) return;

    try {
      const inserts = unreadNotifications.map(n => ({
        user_id: userId,
        notification_id: n.id,
      }));

      await supabase
        .from('user_notification_reads')
        .insert(inserts);

      setUnreadNotifications([]);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return {
    notifications,
    unreadNotifications,
    unreadCount: unreadNotifications.length,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}

// Admin hook for sending notifications
export function useAdminNotifications() {
  const [sending, setSending] = useState(false);

  const sendNotification = async (message: string) => {
    if (!message.trim()) {
      throw new Error('Xabar matnini kiriting');
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({ message: message.trim() });

      if (error) throw error;
    } finally {
      setSending(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  };

  return {
    sendNotification,
    deleteNotification,
    sending,
  };
}
