// Telegram WebApp detection and user ID extraction

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          auth_date?: number;
          hash?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
      };
    };
  }
}

/**
 * Check if the app is running inside Telegram WebView
 */
export function isTelegramWebApp(): boolean {
  return !!(window.Telegram?.WebApp?.initData && window.Telegram.WebApp.initData.length > 0);
}

/**
 * Get Telegram user ID if available
 * Returns null if not in Telegram or user data is not available
 */
export function getTelegramUserId(): string | null {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (user?.id) {
    return user.id.toString();
  }
  return null;
}

/**
 * Get Telegram user's name if available
 */
export function getTelegramUserName(): string | null {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (user) {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return fullName || user.username || null;
  }
  return null;
}

/**
 * Initialize Telegram WebApp if available
 */
export function initTelegramWebApp(): void {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  }
}

/**
 * Get unique identifier for the current user
 * Priority: Telegram User ID > stored phone number identifier
 */
export function getUserIdentifier(): { type: 'telegram' | 'phone' | 'none'; value: string | null } {
  const telegramId = getTelegramUserId();
  if (telegramId) {
    return { type: 'telegram', value: telegramId };
  }
  
  // No automatic identifier available outside Telegram
  return { type: 'none', value: null };
}
