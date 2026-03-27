import * as Keychain from 'react-native-keychain';
import { authApi } from '../api/authApi';
import { httpClient } from '../api/httpClient';
import { Logger } from '../utils/logger';
import { KEYCHAIN_SERVICE, SESSION_REFRESH_INTERVAL } from '../constants';
import type { AuthSession, LoginCredentials, UserProfile } from '../types';

// ============================================================
// CRYPTO UTILITIES
// Using native crypto for SHA-256 hashing
// ============================================================

async function sha256(input: string): Promise<string> {
  // In React Native, use a library like react-native-quick-crypto
  // This is a simplified representation
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(
  userId: string,
  password: string,
  encryptionKey: string,
): Promise<string> {
  // Alice Blue: SHA256(userId + SHA256(password) + encryptionKey)
  const passwordHash = await sha256(password);
  return sha256(userId + passwordHash + encryptionKey);
}

// ============================================================
// AUTH SERVICE
// ============================================================

class AuthService {
  private sessionRefreshTimer: ReturnType<typeof setInterval> | null = null;

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    Logger.info('Login attempt', { userId: credentials.userId });

    // Step 1: Get encryption key
    const encryptionKey = await authApi.getEncryptionKey(credentials.userId);

    // Step 2: Hash password
    const hashedPassword = await hashPassword(
      credentials.userId,
      credentials.password,
      encryptionKey,
    );

    // Step 3: Get session token
    const sessionToken = await authApi.login({
      ...credentials,
      hashedPassword,
    });

    const session: AuthSession = {
      userId: credentials.userId,
      sessionToken,
      encryptionKey,
      expiresAt: Date.now() + SESSION_REFRESH_INTERVAL,
    };

    // Persist session securely
    await this.saveSession(session);

    // Configure HTTP client with token
    httpClient.setTokenProvider(() => sessionToken);

    Logger.info('Login successful', { userId: credentials.userId });
    return session;
  }

  async logout(session: AuthSession): Promise<void> {
    try {
      await authApi.logout();
    } catch (error) {
      Logger.warn('Logout API call failed, clearing local session anyway', error);
    } finally {
      await this.clearSession();
      this.stopSessionRefresh();
      httpClient.setTokenProvider(() => null);
      Logger.info('Logged out');
    }
  }

  async restoreSession(): Promise<AuthSession | null> {
    const session = await this.loadSession();
    if (!session) return null;

    if (this.isSessionExpired(session)) {
      await this.clearSession();
      return null;
    }

    // Restore token provider
    httpClient.setTokenProvider(() => session.sessionToken);
    this.startSessionRefresh(session);

    Logger.info('Session restored', { userId: session.userId });
    return session;
  }

  async getUserProfile(): Promise<UserProfile> {
    return authApi.getUserProfile();
  }

  startSessionRefresh(session: AuthSession): void {
    this.stopSessionRefresh();
    const timeUntilExpiry = session.expiresAt - Date.now();
    const refreshAt = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000); // 5min before expiry

    this.sessionRefreshTimer = setInterval(() => {
      Logger.info('Session refresh triggered');
      // In production: implement token refresh flow
    }, refreshAt);
  }

  stopSessionRefresh(): void {
    if (this.sessionRefreshTimer) {
      clearInterval(this.sessionRefreshTimer);
      this.sessionRefreshTimer = null;
    }
  }

  private isSessionExpired(session: AuthSession): boolean {
    return Date.now() >= session.expiresAt;
  }

  private async saveSession(session: AuthSession): Promise<void> {
    await Keychain.setGenericPassword(
      session.userId,
      JSON.stringify(session),
      { service: KEYCHAIN_SERVICE, accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED },
    );
  }

  private async loadSession(): Promise<AuthSession | null> {
    const credentials = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });

    if (!credentials) return null;

    try {
      return JSON.parse(credentials.password) as AuthSession;
    } catch {
      return null;
    }
  }

  private async clearSession(): Promise<void> {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  }
}

export const authService = new AuthService();
