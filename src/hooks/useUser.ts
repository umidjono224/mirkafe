import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from '@/lib/deviceId';

export interface User {
  id: string;
  phone_number: string;
  name: string;
  device_id: string;
  last_address: string | null;
  last_lat: number | null;
  last_lng: number | null;
  created_at: string;
  updated_at: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const deviceId = getDeviceId();

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setUser(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Foydalanuvchi ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const register = async (name: string, phoneNumber: string) => {
    try {
      setLoading(true);
      
      // Check if phone number already exists
      const { data: existingPhone } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (existingPhone) {
        throw new Error('Bu telefon raqami allaqachon ro\'yxatdan o\'tgan');
      }

      // Check if device already registered
      const { data: existingDevice } = await supabase
        .from('users')
        .select('id')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (existingDevice) {
        throw new Error('Bu qurilma allaqachon ro\'yxatdan o\'tgan');
      }

      const { data, error: insertError } = await supabase
        .from('users')
        .insert({
          name,
          phone_number: phoneNumber,
          device_id: deviceId,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setUser(data);
      setError(null);
      return data;
    } catch (err: any) {
      console.error('Registration error:', err);
      const message = err.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates: Partial<Pick<User, 'name' | 'phone_number' | 'last_address' | 'last_lat' | 'last_lng'>>) => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setUser(data);
      return data;
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || 'Ma\'lumotlarni yangilashda xatolik');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    register,
    updateUser,
    refetch: fetchUser,
    isRegistered: !!user,
  };
}
