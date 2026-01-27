import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';

interface PushNotificationPromptProps {
  userId?: string;
}

export default function PushNotificationPrompt({ userId }: PushNotificationPromptProps) {
  const { isSupported, isSubscribed, permission, subscribe, loading } = usePushNotifications(userId);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already been prompted
    const hasBeenPrompted = localStorage.getItem('mircafe_push_prompted');
    
    // Show prompt if:
    // - User is registered (has userId)
    // - Push is supported
    // - Not already subscribed
    // - Permission not already granted or denied
    // - Not loading
    // - Not already prompted
    // - Not dismissed in this session
    if (
      userId &&
      isSupported &&
      !isSubscribed &&
      permission === 'default' &&
      !loading &&
      !hasBeenPrompted &&
      !dismissed
    ) {
      // Delay showing the prompt to avoid being intrusive
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [userId, isSupported, isSubscribed, permission, loading, dismissed]);

  const handleEnable = useCallback(async () => {
    localStorage.setItem('mircafe_push_prompted', 'true');
    setShowPrompt(false);
    await subscribe();
  }, [subscribe]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem('mircafe_push_prompted', 'true');
    setShowPrompt(false);
    setDismissed(true);
  }, []);

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-[55] safe-bottom"
      >
        <div className="bg-card rounded-2xl shadow-float border border-border p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm mb-1">Bildirishnomalarni yoqasizmi?</p>
              <p className="text-xs text-muted-foreground mb-3">
                Buyurtma holati va maxsus takliflar haqida xabar oling
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleEnable}
                  size="sm"
                  className="h-8 px-4 rounded-lg text-xs"
                >
                  Yoqish
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-4 rounded-lg text-xs text-muted-foreground"
                >
                  Keyinroq
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
