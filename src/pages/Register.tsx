import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isValidUzPhone, normalizePhone } from '@/lib/formatters';
import { isTelegramWebApp, getTelegramUserName } from '@/lib/telegram';
import { toast } from 'sonner';

export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useUser();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill name from Telegram if available
  useEffect(() => {
    if (isTelegramWebApp()) {
      const telegramName = getTelegramUserName();
      if (telegramName && !name) {
        setName(telegramName);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Ismingizni kiriting');
      return;
    }

    if (!isValidUzPhone(phone)) {
      toast.error('Telefon raqamni to\'g\'ri kiriting');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name.trim(), normalizePhone(phone));
      // Navigation is handled by App.tsx when isRegistered becomes true
      // Don't reset isSubmitting on success - let the component unmount
    } catch (err: any) {
      // Only show error for actual failures, not for existing users
      if (!err.message?.includes('allaqachon')) {
        toast.error(err.message);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <motion.img
            src="/logo.png"
            alt="MirCafe"
            className="w-28 h-28 mx-auto mb-4 rounded-3xl shadow-button object-cover"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          />
          <h1 className="text-3xl font-bold text-fire mb-2">MirCafe</h1>
          <p className="text-muted-foreground">Mazali taomlar tez yetkazib beriladi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Ismingiz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 text-lg rounded-2xl border-2 focus:border-primary"
              disabled={isSubmitting || loading}
            />
          </div>
          
          <div>
            <Input
              type="tel"
              placeholder="+998 XX XXX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-14 text-lg rounded-2xl border-2 focus:border-primary"
              disabled={isSubmitting || loading}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full h-14 text-lg font-semibold rounded-2xl bg-fire text-primary-foreground shadow-button hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? 'Yuklanmoqda...' : 'Kirish'}
          </Button>
        </form>

        {isTelegramWebApp() && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Telegram orqali ulangan
          </p>
        )}
      </motion.div>
    </div>
  );
}
