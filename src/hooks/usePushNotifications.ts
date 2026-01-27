import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PushState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  loading: boolean;
}

export function usePushNotifications(userId?: string) {
  const [state, setState] = useState<PushState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState(prev => ({ ...prev, isSupported: false, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setState(prev => ({
          ...prev,
          isSubscribed: !!subscription,
          permission: Notification.permission,
          loading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          permission: Notification.permission,
          loading: false,
        }));
      }
    } catch (err) {
      console.error('Error checking push subscription:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) return null;

    try {
      // Register the push-specific service worker
      const registration = await navigator.serviceWorker.register('/sw-push.js', {
        scope: '/',
      });
      
      // Wait for it to be active
      if (registration.installing) {
        await new Promise<void>((resolve) => {
          registration.installing!.addEventListener('statechange', function onStateChange() {
            if (this.state === 'activated') {
              this.removeEventListener('statechange', onStateChange);
              resolve();
            }
          });
        });
      }
      
      return registration;
    } catch (err) {
      console.error('Service worker registration failed:', err);
      return null;
    }
  };

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Register service worker first
      let registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) {
        registration = await registerServiceWorker();
      }

      if (!registration) {
        throw new Error('Service worker not available');
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission !== 'granted') {
        setState(prev => ({ ...prev, loading: false }));
        return false;
      }

      // Get VAPID public key from environment
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured');
        // Still mark as subscribed for in-app notifications
        setState(prev => ({ ...prev, isSubscribed: true, loading: false }));
        return true;
      }

      // Convert VAPID key to Uint8Array
      const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray.buffer as ArrayBuffer;
      };

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Extract keys from subscription
      const subscriptionJSON = subscription.toJSON();
      const keys = subscriptionJSON.keys;

      if (!keys || !keys.p256dh || !keys.auth) {
        throw new Error('Invalid subscription keys');
      }

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) throw error;

      setState(prev => ({ ...prev, isSubscribed: true, loading: false }));
      return true;
    } catch (err) {
      console.error('Error subscribing to push:', err);
      setState(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, [userId]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await subscription.unsubscribe();

          // Remove from database
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', userId)
            .eq('endpoint', subscription.endpoint);
        }
      }

      setState(prev => ({ ...prev, isSubscribed: false, loading: false }));
      return true;
    } catch (err) {
      console.error('Error unsubscribing from push:', err);
      setState(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, [userId]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    checkSubscription,
  };
}

// Hook for admin to send push notifications
export function useAdminPushNotifications() {
  const [sending, setSending] = useState(false);

  const sendPushNotification = async (title: string, message: string) => {
    if (!title.trim() || !message.trim()) {
      throw new Error('Sarlavha va xabar matnini kiriting');
    }

    setSending(true);
    try {
      const response = await supabase.functions.invoke('send-push-notification', {
        body: { title: title.trim(), message: message.trim() },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } finally {
      setSending(false);
    }
  };

  return {
    sendPushNotification,
    sending,
  };
}
