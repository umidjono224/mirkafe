import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';

interface NotificationToastProps {
  userId?: string;
}

export default function NotificationToast({ userId }: NotificationToastProps) {
  const { unreadNotifications, markAsRead } = useNotifications(userId);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [shownIds, setShownIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Find the first unread notification that hasn't been shown yet
    const unshown = unreadNotifications.find(n => !shownIds.has(n.id));
    
    if (unshown && !currentNotification) {
      setCurrentNotification(unshown);
      setShownIds(prev => new Set([...prev, unshown.id]));
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        handleDismiss(unshown.id);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [unreadNotifications, currentNotification, shownIds]);

  const handleDismiss = (notificationId: string) => {
    markAsRead(notificationId);
    setCurrentNotification(null);
  };

  return (
    <AnimatePresence>
      {currentNotification && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[60] safe-top"
        >
          <div className="mx-4 mt-4 bg-card rounded-2xl shadow-float border border-border p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-primary mb-1">MirCafe</p>
                <p className="text-sm text-foreground">{currentNotification.message}</p>
              </div>
              <button
                onClick={() => handleDismiss(currentNotification.id)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
