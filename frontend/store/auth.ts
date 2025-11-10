import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  uid: string;
  email: string | null;
  username?: string;
  displayName: string | null;
  photoURL: string | null;
  role?: 'citizen' | 'admin' | 'moderator';
  points?: number;
  level?: number;
  badges?: string[];
  location?: {
    latitude: number;
    longitude: number;
    locationName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      logout: () => set({ user: null, isAuthenticated: false, error: null }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
