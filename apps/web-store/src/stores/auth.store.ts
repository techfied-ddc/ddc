import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { setAccessToken, api } from '../lib/api.js';
import type { Role } from '@ddc/shared';

interface AuthUser {
  id:      string;
  role:    Role;
  storeId: string | null;
}

interface AuthState {
  user:         AuthUser | null;
  setAuth:      (user: AuthUser, accessToken: string) => void;
  clearAuth:    () => void;
  fetchMe:      () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      setAuth: (user, accessToken) => {
        setAccessToken(accessToken);
        set({ user });
      },

      clearAuth: () => {
        setAccessToken(null);
        set({ user: null });
      },

      fetchMe: async () => {
        try {
          const res = await api.get('/api/v1/users/me') as { data: { user: { _id: string; role: Role; storeId?: string } } };
          const u = res.data.user;
          set({ user: { id: u._id, role: u.role, storeId: u.storeId ?? null } });
        } catch {
          get().clearAuth();
        }
      },
    }),
    {
      name:       'ddc-store-auth',
      storage:    createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
