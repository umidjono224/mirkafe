import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isTelegramWebApp, getTelegramUserId, initTelegramWebApp } from '@/lib/telegram';

export interface User {
  id: string;
  phone_number: string;
  name: string;
  device_id: string | null;
  telegram_user_id: string | null;
  last_address: string | null;
  last_lat: number | null;
  last_lng: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Internal controller hook.
 * IMPORTANT: Use via <UserProvider/> + useUser() to avoid multiple instances.
 */
export function useUserController() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Telegram WebApp on mount
  useEffect(() => {
    initTelegramWebApp();
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);

      // Priority 1: Check for Telegram user
      if (isTelegramWebApp()) {
        const telegramId = getTelegramUserId();
        if (telegramId) {
          const { data, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_user_id', telegramId)
            .maybeSingle();

          if (fetchError) throw fetchError;

          if (data) {
            setUser(data as User);
            setError(null);
            return;
          }
        }
      }

      // Priority 2: Check local storage for saved phone number
      const savedPhone = localStorage.getItem('mircafe_user_phone');
      if (savedPhone) {
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('phone_number', savedPhone)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          setUser(data as User);
          setError(null);
          return;
        }
      }

      // No user found
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError("Foydalanuvchi ma'lumotlarini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const register = async (name: string, phoneNumber: string) => {
    try {
      setLoading(true);

      const telegramId = isTelegramWebApp() ? getTelegramUserId() : null;

      // Check if user already exists by Telegram ID
      if (telegramId) {
        const { data: existingTelegram } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_user_id', telegramId)
          .maybeSingle();

        if (existingTelegram) {
          setUser(existingTelegram as User);
          localStorage.setItem('mircafe_user_phone', existingTelegram.phone_number);
          setError(null);
          return existingTelegram;
        }
      }

      // Check if user already exists by phone number
      const { data: existingPhone } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (existingPhone) {
        // Update telegram_user_id if we have it and it's not set
        if (telegramId && !existingPhone.telegram_user_id) {
          await supabase
            .from('users')
            .update({ telegram_user_id: telegramId })
            .eq('id', existingPhone.id);
          existingPhone.telegram_user_id = telegramId;
        }

        setUser(existingPhone as User);
        localStorage.setItem('mircafe_user_phone', existingPhone.phone_number);
        setError(null);
        return existingPhone;
      }

      // New user - create account
      const { data, error: insertError } = await supabase
        .from('users')
        .insert({
          name,
          phone_number: phoneNumber,
          telegram_user_id: telegramId,
          device_id: null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUser(data as User);
      localStorage.setItem('mircafe_user_phone', phoneNumber);
      setError(null);
      return data;
    } catch (err: any) {
      console.error('Registration error:', err);
      const message = err.message || "Ro'yxatdan o'tishda xatolik yuz berdi";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (
    updates: Partial<Pick<User, 'name' | 'phone_number' | 'last_address' | 'last_lat' | 'last_lng'>>,
  ) => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setUser(data as User);

      if (updates.phone_number) {
        localStorage.setItem('mircafe_user_phone', updates.phone_number);
      }

      return data;
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || "Ma'lumotlarni yangilashda xatolik");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('mircafe_user_phone');
    setUser(null);
  };

  return {
    user,
    loading,
    error,
    register,
    updateUser,
    logout,
    refetch: fetchUser,
    isRegistered: !!user,
  };
}
