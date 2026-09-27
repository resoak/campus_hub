import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens } from '../types';
import { authService, getAccessToken, setAccessToken } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.login({ email, password });
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : '登入失敗';
          set({ error: message, isLoading: false, isAuthenticated: false, user: null });
          throw error;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.register({ username, email, password });
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : '註冊失敗';
          set({ error: message, isLoading: false, isAuthenticated: false, user: null });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch {
          // ignore logout error
        } finally {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      checkAuth: async () => {
        const token = getAccessToken();
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
          set({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const user = JSON.parse(storedUser);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ isAuthenticated: false, user: null, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);