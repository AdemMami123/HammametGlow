'use client';

import { useAuthSync } from '@/hooks/useAuthSync';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Sync Firebase auth state with Zustand store
  useAuthSync();

  return <>{children}</>;
}
