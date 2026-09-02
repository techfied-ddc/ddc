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
  isHydrated:   boolean;
  // Actions
  setAuth:      (user: AuthUser, accessToken: string) => void;
  clearAuth:    () => void;
  hydrateToken: (accessToken: string) => void;
  fetchMe:      () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:       null,
      isHydrated: false,

      setAuth: (user, accessToken) => {
        setAccessToken(accessToken);
        set({ user });
      },

      clearAuth: () => {
        setAccessToken(null);
        set({ user: null });
      },

      hydrateToken: (accessToken) => {
        setAccessToken(accessToken);
        set({ isHydrated: true });
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
      name:    'ddc-auth',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist user identity, never the access token (keep in memory)
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => () => {
        // After rehydration, attempt a token refresh to re-establish session
        useAuthStore.getState();
      },
    },
  ),
);
