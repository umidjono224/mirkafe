import { createContext, useContext, type ReactNode } from 'react';
import { useUserController, type User } from '@/hooks/useUserController';

type UserContextValue = ReturnType<typeof useUserController>;

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const value = useUserController();
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Public hook used across the app (single source of truth via UserProvider)
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within <UserProvider />');
  }
  return ctx;
}

export type { User };
