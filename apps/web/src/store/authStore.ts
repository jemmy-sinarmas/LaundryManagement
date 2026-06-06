import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@laundry-palu/shared';

type AuthUser = { id: string; nama: string; role: UserRole };

type AuthState = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clear: () => set({ user: null }),
    }),
    { name: 'auth-store' }
  )
);
