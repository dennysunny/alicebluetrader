import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { authService } from '../services/authService';
import { wsService } from '../services/websocketService';
import { Logger } from '../utils/logger';
import type { AuthSession, LoginCredentials, UserProfile } from '../types';

// ============================================================
// AUTH STORE
// ============================================================

interface AuthState {
  session: AuthSession | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  immer((set, get) => ({
    // Initial state
    session: null,
    profile: null,
    isLoading: false,
    isInitialized: false,
    error: null,

    // Try restoring session on app start
    initialize: async () => {
      try {
        const session = await authService.restoreSession();

        if (session) {
          const profile = await authService.getUserProfile();
          wsService.connect(session.userId, session.sessionToken);

          set((state) => {
            state.session = session;
            state.profile = profile;
            state.isInitialized = true;
          });
        } else {
          set((state) => {
            state.isInitialized = true;
          });
        }
      } catch (error) {
        Logger.error('Session restore failed', error);
        set((state) => {
          state.isInitialized = true;
        });
      }
    },

    login: async (credentials: LoginCredentials) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const session = await authService.login(credentials);
        const profile = await authService.getUserProfile();

        wsService.connect(session.userId, session.sessionToken);

        set((state) => {
          state.session = session;
          state.profile = profile;
          state.isLoading = false;
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Login failed';
        Logger.error('Login failed', error);

        set((state) => {
          state.isLoading = false;
          state.error = message;
        });

        throw error;
      }
    },

    logout: async () => {
      const { session } = get();
      if (!session) return;

      set((state) => {
        state.isLoading = true;
      });

      try {
        wsService.disconnect();
        await authService.logout(session);

        set((state) => {
          state.session = null;
          state.profile = null;
          state.isLoading = false;
        });
      } catch (error) {
        Logger.error('Logout failed', error);
        set((state) => {
          state.session = null;
          state.profile = null;
          state.isLoading = false;
        });
      }
    },

    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },
  })),
);

// Selector hooks for optimized re-renders
export const useIsAuthenticated = () =>
  useAuthStore((s) => s.session !== null);
export const useSession = () => useAuthStore((s) => s.session);
export const useUserProfile = () => useAuthStore((s) => s.profile);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthError = () => useAuthStore((s) => s.error);
