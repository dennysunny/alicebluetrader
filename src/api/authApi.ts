import { httpClient } from './httpClient';
import type { AuthSession, UserProfile, LoginCredentials } from '../types';

// ============================================================
// ALICE BLUE AUTH API
// Based on: https://ant.aliceblueonline.com/productdocumentation/
// ============================================================

interface EncryptionKeyResponse {
  encKey: string;
}

interface SessionResponse {
  userSession: string;
}

export const authApi = {
  /**
   * Step 1: Fetch SHA-256 encryption key for password hashing
   */
  getEncryptionKey: async (userId: string): Promise<string> => {
    const data = await httpClient.post<EncryptionKeyResponse>(
      '/customer/getEncryptionKey',
      { userId },
      undefined,
      { maxRetries: 1, retryDelay: 500, retryCondition: () => false },
    );
    return data.encKey;
  },

  /**
   * Step 2: Login with userId + SHA-256 hashed password
   * The password is: SHA256(userId + SHA256(password) + encryptionKey)
   */
  login: async (credentials: LoginCredentials & { hashedPassword: string }): Promise<string> => {
    const data = await httpClient.post<SessionResponse>(
      '/customer/getUserSID',
      {
        userId: credentials.userId,
        userData: credentials.hashedPassword,
      },
      undefined,
      { maxRetries: 0, retryDelay: 0, retryCondition: () => false },
    );
    return data.userSession;
  },

  /**
   * Fetch user profile after successful authentication
   */
  getUserProfile: async (): Promise<UserProfile> => {
    return httpClient.get<UserProfile>('/customer/accountDetails');
  },

  /**
   * Invalidate current session
   */
  logout: async (): Promise<void> => {
    await httpClient.delete('/customer/logout');
  },
};
